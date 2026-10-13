import { runAudit } from "./engine";
import { escapeAttr } from "./dom";
import { parseHtml, type ElementLocation, type ParsedHtml } from "./parse";
import { RULES } from "./rules";
import type { AuditOptions, Finding, FixOp } from "./types";

export interface FixResult {
  /** The patched HTML. Equal to the input when nothing was fixed. */
  output: string;
  /** Findings whose safe fix was applied. */
  applied: Finding[];
  /** Findings that still need a human (unsafe fixes, or fixes that could not be placed in the source). */
  remaining: Finding[];
  changed: boolean;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

const BOOLEAN_ATTRS = new Set(["muted", "inert", "controls", "hidden", "default", "autoplay", "loop", "disabled", "required", "checked", "readonly", "multiple", "open"]);

function attrText(name: string, value: string): string {
  if (value === "" && BOOLEAN_ATTRS.has(name)) return name;
  return `${name}="${escapeAttr(value)}"`;
}

/** Turns one element's fix ops into text edits on the original source. */
function editsFor(source: string, el: Element, loc: ElementLocation | null, ops: FixOp[], parsed: ParsedHtml): Edit[] | null {
  const edits: Edit[] = [];
  const start = loc?.startTag;
  // Implied elements (no tag in the source): only a few cases can be expressed.
  if (!loc || !start) {
    if (el.localName === "html" && ops.every((o) => o.op === "set-attr")) {
      const doctype = /<!doctype[^>]*>/i.exec(source);
      const at = doctype ? doctype.index + doctype[0].length : 0;
      const attrs = ops.map((o) => (o.op === "set-attr" ? " " + attrText(o.name, o.value) : "")).join("");
      return [{ start: at, end: at, text: `${doctype ? "\n" : ""}<html${attrs}>` }];
    }
    if (el.localName === "head" && ops.every((o) => o.op === "prepend")) {
      const html = el.ownerDocument.documentElement;
      const htmlLoc = parsed.location(html);
      const doctype = /<!doctype[^>]*>/i.exec(source);
      const at = htmlLoc?.startTag ? htmlLoc.startTag.endOffset : doctype ? doctype.index + doctype[0].length : 0;
      return ops.map((o) => ({ start: at, end: at, text: o.op === "prepend" ? `\n${o.html}` : "" }));
    }
    return null;
  }
  const tagText = source.slice(start.startOffset, start.endOffset);
  const selfClosing = /\/\s*>$/.test(tagText);
  const closeAt = start.endOffset - (selfClosing ? tagText.length - tagText.search(/\/\s*>$/) : 1);
  const attrs = start.attrs ?? {};
  const pendingInsert: string[] = [];
  for (const op of ops) {
    switch (op.op) {
      case "set-attr": {
        const a = attrs[op.name.toLowerCase()];
        if (a) edits.push({ start: a.startOffset, end: a.endOffset, text: attrText(op.name, op.value) });
        else pendingInsert.push(attrText(op.name, op.value));
        break;
      }
      case "rename-attr": {
        const a = attrs[op.name.toLowerCase()];
        if (!a) break;
        edits.push({ start: a.startOffset, end: a.startOffset + op.name.length, text: op.to });
        break;
      }
      case "remove-attr": {
        const a = attrs[op.name.toLowerCase()];
        if (!a) break;
        let s = a.startOffset;
        while (s > start.startOffset && /\s/.test(source[s - 1]!)) s--;
        edits.push({ start: s, end: a.endOffset, text: "" });
        break;
      }
      case "prepend": {
        const after = source.slice(start.endOffset, start.endOffset + 200);
        const indent = /^\r?\n([ \t]*)/.exec(after);
        edits.push({ start: start.endOffset, end: start.endOffset, text: indent ? `\n${indent[1]}${op.html}` : op.html });
        break;
      }
      case "append": {
        const at = loc.endTag ? loc.endTag.startOffset : loc.endOffset;
        edits.push({ start: at, end: at, text: op.html });
        break;
      }
      case "insert-before": {
        const lineStart = source.lastIndexOf("\n", loc.startOffset - 1) + 1;
        const indent = /^[ \t]*/.exec(source.slice(lineStart, loc.startOffset))![0];
        const onOwnLine = indent.length === loc.startOffset - lineStart;
        edits.push({ start: loc.startOffset, end: loc.startOffset, text: onOwnLine ? `${op.html}\n${indent}` : `${op.html} ` });
        break;
      }
      case "rename-tag": {
        const name = /^<\s*([A-Za-z][\w-]*)/.exec(tagText);
        if (!name) return null;
        edits.push({ start: start.startOffset + tagText.indexOf(name[1]!), end: start.startOffset + tagText.indexOf(name[1]!) + name[1]!.length, text: op.tag });
        if (loc.endTag) {
          const endText = source.slice(loc.endTag.startOffset, loc.endTag.endOffset);
          const en = /^<\/\s*([A-Za-z][\w-]*)/.exec(endText);
          if (en) edits.push({ start: loc.endTag.startOffset + endText.indexOf(en[1]!), end: loc.endTag.startOffset + endText.indexOf(en[1]!) + en[1]!.length, text: op.tag });
        }
        break;
      }
      case "replace":
        edits.push({ start: loc.startOffset, end: loc.endOffset, text: op.html });
        break;
      case "remove":
        edits.push({ start: loc.startOffset, end: loc.endOffset, text: "" });
        break;
    }
  }
  if (pendingInsert.length) {
    const prev = source[closeAt - 1] ?? "";
    const text = /\s/.test(prev) ? `${pendingInsert.join(" ")} ` : ` ${pendingInsert.join(" ")}`;
    edits.push({ start: closeAt, end: closeAt, text });
  }
  return edits;
}

/** Applies non-overlapping edits from the end of the text to the start. Returns the edits it used. */
function applyEdits(source: string, groups: Edit[][]): { output: string; used: boolean[] } {
  const taken: Array<[number, number]> = [];
  const used = groups.map((group) => {
    const clash = group.some((e) => taken.some(([s, t]) => (e.start < t && e.end > s) || (e.start === e.end && e.start > s && e.start < t) || (s === t && s > e.start && s < e.end)));
    if (clash) return false;
    for (const e of group) taken.push([e.start, e.end]);
    return true;
  });
  const all = groups.filter((_, i) => used[i]).flat();
  // Stable: for edits at the same position keep their original order.
  const indexed = all.map((e, i) => ({ e, i }));
  indexed.sort((a, b) => b.e.start - a.e.start || b.e.end - a.e.end || b.i - a.i);
  let out = source;
  for (const { e } of indexed) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return { output: out, used };
}

/**
 * Applies the safe fixes of an audit to the HTML source and keeps everything else (formatting,
 * comments, attribute order) as it was. Runs up to five passes so fixes that touch the same
 * element all land, and the result is stable: fixing the output again changes nothing.
 */
export async function fixHtml(html: string, options: AuditOptions & { rules?: string[] } = {}): Promise<FixResult> {
  let source = html;
  const applied: Finding[] = [];
  let remaining: Finding[] = [];
  for (let pass = 0; pass < 5; pass++) {
    const parsed = await parseHtml(source);
    const result = runAudit(RULES, parsed.document, { ...options, fragment: options.fragment ?? parsed.fragment, locate: parsed.locate });
    const safe = result.findings.filter((f) => f.fix.safe && f.fix.ops?.length);
    remaining = result.findings.filter((f) => !f.fix.safe);
    if (!safe.length) break;
    const groups: Edit[][] = [];
    const owners: Finding[] = [];
    const unplaced: Finding[] = [];
    for (const f of safe) {
      const target = f.fixTarget ?? f.element!;
      const edits = editsFor(source, target, parsed.location(target), f.fix.ops!, parsed);
      if (!edits || !edits.length) {
        unplaced.push(f);
        continue;
      }
      groups.push(edits);
      owners.push(f);
    }
    if (!groups.length) {
      remaining = [...remaining, ...unplaced];
      break;
    }
    const { output, used } = applyEdits(source, groups);
    owners.forEach((f, i) => used[i] && applied.push(f));
    if (output === source) break;
    source = output;
  }
  return { output: source, applied, remaining, changed: source !== html };
}

/** Alias kept for symmetry with the CLI wording. */
export const applyFixes = fixHtml;
