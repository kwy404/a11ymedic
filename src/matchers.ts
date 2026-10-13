import { formatText } from "./report";
import { severityRank, type AuditResult, type Severity } from "./types";

export interface MatcherOptions {
  /** Only count findings at least this severe. Default "minor" (everything). */
  severity?: Severity;
  /** Ignore these rule ids. */
  ignore?: string[];
}

interface MatcherResult {
  pass: boolean;
  message: () => string;
}

function isResult(x: unknown): x is AuditResult {
  return !!x && typeof x === "object" && Array.isArray((x as AuditResult).findings);
}

/**
 * Jest and Vitest matcher: passes when an audit result has no findings.
 *
 *   expect(await audit(html)).toHaveNoViolations();
 *   expect(await audit(html)).toHaveNoViolations({ severity: "serious" });
 */
export function toHaveNoViolations(received: unknown, options: MatcherOptions = {}): MatcherResult {
  if (!isResult(received)) {
    return {
      pass: false,
      message: () => "toHaveNoViolations expects the result of `await audit(html)` (did you forget await?).",
    };
  }
  const min = severityRank(options.severity ?? "minor");
  const findings = received.findings.filter((f) => severityRank(f.severity) >= min && !options.ignore?.includes(f.rule));
  const pass = findings.length === 0;
  return {
    pass,
    message: () =>
      pass
        ? "Expected accessibility violations, but a11ymedic found none."
        : `Expected no accessibility violations, but a11ymedic found ${findings.length}:\n` +
          formatText({ ...received, findings }, { maxPerRule: 5 }),
  };
}

export const matchers = { toHaveNoViolations };
