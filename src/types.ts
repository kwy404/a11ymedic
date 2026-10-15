import type { Criterion } from "./wcag";

export type Severity = "critical" | "serious" | "moderate" | "minor";
export type Level = "A" | "AA" | "AAA";
export type Lang = "en" | "pt";

/** A text in English and Brazilian Portuguese. */
export interface Text {
  en: string;
  pt: string;
}

/** One edit to an element. Safe fixes only use attribute edits and inserting a child. */
export type FixOp =
  | { op: "set-attr"; name: string; value: string }
  | { op: "remove-attr"; name: string }
  | { op: "rename-attr"; name: string; to: string }
  | { op: "prepend"; html: string }
  | { op: "append"; html: string }
  | { op: "insert-before"; html: string }
  | { op: "rename-tag"; tag: string }
  | { op: "replace"; html: string }
  | { op: "remove" };

export interface Fix {
  /** What to do, in plain language. */
  summary: Text;
  /** The element before the fix (HTML or CSS). */
  before: string;
  /** The patched code: copy it as is or adjust the placeholder text. */
  after: string;
  /** Edits that produce `after`; present when the fix can be applied to the source file. */
  ops?: FixOp[];
  /**
   * True when the fix can be applied automatically without a human decision
   * (`a11ymedic fix --write` applies only these).
   */
  safe: boolean;
}

export interface Finding {
  /** Stable id inside one result, for example "image-alt-3". */
  id: string;
  rule: string;
  severity: Severity;
  /** Title of the rule. */
  title: Text;
  /** What is wrong with this element, in plain language. */
  message: Text;
  /** Why it matters. */
  explanation: Text;
  /** Who is affected. */
  affects: Text;
  wcag: Criterion[];
  /** A unique CSS selector of the element (or the CSS selector of the stylesheet rule). */
  selector: string;
  /** Outer HTML snippet of the element (or the CSS rule text). */
  html: string;
  /** "html" for elements, "css" for stylesheet findings. */
  kind: "html" | "css";
  /** 1-based source position, when the HTML came from a file or string. */
  line?: number;
  column?: number;
  fix: Fix;
  /** Extra numbers, for example the contrast ratio and colors. */
  data?: Record<string, unknown>;
  /** The live element, when auditing a DOM (not serialized to JSON). */
  element?: Element;
  /** The element the fix ops apply to when it is a descendant of `element` (not serialized). */
  fixTarget?: Element;
}

/** Something the checker could not decide on its own (for example text over a background image). */
export interface Incomplete {
  rule: string;
  selector: string;
  html: string;
  message: Text;
  line?: number;
  column?: number;
  element?: Element;
}

export interface AuditOptions {
  /** Highest WCAG level to check. Default "AA" (A and AA rules). */
  level?: Level;
  /** Language of messages in text reports. Default "en". Findings always carry both. */
  lang?: Lang;
  /** Run only these rule ids. */
  rules?: string[];
  /** Skip these rule ids. */
  disable?: string[];
  /** CSS selectors of elements to ignore (with their descendants). */
  exclude?: string[];
  /** Extra CSS to take into account (for example linked stylesheets read from disk). */
  css?: string[];
  /** "computed" uses the browser (layout and getComputedStyle), "static" cascades CSS itself. Default "auto". */
  styles?: "auto" | "computed" | "static";
  /**
   * Treat the input as a fragment (component HTML): page level rules (title, lang, landmarks,
   * heading one, bypass) are skipped. Detected automatically for HTML strings without <html> or <body>.
   */
  fragment?: boolean;
  /** Language used by the safe fix for a missing lang attribute when it cannot be detected. Default "en". */
  defaultLang?: string;
  /** Maps an element to its source position (used by the Node entry). */
  locate?: (el: Element) => { line: number; column: number } | null;
  /** Where the HTML came from (file path or URL), echoed in the result. */
  source?: string;
}

export interface RuleMeta {
  id: string;
  title: Text;
  explanation: Text;
  affects: Text;
  severity: Severity;
  wcag: string[];
  level: Level;
  /** Page level rules are skipped for fragments. */
  page?: boolean;
  /** Tags for grouping: "images", "forms", "aria", "color", "keyboard", "structure", "media", "tables", "language", "motion". */
  tags: string[];
}

export interface AuditResult {
  source?: string;
  /** The document title, when there is one. */
  title: string;
  /** Violations, most severe first. */
  findings: Finding[];
  /** Checks that need a human eye. */
  incomplete: Incomplete[];
  /** Number of findings per severity. */
  counts: Record<Severity, number>;
  /** Health score from 0 to 100 (100 means no findings). See `score()` for the breakdown. */
  score: number;
  /** Rule ids that ran. */
  rules: string[];
  /** How styles were read: "computed" in a browser, "static" when cascading CSS without layout. */
  styles: "computed" | "static";
  fragment: boolean;
  /** Milliseconds spent. */
  duration: number;
}

export const SEVERITIES: Severity[] = ["critical", "serious", "moderate", "minor"];

export const severityRank = (s: Severity): number => SEVERITIES.length - SEVERITIES.indexOf(s);
