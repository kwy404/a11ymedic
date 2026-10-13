import { ABSTRACT_ROLES, ARIA_ATTRIBUTES, NAME_FROM_CONTENT, ROLES } from "./aria";
import type { StyleProvider } from "./style";

export const clean = (s: string): string => s.replace(/\s+/g, " ").trim();

const TEXT_INPUTS = new Set(["", "text", "email", "tel", "url", "search", "password", "number"]);
const BUTTON_INPUTS = new Set(["button", "submit", "reset", "image"]);
const LABELABLE = new Set(["input", "select", "textarea", "meter", "progress", "output", "button"]);
const SECTIONING = "article, aside, main, nav, section";

export const inputType = (el: Element): string => (el.getAttribute("type") ?? "").trim().toLowerCase();

/** Escapes text for an HTML attribute value inside double quotes. */
export const escapeAttr = (s: string): string => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
export const escapeText = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sets CSS declarations in an inline style attribute value, replacing earlier values of the same properties. */
export function mergeStyle(style: string | null, set: Record<string, string>): string {
  const kept = (style ?? "")
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d && !Object.keys(set).includes(d.slice(0, d.indexOf(":")).trim().toLowerCase()));
  return [...kept, ...Object.entries(set).map(([k, v]) => `${k}: ${v}`)].join("; ");
}

const VOID = new Set("area base br col embed hr img input link meta source track wbr param".split(" "));

/** The start tag of an element as HTML, with very long attribute values shortened. */
export function openTag(el: Element, maxValue = 120): string {
  let out = `<${el.localName}`;
  for (const attr of Array.from(el.attributes)) {
    let v = attr.value;
    if (v.length > maxValue) v = v.slice(0, maxValue - 3) + "...";
    out += attr.value === "" && !/^(alt|value|aria-|content|title|href|src)/.test(attr.name) ? ` ${attr.name}` : ` ${attr.name}="${escapeAttr(v)}"`;
  }
  return out + ">";
}

/** A readable HTML snippet of an element: the whole element when short, otherwise trimmed. */
export function snippet(el: Element, max = 280): string {
  const open = openTag(el);
  if (el.localName === "html" || el.localName === "body") return `${open}
  ...
</${el.localName}>`;
  const html = el.outerHTML;
  if (html.length <= max) return html;
  if (VOID.has(el.localName)) return open;
  const close = `</${el.localName}>`;
  const inner = el.innerHTML;
  const room = Math.max(40, max - open.length - close.length);
  if (inner.length <= room) return open + inner + close;
  const text = clean(el.textContent ?? "");
  const short = text.length > 80 ? text.slice(0, 77) + "..." : text;
  return `${open}${escapeText(short) || "..."}${close}`;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** DOM queries shared by every rule: visibility, focus, roles, accessible names and selectors. */
export class Dom {
  private hiddenCache = new Map<Element, boolean>();
  private atHiddenCache = new Map<Element, boolean>();
  private nameCache = new Map<Element, string>();
  private idCount: Map<string, number> | null = null;

  constructor(
    readonly doc: Document,
    readonly style: StyleProvider,
  ) {}

  /** Number of elements in the document that carry an id. */
  idFrequency(id: string): number {
    if (!this.idCount) {
      this.idCount = new Map();
      for (const el of Array.from(this.doc.querySelectorAll("[id]"))) {
        const v = el.getAttribute("id")!;
        this.idCount.set(v, (this.idCount.get(v) ?? 0) + 1);
      }
    }
    return this.idCount.get(id) ?? 0;
  }

  byId(id: string): Element | null {
    if (!id) return null;
    try {
      return this.doc.getElementById(id);
    } catch {
      return null;
    }
  }

  idrefs(el: Element, attr: string): Element[] {
    const v = el.getAttribute(attr);
    if (!v) return [];
    return v
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => this.byId(id))
      .filter((x): x is Element => x !== null);
  }

  /** True when the element is not rendered: display none or visibility hidden on it or an ancestor. */
  isHidden(el: Element): boolean {
    const hit = this.hiddenCache.get(el);
    if (hit !== undefined) return hit;
    let result = false;
    if (this.style.display(el) === "none") result = true;
    else if (el.parentElement && el.parentElement !== el && this.isHidden(el.parentElement)) result = true;
    else if (/^(hidden|collapse)$/.test(this.style.visibility(el))) result = true;
    // Nodes outside the body subtree (for example inside <head>) are never rendered.
    if (!result && el.localName === "head") result = true;
    this.hiddenCache.set(el, result);
    return result;
  }

  /** True when assistive technology does not see the element (hidden, aria-hidden or inert). */
  isHiddenFromAT(el: Element): boolean {
    const hit = this.atHiddenCache.get(el);
    if (hit !== undefined) return hit;
    let result = this.isHidden(el);
    if (!result) {
      if (el.getAttribute("aria-hidden")?.trim().toLowerCase() === "true") result = true;
      else if (el.hasAttribute("inert")) result = true;
      else if (el.parentElement) result = this.isHiddenFromAT(el.parentElement);
    }
    this.atHiddenCache.set(el, result);
    return result;
  }

  /** Detects the usual visually hidden patterns: clip rect 0, 1px boxes, far off screen positions. */
  isVisuallyHidden(el: Element): boolean {
    for (let n: Element | null = el; n; n = n.parentElement) {
      const s = this.style;
      const clip = s.get(n, "clip").replace(/\s+/g, "");
      const clipPath = s.get(n, "clip-path").replace(/\s+/g, "");
      if (/^rect\(0(px)?,?0(px)?,?0(px)?,?0(px)?\)$/.test(clip) || clipPath === "inset(50%)" || clipPath === "inset(100%)") return true;
      const position = s.get(n, "position");
      if (position === "absolute" || position === "fixed") {
        const left = parseFloat(s.get(n, "left"));
        const top = parseFloat(s.get(n, "top"));
        if (left <= -999 || top <= -999) return true;
        const w = parseFloat(s.get(n, "width"));
        const h = parseFloat(s.get(n, "height"));
        if (w <= 1 && h <= 1 && s.get(n, "overflow") === "hidden") return true;
      }
      const indent = parseFloat(s.get(n, "text-indent"));
      if (indent <= -999) return true;
      if (s.opacity(n) === 0) return true;
      if (s.kind === "static" && s.fontSize(n) === 0) return true;
    }
    return false;
  }

  isDisabled(el: Element): boolean {
    if (el.getAttribute("aria-disabled")?.toLowerCase() === "true") return true;
    if (!/^(button|input|select|textarea|optgroup|option|fieldset)$/.test(el.localName)) {
      return !!el.closest("[aria-disabled='true']");
    }
    if (el.hasAttribute("disabled")) return true;
    const fieldset = el.closest("fieldset[disabled]");
    if (fieldset) {
      const legend = fieldset.querySelector(":scope > legend");
      return !(legend && legend.contains(el));
    }
    return false;
  }

  tabIndex(el: Element): number | null {
    const v = el.getAttribute("tabindex");
    if (v === null || !/^\s*-?\d+\s*$/.test(v)) return null;
    return parseInt(v, 10);
  }

  isNativelyFocusable(el: Element): boolean {
    const tag = el.localName;
    if ((tag === "a" || tag === "area") && el.hasAttribute("href")) return true;
    if (tag === "input") return inputType(el) !== "hidden" && !this.isDisabled(el);
    if (tag === "button" || tag === "select" || tag === "textarea") return !this.isDisabled(el);
    if (tag === "iframe" || tag === "embed" || tag === "object") return true;
    if ((tag === "audio" || tag === "video") && el.hasAttribute("controls")) return true;
    if (tag === "summary") return el.parentElement?.localName === "details" && el.parentElement.querySelector("summary") === el;
    const ce = el.getAttribute("contenteditable");
    if (ce !== null && ce.toLowerCase() !== "false") return true;
    return false;
  }

  /** Focusable by mouse or script (includes tabindex="-1"). */
  isFocusable(el: Element): boolean {
    if (this.isHidden(el) || el.closest("[inert]")) return false;
    if (this.tabIndex(el) !== null) return !(el.localName === "input" && inputType(el) === "hidden") && !this.isDisabled(el);
    return this.isNativelyFocusable(el);
  }

  /** Reachable with the Tab key. */
  isTabbable(el: Element): boolean {
    if (!this.isFocusable(el)) return false;
    const t = this.tabIndex(el);
    return t === null || t >= 0;
  }

  explicitRole(el: Element): string {
    const raw = el.getAttribute("role");
    if (!raw) return "";
    for (const token of raw.trim().toLowerCase().split(/\s+/)) {
      if (ROLES.has(token) && !ABSTRACT_ROLES.has(token)) return token;
    }
    return "";
  }

  hasGlobalAria(el: Element): boolean {
    return Array.from(el.attributes).some((a) => ARIA_ATTRIBUTES[a.name]?.global && a.name !== "aria-hidden");
  }

  implicitRole(el: Element): string {
    const tag = el.localName;
    switch (tag) {
      case "a":
      case "area":
        return el.hasAttribute("href") ? "link" : "generic";
      case "article":
        return "article";
      case "aside":
        return "complementary";
      case "blockquote":
        return "blockquote";
      case "button":
        return "button";
      case "caption":
        return "caption";
      case "code":
        return "code";
      case "datalist":
        return "listbox";
      case "dd":
        return "definition";
      case "del":
      case "s":
        return "deletion";
      case "details":
        return "group";
      case "dfn":
      case "dt":
        return "term";
      case "dialog":
        return "dialog";
      case "em":
        return "emphasis";
      case "fieldset":
      case "optgroup":
        return "group";
      case "figure":
        return "figure";
      case "footer":
        return el.parentElement?.closest(SECTIONING) ? "generic" : "contentinfo";
      case "header":
        return el.parentElement?.closest(SECTIONING) ? "generic" : "banner";
      case "form":
        return "form";
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return "heading";
      case "hr":
        return "separator";
      case "html":
        return "document";
      case "img": {
        const alt = el.getAttribute("alt");
        if (alt === "" && !this.hasGlobalAria(el) && this.tabIndex(el) === null) return "presentation";
        return "img";
      }
      case "input": {
        const type = inputType(el);
        if (BUTTON_INPUTS.has(type)) return "button";
        if (type === "checkbox") return "checkbox";
        if (type === "radio") return "radio";
        if (type === "range") return "slider";
        if (type === "number") return "spinbutton";
        if (type === "search") return el.hasAttribute("list") ? "combobox" : "searchbox";
        if (type === "hidden") return "none";
        if (TEXT_INPUTS.has(type)) return el.hasAttribute("list") ? "combobox" : "textbox";
        return "";
      }
      case "ins":
        return "insertion";
      case "li":
        return "listitem";
      case "main":
        return "main";
      case "mark":
        return "mark";
      case "math":
        return "math";
      case "menu":
      case "ol":
      case "ul":
        return "list";
      case "meter":
        return "meter";
      case "nav":
        return "navigation";
      case "option":
        return "option";
      case "output":
        return "status";
      case "p":
        return "paragraph";
      case "progress":
        return "progressbar";
      case "search":
        return "search";
      case "section":
        return this.hasOwnLabel(el) ? "region" : "generic";
      case "select":
        return el.hasAttribute("multiple") || Number(el.getAttribute("size") ?? 0) > 1 ? "listbox" : "combobox";
      case "strong":
        return "strong";
      case "sub":
        return "subscript";
      case "sup":
        return "superscript";
      case "svg":
        return "graphics-document";
      case "table":
        return "table";
      case "tbody":
      case "thead":
      case "tfoot":
        return "rowgroup";
      case "td":
        return el.closest("table")?.getAttribute("role") === "grid" ? "gridcell" : "cell";
      case "th": {
        const scope = (el.getAttribute("scope") ?? "").toLowerCase();
        if (scope === "row" || scope === "rowgroup") return "rowheader";
        if (scope === "col" || scope === "colgroup") return "columnheader";
        const row = el.parentElement;
        const cells = row ? Array.from(row.children).filter((c) => c.localName === "td" || c.localName === "th") : [];
        const allTh = cells.every((c) => c.localName === "th");
        return allTh || cells.length <= 1 ? "columnheader" : cells[0] === el ? "rowheader" : "columnheader";
      }
      case "textarea":
        return "textbox";
      case "time":
        return "time";
      case "tr":
        return "row";
      case "summary":
        return "button";
      case "div":
      case "span":
      case "b":
      case "i":
      case "u":
      case "small":
      case "samp":
      case "q":
      case "bdi":
      case "bdo":
      case "data":
        return "generic";
      default:
        return "";
    }
  }

  private hasOwnLabel(el: Element): boolean {
    return !!(el.getAttribute("aria-label")?.trim() || this.idrefs(el, "aria-labelledby").length || el.getAttribute("title")?.trim());
  }

  /** The effective role: the first valid explicit role, otherwise the implicit HTML role. */
  role(el: Element): string {
    const explicit = this.explicitRole(el);
    if (explicit === "none" || explicit === "presentation") {
      // Presentational role conflict resolution: focusable or globally labelled elements keep their role.
      if (this.isFocusable(el) || this.hasGlobalAria(el)) return this.implicitRole(el);
    }
    return explicit || this.implicitRole(el);
  }

  headingLevel(el: Element): number {
    const m = /^h([1-6])$/.exec(el.localName);
    const aria = parseInt(el.getAttribute("aria-level") ?? "", 10);
    if (this.explicitRole(el) === "heading" || !m) return Number.isFinite(aria) && aria > 0 ? aria : 2;
    return Number.isFinite(aria) && aria > 0 && el.hasAttribute("aria-level") ? aria : Number(m[1]);
  }

  /** Labels associated with a form control: label[for], wrapping label. */
  labelsOf(el: Element): Element[] {
    const out: Element[] = [];
    const id = el.getAttribute("id");
    if (id) {
      for (const l of Array.from(this.doc.querySelectorAll("label[for]"))) {
        if (l.getAttribute("for") === id) out.push(l);
      }
    }
    const wrap = el.closest("label");
    if (wrap && !out.includes(wrap) && (!wrap.hasAttribute("for") || wrap.getAttribute("for") === id)) out.push(wrap);
    return out;
  }

  /** Accessible name, following the W3C accname algorithm for the common HTML and ARIA cases. */
  name(el: Element): string {
    const hit = this.nameCache.get(el);
    if (hit !== undefined) return hit;
    const value = clean(this.computeName(el, { visited: new Set(), labelledBy: false, recursing: false, includeHidden: false }));
    this.nameCache.set(el, value);
    return value;
  }

  /** Accessible description from aria-describedby, aria-description or title. */
  description(el: Element): string {
    const refs = this.idrefs(el, "aria-describedby");
    if (refs.length) {
      return clean(refs.map((r) => this.computeName(r, { visited: new Set([el]), labelledBy: true, recursing: true, includeHidden: this.isHiddenFromAT(r) })).join(" "));
    }
    return clean(el.getAttribute("aria-description") ?? "");
  }

  private computeName(
    node: Element,
    s: { visited: Set<Element>; labelledBy: boolean; recursing: boolean; includeHidden: boolean },
  ): string {
    if (s.visited.has(node)) return "";
    s.visited.add(node);
    if (!s.includeHidden && this.isHiddenFromAT(node)) return "";
    const role = this.role(node);

    if (!s.labelledBy) {
      const refs = this.idrefs(node, "aria-labelledby");
      if (refs.length) {
        const text = refs
          .map((r) =>
            this.computeName(r, {
              visited: new Set<Element>(),
              labelledBy: true,
              recursing: true,
              includeHidden: this.isHiddenFromAT(r),
            }),
          )
          .join(" ");
        if (clean(text)) return text;
      }
    }

    if (s.recursing) {
      const embedded = this.embeddedValue(node, role);
      if (embedded !== null) return embedded;
    }

    const label = node.getAttribute("aria-label");
    if (label && clean(label) && role !== "none" && role !== "presentation") return label;

    if (role !== "none" && role !== "presentation") {
      const native = this.nativeName(node, s);
      if (native !== null) return native;
    }

    const tag = node.localName;
    if (NAME_FROM_CONTENT.has(role) || s.recursing || /^(label|legend|caption|figcaption|summary|td|th|option|dt|dd|li)$/.test(tag)) {
      const content = this.contentName(node, s);
      if (clean(content)) return content;
    }

    const title = node.getAttribute("title");
    if (title && clean(title)) return title;
    if (tag === "input" || tag === "textarea") {
      const placeholder = node.getAttribute("placeholder");
      if (placeholder && clean(placeholder)) return placeholder;
    }
    const ariaPlaceholder = node.getAttribute("aria-placeholder");
    if (ariaPlaceholder && clean(ariaPlaceholder)) return ariaPlaceholder;
    return "";
  }

  private embeddedValue(node: Element, role: string): string | null {
    const tag = node.localName;
    if (tag === "input" && TEXT_INPUTS.has(inputType(node))) return (node as HTMLInputElement).value ?? node.getAttribute("value") ?? "";
    if (tag === "textarea") return node.textContent ?? "";
    if (tag === "select") {
      const options = Array.from(node.querySelectorAll("option"));
      const selected = options.filter((o) => o.hasAttribute("selected"));
      const pick = selected.length ? selected : options.slice(0, 1);
      return pick.map((o) => clean(o.textContent ?? "")).join(" ");
    }
    if (role === "textbox" && tag !== "input") return node.textContent ?? "";
    if (role === "slider" || role === "spinbutton" || role === "scrollbar" || role === "progressbar" || role === "meter") {
      return node.getAttribute("aria-valuetext") ?? node.getAttribute("aria-valuenow") ?? node.getAttribute("value") ?? "";
    }
    return null;
  }

  private nativeName(
    node: Element,
    s: { visited: Set<Element>; labelledBy: boolean; recursing: boolean; includeHidden: boolean },
  ): string | null {
    const tag = node.localName;
    if (tag === "input") {
      const type = inputType(node);
      if (type === "button" || type === "submit" || type === "reset") {
        const v = node.getAttribute("value");
        if (v !== null) return v;
        return type === "submit" ? "Submit" : type === "reset" ? "Reset" : null;
      }
      if (type === "image") {
        const alt = node.getAttribute("alt");
        if (alt && clean(alt)) return alt;
        const v = node.getAttribute("value");
        if (v && clean(v)) return v;
        return null;
      }
    }
    if (LABELABLE.has(tag) && !(tag === "button" && s.recursing)) {
      const labels = this.labelsOf(node);
      if (labels.length) {
        const text = labels.map((l) => this.computeName(l, { ...s, recursing: true })).join(" ");
        if (clean(text)) return text;
      }
      if (tag !== "button") return null;
    }
    if (tag === "img" || tag === "area") {
      const alt = node.getAttribute("alt");
      if (alt !== null) return alt.trim() ? alt : node.getAttribute("title") ?? "";
      return null;
    }
    if (tag === "fieldset") {
      const legend = Array.from(node.children).find((c) => c.localName === "legend");
      return legend ? this.computeName(legend, { ...s, recursing: true }) : null;
    }
    if (tag === "table") {
      const caption = Array.from(node.children).find((c) => c.localName === "caption");
      return caption ? this.computeName(caption, { ...s, recursing: true }) : null;
    }
    if (tag === "figure") {
      const cap = Array.from(node.children).find((c) => c.localName === "figcaption");
      return cap ? this.computeName(cap, { ...s, recursing: true }) : null;
    }
    if (tag === "svg") {
      const title = Array.from(node.children).find((c) => c.localName === "title");
      return title ? clean(title.textContent ?? "") || null : null;
    }
    if (tag === "optgroup") return node.getAttribute("label");
    return null;
  }

  private isBlock(el: Element): boolean {
    const d = this.style.display(el);
    return !/^inline/.test(d) && d !== "contents";
  }

  private contentName(
    node: Element,
    s: { visited: Set<Element>; labelledBy: boolean; recursing: boolean; includeHidden: boolean },
  ): string {
    let out = "";
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) out += child.nodeValue ?? "";
      else if (child.nodeType === 1) {
        const el = child as Element;
        if (el.localName === "br") {
          out += " ";
          continue;
        }
        if (/^(script|style|template|noscript)$/.test(el.localName)) continue;
        const part = this.computeName(el, { ...s, recursing: true });
        out += this.isBlock(el) ? ` ${part} ` : part;
      }
    }
    return out;
  }

  /** Text a sighted user sees inside the element (ignores display none and visually hidden text). */
  visibleText(el: Element): string {
    let out = "";
    const walk = (n: Node): void => {
      for (const c of Array.from(n.childNodes)) {
        if (c.nodeType === 3) out += c.nodeValue ?? "";
        else if (c.nodeType === 1) {
          const e = c as Element;
          if (/^(script|style|template|noscript)$/.test(e.localName)) continue;
          if (this.isHidden(e) || this.isVisuallyHidden(e)) continue;
          if (e.localName === "img") out += ` ${e.getAttribute("alt") ?? ""} `;
          else if (e.localName === "br") out += " ";
          else {
            const block = this.isBlock(e);
            if (block) out += " ";
            walk(e);
            if (block) out += " ";
          }
        }
      }
    };
    walk(el);
    return clean(out);
  }

  /** A short CSS selector that matches only this element. */
  selector(el: Element): string {
    const parts: string[] = [];
    for (let n: Element | null = el; n; n = n.parentElement) {
      const id = n.getAttribute("id");
      if (id && /^[A-Za-z][\w-]*$/.test(id) && this.idFrequency(id) === 1) {
        parts.unshift(`#${id}`);
        break;
      }
      const tag = n.localName;
      if (tag === "html" || tag === "body" || tag === "head") {
        parts.unshift(tag);
        if (tag === "html") break;
        continue;
      }
      const parent: Element | null = n.parentElement;
      let part = tag;
      if (parent) {
        const same = Array.from(parent.children).filter((c) => c.localName === tag);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`;
      }
      parts.unshift(part);
    }
    return parts.join(" > ");
  }
}
