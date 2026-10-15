import { SEVERITIES, type AuditResult, type Finding, type Severity, type Text } from "./types";

/** Points a failing rule takes from 100, by severity, before the repeat bonus. */
export const SCORE_WEIGHTS: Record<Severity, number> = { critical: 12, serious: 7, moderate: 3, minor: 1 };

export type Grade = "healthy" | "fair" | "unwell" | "urgent";

export interface ScoreRule {
  rule: string;
  severity: Severity;
  /** How many elements break the rule. */
  count: number;
  /** Points this rule takes from the score. */
  points: number;
}

export interface Score {
  /** 0 to 100. 100 means no findings. */
  value: number;
  grade: Grade;
  /** The grade in plain language. */
  label: Text;
  /** What took points, biggest first. */
  rules: ScoreRule[];
}

const LABELS: Record<Grade, Text> = {
  healthy: { en: "Healthy", pt: "Saudável" },
  fair: { en: "Needs care", pt: "Precisa de cuidados" },
  unwell: { en: "Unwell", pt: "Doente" },
  urgent: { en: "Needs urgent care", pt: "Precisa de cuidado urgente" },
};

/** The grade for a score: 90 and up is healthy, 70 fair, 50 unwell, below 50 urgent. */
export function gradeOf(value: number): Grade {
  return value >= 90 ? "healthy" : value >= 70 ? "fair" : value >= 50 ? "unwell" : "urgent";
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Points taken by one failing rule: its weight, growing up to double when it repeats ten times or more. */
export function rulePoints(severity: Severity, count: number): number {
  if (count <= 0) return 0;
  return round1(SCORE_WEIGHTS[severity] * (1 + Math.min(1, Math.log10(count))));
}

function fromFindings(findings: Pick<Finding, "rule" | "severity">[]): Score {
  const byRule = new Map<string, ScoreRule>();
  for (const f of findings) {
    const r = byRule.get(f.rule);
    if (!r) byRule.set(f.rule, { rule: f.rule, severity: f.severity, count: 1, points: 0 });
    else {
      r.count++;
      // A rule can report different severities; the worst one counts.
      if (SEVERITIES.indexOf(f.severity) < SEVERITIES.indexOf(r.severity)) r.severity = f.severity;
    }
  }
  const rules = [...byRule.values()];
  for (const r of rules) r.points = rulePoints(r.severity, r.count);
  rules.sort((a, b) => b.points - a.points || a.rule.localeCompare(b.rule));
  const lost = rules.reduce((a, r) => a + r.points, 0);
  // Any finding keeps the score below 100, so 100 always means a clean result.
  const value = rules.length ? Math.min(99, Math.max(0, Math.round(100 - lost))) : 100;
  const grade = capGrade(gradeOf(value), rules);
  return { value, grade, label: LABELS[grade], rules };
}

/** A page with a critical or serious problem is never called healthy, whatever its score. */
const capGrade = (grade: Grade, rules: ScoreRule[]): Grade =>
  grade === "healthy" && rules.some((r) => r.severity === "critical" || r.severity === "serious") ? "fair" : grade;

/**
 * A 0 to 100 health score. Each failing rule takes points by severity (critical 12, serious 7,
 * moderate 3, minor 1), up to double when it repeats; several results are averaged. The grade is
 * healthy from 90 up, but never while a critical or serious problem is left.
 *
 *   score(await audit(html)).value; // 81
 */
export function score(input: Pick<AuditResult, "findings"> | Pick<AuditResult, "findings">[]): Score {
  if (!Array.isArray(input)) return fromFindings(input.findings);
  if (!input.length) return fromFindings([]);
  const parts = input.map((r) => fromFindings(r.findings));
  const value = Math.round(parts.reduce((a, p) => a + p.value, 0) / parts.length);
  const all = fromFindings(input.flatMap((r) => r.findings));
  const grade = capGrade(gradeOf(value), all.rules);
  return { value, grade, label: LABELS[grade], rules: all.rules };
}
