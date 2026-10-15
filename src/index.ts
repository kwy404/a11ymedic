import { collectCss, runAudit, applyFix } from "./engine";
import { Dom } from "./dom";
import { StaticStyles, ComputedStyles } from "./style";
import { parseCss } from "./css";
import { parseHtml } from "./parse";
import { RULES, ruleList } from "./rules";
import type { AuditOptions, AuditResult } from "./types";

export type {
  AuditOptions,
  AuditResult,
  Finding,
  Fix,
  FixOp,
  Incomplete,
  Lang,
  Level,
  RuleMeta,
  Severity,
  Text,
} from "./types";
export type { Criterion } from "./wcag";
export type { RGBA, OKLCH, ColorSuggestion, ColorOption } from "./color";
export { SEVERITIES } from "./types";
export { CRITERIA } from "./wcag";
export { parseColor, contrastRatio, relativeLuminance, suggestColors, toHex, toOklch, fromOklch, formatRatio, blend, deltaE } from "./color";
export { formatText, toJSON, toMarkdown, toHtml, githubAnnotations, githubSummary, summarize } from "./report";
export { parseHtml } from "./parse";
export { fixHtml, applyFixes, type FixResult } from "./fix";
export { score, gradeOf, rulePoints, SCORE_WEIGHTS, type Score, type ScoreRule, type Grade } from "./score";
export {
  recordScore,
  readHistory,
  clearHistory,
  addEntry,
  toEntry,
  historyKey,
  memoryStorage,
  type HistoryEntry,
  type HistoryOptions,
  type HistoryStorage,
  type HistoryUpdate,
} from "./history";
export { bookmarklet, cdnUrl, type BookmarkletOptions } from "./bookmarklet";
export { RULES, ruleList, applyFix };
export { Dom, StaticStyles, ComputedStyles, parseCss };

/**
 * Audits a live document or element synchronously. In a browser it reads computed styles and
 * layout; with jsdom it cascades the page CSS itself.
 */
export function auditDocument(root: Document | Element, options: AuditOptions = {}): AuditResult {
  return runAudit(RULES, root, options);
}

/**
 * Audits HTML (a string), a Document or an Element. Strings are parsed with DOMParser in browsers
 * and with jsdom on Node, with source line numbers.
 *
 *   const result = await audit('<img src="cat.jpg">');
 *   result.findings[0].fix.after; // '<img src="cat.jpg" alt="Cat">'
 */
export async function audit(input: string | Document | Element, options: AuditOptions = {}): Promise<AuditResult> {
  if (typeof input !== "string") return auditDocument(input, options);
  const parsed = await parseHtml(input);
  return runAudit(RULES, parsed.document, {
    ...options,
    fragment: options.fragment ?? parsed.fragment,
    locate: options.locate ?? parsed.locate,
  });
}

/** Accessible name of an element, following the W3C accname algorithm for common cases. */
export function accessibleName(el: Element): string {
  return new Dom(el.ownerDocument, styleFor(el.ownerDocument)).name(el);
}

/** The ARIA role of an element (explicit role, or implicit HTML role). */
export function getRole(el: Element): string {
  return new Dom(el.ownerDocument, styleFor(el.ownerDocument)).role(el);
}

function styleFor(doc: Document): StaticStyles | ComputedStyles {
  const win = doc.defaultView;
  const real = !!win && typeof win.getComputedStyle === "function" && !/jsdom|happy-?dom/i.test(win.navigator?.userAgent ?? "");
  return real ? new ComputedStyles(win) : new StaticStyles(doc, parseCss(collectCss(doc).map((s) => s.text)));
}

export { VERSION as version } from "./version";
