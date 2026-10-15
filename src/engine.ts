import { parseCss, type ParsedCss } from "./css";
import { Dom, escapeText, openTag, snippet } from "./dom";
import { ComputedStyles, StaticStyles, type StyleProvider } from "./style";
import { criterion } from "./wcag";
import { score } from "./score";
import {
  SEVERITIES,
  severityRank,
  type AuditOptions,
  type AuditResult,
  type Finding,
  type FixOp,
  type Incomplete,
  type Level,
  type RuleMeta,
  type Severity,
  type Text,
} from "./types";

export interface CssSource {
  text: string;
  /** The <style> or <link> element the CSS came from, or null for CSS passed in options. */
  owner: Element | null;
}

export interface Report {
  el: Element;
  message: Text;
  fix: {
    summary: Text;
    ops?: FixOp[];
    /** Element the ops apply to, when it is not `el` (must be `el` or a descendant). */
    target?: Element;
    safe?: boolean;
    /** Explicit patched code, when ops cannot express it. */
    after?: string;
    before?: string;
  };
  severity?: Severity;
  data?: Record<string, unknown>;
  /** Stylesheet findings: report the CSS rule instead of the element. */
  css?: { selector: string; text: string; line?: number; column?: number };
}

export interface RuleContext {
  doc: Document;
  dom: Dom;
  style: StyleProvider;
  css: ParsedCss;
  cssSources: CssSource[];
  options: AuditOptions;
  fragment: boolean;
  /** Every element of the document in tree order, without excluded ones. */
  elements: Element[];
  report(r: Report): void;
  incomplete(el: Element, message: Text): void;
}

export interface Rule extends RuleMeta {
  run(ctx: RuleContext): void;
}

export const t = (en: string, pt: string): Text => ({ en, pt });

/** The element path from `root` to `node` as child indexes. */
function pathTo(root: Element, node: Element): number[] | null {
  const path: number[] = [];
  for (let n: Element | null = node; n && n !== root; n = n.parentElement) {
    const parent: Element | null = n.parentElement;
    if (!parent) return null;
    path.unshift(Array.from(parent.children).indexOf(n));
  }
  return path;
}

function follow(root: Element, path: number[]): Element | null {
  let n: Element | null = root;
  for (const i of path) n = n?.children[i] ?? null;
  return n;
}

/** Applies fix operations to a detached copy and returns the resulting snippet. */
export function previewFix(el: Element, ops: FixOp[], target: Element = el): string {
  const clone = el.cloneNode(true) as Element;
  const path = target === el ? [] : pathTo(el, target);
  let node: Element = (path ? follow(clone, path) : clone) ?? clone;
  let before = "";
  let replaced: string | null = null;
  let root = clone;
  const long = el.outerHTML.length > 280;
  for (const op of ops) {
    switch (op.op) {
      case "set-attr":
        node.setAttribute(op.name, op.value);
        break;
      case "remove-attr":
        node.removeAttribute(op.name);
        break;
      case "rename-attr": {
        // Rebuild the attribute list so the renamed attribute keeps its position.
        const attrs = Array.from(node.attributes).map((a) => [a.name === op.name ? op.to : a.name, a.value] as const);
        for (const a of Array.from(node.attributes)) node.removeAttribute(a.name);
        for (const [n, v] of attrs) node.setAttribute(n, v);
        break;
      }
      case "prepend":
        if (long && node === clone) return `${openTag(clone)}\n  ${op.html}\n  ...\n</${clone.localName}>`;
        node.insertAdjacentHTML("afterbegin", op.html);
        break;
      case "append":
        if (long && node === clone) return `${openTag(clone)}\n  ...\n  ${op.html}\n</${clone.localName}>`;
        node.insertAdjacentHTML("beforeend", op.html);
        break;
      case "insert-before":
        before += op.html + "\n";
        break;
      case "rename-tag": {
        const doc: Document = node.ownerDocument;
        const renamed: Element = doc.createElement(op.tag);
        for (const a of Array.from(node.attributes)) renamed.setAttribute(a.name, a.value);
        while (node.firstChild) renamed.appendChild(node.firstChild);
        if (node === clone) root = renamed;
        else node.replaceWith(renamed);
        node = renamed;
        break;
      }
      case "replace":
        replaced = op.html;
        break;
      case "remove":
        replaced = "";
        break;
    }
  }
  if (replaced !== null) return before + replaced;
  return before + snippet(root, 400);
}

/**
 * Applies a finding's fix to the live DOM (the element it was found on, or its fix target).
 * Useful in browsers and tests to see a page "heal"; to patch files use fixHtml.
 * Returns false when the finding has no machine readable fix.
 */
export function applyFix(finding: Finding): boolean {
  const start = finding.fixTarget ?? finding.element;
  const ops = finding.fix.ops;
  if (!start || !ops?.length || !start.isConnected) return false;
  let node: Element = start;
  for (const op of ops) {
    switch (op.op) {
      case "set-attr":
        node.setAttribute(op.name, op.value);
        break;
      case "remove-attr":
        node.removeAttribute(op.name);
        break;
      case "rename-attr": {
        const value = node.getAttribute(op.name);
        node.removeAttribute(op.name);
        if (value !== null) node.setAttribute(op.to, value);
        break;
      }
      case "prepend":
        node.insertAdjacentHTML("afterbegin", op.html);
        break;
      case "append":
        node.insertAdjacentHTML("beforeend", op.html);
        break;
      case "insert-before":
        node.insertAdjacentHTML("beforebegin", op.html);
        break;
      case "rename-tag": {
        const renamed: Element = node.ownerDocument.createElement(op.tag);
        for (const a of Array.from(node.attributes)) renamed.setAttribute(a.name, a.value);
        while (node.firstChild) renamed.appendChild(node.firstChild);
        node.replaceWith(renamed);
        node = renamed;
        break;
      }
      case "replace": {
        const tpl = node.ownerDocument.createElement("template");
        tpl.innerHTML = op.html;
        node.replaceWith(tpl.content);
        return true;
      }
      case "remove":
        node.remove();
        return true;
    }
  }
  return true;
}

const levelRank: Record<Level, number> = { A: 1, AA: 2, AAA: 3 };

export function collectCss(doc: Document, extra: string[] = []): CssSource[] {
  const out: CssSource[] = [];
  for (const el of Array.from(doc.querySelectorAll("style"))) {
    if (el.closest("template")) continue;
    out.push({ text: el.textContent ?? "", owner: el });
  }
  for (const link of Array.from(doc.querySelectorAll('link[rel~="stylesheet"]'))) {
    const sheet = (link as HTMLLinkElement).sheet as CSSStyleSheet | null;
    if (!sheet) continue;
    try {
      const text = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("\n");
      if (text) out.push({ text, owner: link });
    } catch {
      // Cross origin stylesheet: not readable.
    }
  }
  for (const text of extra) out.push({ text, owner: null });
  return out;
}

function isRealBrowser(doc: Document): boolean {
  const win = doc.defaultView;
  if (!win || typeof win.getComputedStyle !== "function") return false;
  const ua = win.navigator?.userAgent ?? "";
  return !/jsdom|happy-?dom/i.test(ua);
}

/** Runs the rules on a document (or the document that owns an element) and returns the findings. */
export function runAudit(rules: Rule[], root: Document | Element, options: AuditOptions = {}): AuditResult {
  const started = Date.now();
  const doc = (root as Element).ownerDocument && (root as Document).nodeType !== 9 ? (root as Element).ownerDocument : (root as Document);
  const scope: Element = (root as Document).nodeType === 9 ? doc.documentElement : (root as Element);
  const level = options.level ?? "AA";
  const cssSources = collectCss(doc, options.css);
  const css = parseCss(cssSources.map((s) => s.text));
  const mode = options.styles && options.styles !== "auto" ? options.styles : isRealBrowser(doc) ? "computed" : "static";
  const style: StyleProvider = mode === "computed" ? new ComputedStyles(doc.defaultView!) : new StaticStyles(doc, css);
  const dom = new Dom(doc, style);
  const fragment = options.fragment ?? ((root as Document).nodeType !== 9 && scope !== doc.documentElement);

  const excluded: Element[] = [];
  for (const sel of ["[data-a11ymedic-ignore]", "#a11ymedic-overlay", "#a11ymedic-pins", ...(options.exclude ?? [])]) {
    try {
      excluded.push(...Array.from(doc.querySelectorAll(sel)));
    } catch {
      // Invalid selector: ignore it.
    }
  }
  const isExcluded = (el: Element): boolean => excluded.some((x) => x === el || x.contains(el));
  const elements = [scope, ...Array.from(scope.querySelectorAll("*"))].filter((el) => !isExcluded(el));

  const findings: Finding[] = [];
  const incomplete: Incomplete[] = [];
  const counter = new Map<string, number>();
  const seen = new Set<string>();
  const ran: string[] = [];

  for (const rule of rules) {
    if (options.rules && !options.rules.includes(rule.id)) continue;
    if (options.disable?.includes(rule.id)) continue;
    if (levelRank[rule.level] > levelRank[level]) continue;
    if (rule.page && fragment) continue;
    ran.push(rule.id);
    const ctx: RuleContext = {
      doc,
      dom,
      style,
      css,
      cssSources,
      options,
      fragment,
      elements,
      report(r) {
        const key = `${rule.id}|${r.css ? r.css.selector + r.css.text : ""}`;
        if (!r.css && isExcluded(r.el)) return;
        const dedupe = r.css ? key : null;
        if (dedupe) {
          if (seen.has(dedupe)) return;
          seen.add(dedupe);
        }
        const n = (counter.get(rule.id) ?? 0) + 1;
        counter.set(rule.id, n);
        const loc = r.css ? (r.css.line ? { line: r.css.line, column: r.css.column ?? 1 } : null) : options.locate?.(r.el) ?? null;
        const before = r.fix.before ?? (r.css ? r.css.text : snippet(r.el));
        const after = r.fix.after ?? (r.fix.ops ? previewFix(r.el, r.fix.ops, r.fix.target) : before);
        const finding: Finding = {
          id: `${rule.id}-${n}`,
          rule: rule.id,
          severity: r.severity ?? rule.severity,
          title: rule.title,
          message: r.message,
          explanation: rule.explanation,
          affects: rule.affects,
          wcag: rule.wcag.map(criterion),
          selector: r.css ? r.css.selector : dom.selector(r.el),
          html: r.css ? r.css.text : snippet(r.el),
          kind: r.css ? "css" : "html",
          fix: {
            summary: r.fix.summary,
            before,
            after,
            safe: !!r.fix.safe && !!r.fix.ops?.length,
            ...(r.fix.ops ? { ops: r.fix.ops } : {}),
          },
        };
        if (loc) {
          finding.line = loc.line;
          finding.column = loc.column;
        }
        if (r.data) finding.data = r.data;
        Object.defineProperty(finding, "element", { value: r.el, enumerable: false, writable: true });
        if (r.fix.target && r.fix.target !== r.el) Object.defineProperty(finding, "fixTarget", { value: r.fix.target, enumerable: false });
        findings.push(finding);
      },
      incomplete(el, message) {
        if (isExcluded(el)) return;
        const loc = options.locate?.(el) ?? null;
        const item: Incomplete = { rule: rule.id, selector: dom.selector(el), html: snippet(el), message };
        if (loc) {
          item.line = loc.line;
          item.column = loc.column;
        }
        Object.defineProperty(item, "element", { value: el, enumerable: false, writable: true });
        incomplete.push(item);
      },
    };
    rule.run(ctx);
  }

  findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const f of findings) counts[f.severity]++;
  const result: AuditResult = {
    title: (doc.title ?? "").trim(),
    findings,
    incomplete,
    counts,
    score: score({ findings }).value,
    rules: ran,
    styles: mode,
    fragment,
    duration: Date.now() - started,
  };
  if (options.source) result.source = options.source;
  return result;
}

export { escapeText };
