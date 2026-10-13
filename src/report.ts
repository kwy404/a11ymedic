import { SEVERITIES, severityRank, type AuditResult, type Finding, type Lang, type Severity } from "./types";

export interface ReportOptions {
  lang?: Lang;
  /** Use ANSI colors (text format only). */
  color?: boolean;
  /** Show at most this many instances per rule in text output. Default 20. */
  maxPerRule?: number;
}

const L = (lang: Lang | undefined, en: string, pt: string): string => (lang === "pt" ? pt : en);
const SEV_PT: Record<Severity, string> = { critical: "crítico", serious: "grave", moderate: "moderado", minor: "leve" };
const sevName = (s: Severity, lang?: Lang): string => (lang === "pt" ? SEV_PT[s] : s);

function groupByRule(findings: Finding[]): Finding[][] {
  const map = new Map<string, Finding[]>();
  for (const f of findings) map.set(f.rule, [...(map.get(f.rule) ?? []), f]);
  return [...map.values()].sort((a, b) => severityRank(b[0]!.severity) - severityRank(a[0]!.severity) || b.length - a.length);
}

const where = (r: AuditResult, f: Finding): string => {
  const file = r.source ?? "";
  if (f.line) return `${file}${file ? ":" : "line "}${f.line}:${f.column ?? 1}`;
  return file;
};

/** Counts as a short sentence: "2 critical, 1 serious". */
export function summarize(counts: Record<Severity, number>, lang?: Lang): string {
  const parts = SEVERITIES.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${sevName(s, lang)}`);
  return parts.length ? parts.join(", ") : L(lang, "no problems found", "nenhum problema encontrado");
}

function mergeCounts(results: AuditResult[]): Record<Severity, number> {
  const c = { critical: 0, serious: 0, moderate: 0, minor: 0 } as Record<Severity, number>;
  for (const r of results) for (const s of SEVERITIES) c[s] += r.counts[s];
  return c;
}

// ---------------------------------------------------------------- text

const ANSI: Record<string, string> = { red: "31", yellow: "33", cyan: "36", magenta: "35", gray: "90", green: "32", bold: "1", dim: "2" };

export function formatText(input: AuditResult | AuditResult[], options: ReportOptions = {}): string {
  const results = Array.isArray(input) ? input : [input];
  const { lang, color = false, maxPerRule = 20 } = options;
  const c = (code: string, s: string): string => (color ? `\u001b[${ANSI[code]}m${s}\u001b[0m` : s);
  const sevColor: Record<Severity, string> = { critical: "magenta", serious: "red", moderate: "yellow", minor: "cyan" };
  const out: string[] = [];
  for (const r of results) {
    out.push("");
    out.push(c("bold", `${r.source ?? L(lang, "document", "documento")}`) + c("gray", `  ${r.title ? `"${r.title}"  ` : ""}${r.findings.length} ${L(lang, "finding(s)", "problema(s)")}, ${r.styles === "static" ? L(lang, "static CSS analysis", "análise estática de CSS") : L(lang, "browser styles", "estilos do navegador")}`));
    if (!r.findings.length) {
      out.push(c("green", `  ${L(lang, "Healthy: no problems found.", "Saudável: nenhum problema encontrado.")}`));
    }
    for (const group of groupByRule(r.findings)) {
      const f0 = group[0]!;
      const crit = f0.wcag.map((w) => `${w.id} ${lang === "pt" ? w.namePt : w.name} (${w.level})`).join(", ");
      out.push("");
      out.push(`  ${c(sevColor[f0.severity], c("bold", sevName(f0.severity, lang).toUpperCase().padEnd(9)))}${c("bold", f0.title[lang ?? "en"])} ${c("gray", `[${f0.rule}] x${group.length}`)}`);
      out.push(c("gray", `  ${" ".repeat(9)}WCAG ${crit}`));
      out.push(`  ${" ".repeat(9)}${wrap(f0.explanation[lang ?? "en"], 90, 11)}`);
      out.push(c("dim", `  ${" ".repeat(9)}${L(lang, "Affects", "Afeta")}: ${wrap(f0.affects[lang ?? "en"], 90, 19)}`));
      for (const f of group.slice(0, maxPerRule)) {
        out.push("");
        out.push(`    ${c("bold", "*")} ${f.message[lang ?? "en"]}`);
        out.push(c("gray", `      ${where(r, f) ? where(r, f) + "  " : ""}${f.selector}`));
        out.push(`      ${c("bold", L(lang, "Fix", "Correção"))}: ${wrap(f.fix.summary[lang ?? "en"], 90, 11)}${f.fix.safe ? c("green", ` (${L(lang, "auto fixable", "corrigível automaticamente")})`) : ""}`);
        if (f.fix.after !== f.fix.before) {
          for (const line of f.fix.before.split("\n")) out.push(c("red", `      - ${line}`));
          for (const line of f.fix.after.split("\n")) out.push(c("green", `      + ${line}`));
        } else {
          out.push(c("gray", `      ${f.html.split("\n")[0]}`));
        }
      }
      if (group.length > maxPerRule) out.push(c("gray", `    ... ${group.length - maxPerRule} ${L(lang, "more", "a mais")}`));
    }
    if (r.incomplete.length) {
      out.push("");
      out.push(c("yellow", `  ${L(lang, "Needs a human check", "Precisa de verificação humana")} (${r.incomplete.length}):`));
      for (const i of r.incomplete.slice(0, maxPerRule)) {
        out.push(c("gray", `    - ${i.message[lang ?? "en"]} ${i.line ? `(${r.source ?? "line"}:${i.line})` : ""} ${i.selector}`));
      }
    }
  }
  const total = mergeCounts(results);
  const n = results.reduce((a, r) => a + r.findings.length, 0);
  const fixable = results.reduce((a, r) => a + r.findings.filter((f) => f.fix.safe).length, 0);
  out.push("");
  out.push(
    c("bold", `${n} ${L(lang, "problem(s)", "problema(s)")}`) +
      ` (${summarize(total, lang)})` +
      (results.length > 1 ? ` ${L(lang, "in", "em")} ${results.length} ${L(lang, "documents", "documentos")}` : "") +
      (fixable ? c("green", `, ${fixable} ${L(lang, "fixable with `a11ymedic fix --write`", "corrigíveis com `a11ymedic fix --write`")}`) : ""),
  );
  return out.join("\n") + "\n";
}

function wrap(text: string, width: number, indent: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width - indent && line) {
      lines.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join("\n" + " ".repeat(indent));
}

// ---------------------------------------------------------------- json

/** A plain JSON report (live DOM elements are left out). */
export function toJSON(input: AuditResult | AuditResult[]): string {
  const results = Array.isArray(input) ? input : [input];
  return JSON.stringify(
    {
      tool: "a11ymedic",
      counts: mergeCounts(results),
      results,
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------- markdown

const fence = (lang: string, code: string): string => {
  const ticks = code.includes("```") ? "````" : "```";
  return `${ticks}${lang}\n${code}\n${ticks}`;
};

export function toMarkdown(input: AuditResult | AuditResult[], options: ReportOptions = {}): string {
  const results = Array.isArray(input) ? input : [input];
  const lang = options.lang ?? "en";
  const total = mergeCounts(results);
  const out: string[] = [];
  out.push(`# ${L(lang, "Accessibility report", "Relatório de acessibilidade")}`);
  out.push("");
  out.push(`${L(lang, "Checked", "Verificados")}: ${results.length} ${L(lang, "document(s)", "documento(s)")}. ${L(lang, "Result", "Resultado")}: **${summarize(total, lang)}**.`);
  out.push("");
  out.push(`| ${L(lang, "Document", "Documento")} | critical | serious | moderate | minor |`);
  out.push("| --- | ---: | ---: | ---: | ---: |");
  for (const r of results) out.push(`| ${(r.source ?? r.title) || "document"} | ${r.counts.critical} | ${r.counts.serious} | ${r.counts.moderate} | ${r.counts.minor} |`);
  for (const r of results) {
    if (!r.findings.length) continue;
    out.push("");
    out.push(`## ${r.source ?? (r.title || "Document")}`);
    for (const group of groupByRule(r.findings)) {
      const f0 = group[0]!;
      out.push("");
      out.push(`### ${f0.title[lang]} (${sevName(f0.severity, lang)}, ${group.length})`);
      out.push("");
      out.push(`${f0.explanation[lang]}`);
      out.push("");
      out.push(`**${L(lang, "Who is affected", "Quem é afetado")}:** ${f0.affects[lang]}`);
      out.push("");
      out.push(`**WCAG:** ${f0.wcag.map((w) => `[${w.id} ${lang === "pt" ? w.namePt : w.name}](${w.url}) (${w.level})`).join(", ")}. ${L(lang, "Rule", "Regra")}: \`${f0.rule}\``);
      for (const f of group.slice(0, options.maxPerRule ?? 50)) {
        out.push("");
        out.push(`- ${f.message[lang]}${where(r, f) ? ` \`${where(r, f)}\`` : ""}  `);
        out.push(`  ${L(lang, "Fix", "Correção")}: ${f.fix.summary[lang]}${f.fix.safe ? ` _(${L(lang, "auto fixable", "corrigível automaticamente")})_` : ""}`);
        out.push("");
        const diff = f.fix.after !== f.fix.before
          ? [...f.fix.before.split("\n").map((l) => `- ${l}`), ...f.fix.after.split("\n").map((l) => `+ ${l}`)].join("\n")
          : f.html;
        out.push(
          fence("diff", diff)
            .split("\n")
            .map((l) => `  ${l}`)
            .join("\n"),
        );
      }
    }
  }
  out.push("");
  out.push(`_${L(lang, "Generated by", "Gerado por")} [a11ymedic](https://kwy404.github.io/a11ymedic/)._`);
  return out.join("\n") + "\n";
}

// ---------------------------------------------------------------- html

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A self contained, accessible HTML report with light and dark themes. */
export function toHtml(input: AuditResult | AuditResult[], options: ReportOptions = {}): string {
  const results = Array.isArray(input) ? input : [input];
  const lang = options.lang ?? "en";
  const total = mergeCounts(results);
  const n = results.reduce((a, r) => a + r.findings.length, 0);
  const sections = results
    .map((r) => {
      const groups = groupByRule(r.findings)
        .map((group) => {
          const f0 = group[0]!;
          const items = group
            .map(
              (f) => `<li class="finding">
<p class="msg">${esc(f.message[lang])}</p>
<p class="loc"><code>${esc(where(r, f) || f.selector)}</code>${where(r, f) ? ` <code>${esc(f.selector)}</code>` : ""}</p>
<p class="fix"><strong>${L(lang, "Fix", "Correção")}:</strong> ${esc(f.fix.summary[lang])}${f.fix.safe ? ` <span class="safe">${L(lang, "auto fixable", "corrigível automaticamente")}</span>` : ""}</p>
<div class="code"><div><span class="label">${L(lang, "Before", "Antes")}</span><pre><code>${esc(f.fix.before)}</code></pre></div><div><span class="label">${L(lang, "After", "Depois")}</span><pre><code>${esc(f.fix.after)}</code></pre></div></div>
</li>`,
            )
            .join("\n");
          return `<section class="rule sev-${f0.severity}" aria-labelledby="${esc(r.source ?? "doc")}-${f0.rule}">
<h3 id="${esc(r.source ?? "doc")}-${f0.rule}"><span class="badge">${sevName(f0.severity, lang)}</span> ${esc(f0.title[lang])} <span class="count">${group.length}</span></h3>
<p>${esc(f0.explanation[lang])}</p>
<p><strong>${L(lang, "Who is affected", "Quem é afetado")}:</strong> ${esc(f0.affects[lang])}</p>
<p class="wcag">WCAG ${f0.wcag.map((w) => `<a href="${w.url}">${w.id} ${esc(lang === "pt" ? w.namePt : w.name)}</a> (${w.level})`).join(", ")} &middot; <code>${f0.rule}</code></p>
<ol class="findings">${items}</ol>
</section>`;
        })
        .join("\n");
      return `<section class="doc"><h2>${esc((r.source ?? r.title) || "Document")}</h2><p class="summary">${esc(summarize(r.counts, lang))}</p>${groups || `<p class="healthy">${L(lang, "Healthy: no problems found.", "Saudável: nenhum problema encontrado.")}</p>`}</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${L(lang, "Accessibility report", "Relatório de acessibilidade")} (a11ymedic)</title>
<style>
:root{--bg:#f6fbfb;--card:#fff;--text:#12343b;--muted:#46666c;--line:#bfe6e1;--teal:#0a6b6d;--coral:#b4402f;--code:#eef7f6;--critical:#8a1c5c;--serious:#b4261a;--moderate:#8a5a00;--minor:#0a5c7a}
@media (prefers-color-scheme:dark){:root{--bg:#0b1f24;--card:#10323a;--text:#e8f6f5;--muted:#9fc9c6;--line:#1f5660;--teal:#5fd6cb;--coral:#ff9a8a;--code:#0b262c;--critical:#ff8fcf;--serious:#ff9a8a;--moderate:#ffd27a;--minor:#8fd8ff}}
*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,"Segoe UI",Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text)}
main{max-width:1000px;margin:0 auto;padding:24px 16px 64px}h1{margin:.2em 0;font-size:1.8rem}a{color:var(--teal)}
.totals{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.totals li{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 12px}
.doc{margin-top:32px}.rule{background:var(--card);border:1px solid var(--line);border-left:6px solid var(--teal);border-radius:12px;padding:16px;margin:16px 0}
.sev-critical{border-left-color:var(--critical)}.sev-serious{border-left-color:var(--serious)}.sev-moderate{border-left-color:var(--moderate)}.sev-minor{border-left-color:var(--minor)}
.badge{display:inline-block;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;border:1px solid currentColor;border-radius:6px;padding:0 6px;vertical-align:middle}
.sev-critical .badge{color:var(--critical)}.sev-serious .badge{color:var(--serious)}.sev-moderate .badge{color:var(--moderate)}.sev-minor .badge{color:var(--minor)}
.count{color:var(--muted);font-weight:400}.wcag,.loc{color:var(--muted);font-size:.9rem}.findings{padding-left:20px}.finding{margin:14px 0}
.code{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media (max-width:700px){.code{grid-template-columns:1fr}}
.label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}pre{margin:2px 0 0;background:var(--code);border:1px solid var(--line);border-radius:8px;padding:10px;overflow:auto;white-space:pre-wrap;word-break:break-word}
code{font:13px/1.5 ui-monospace,Consolas,monospace}.safe{color:var(--teal);font-size:.85rem;border:1px solid var(--line);border-radius:6px;padding:0 6px}.healthy{color:var(--teal);font-weight:600}
</style>
</head>
<body>
<main>
<p>a11ymedic</p>
<h1>${L(lang, "Accessibility report", "Relatório de acessibilidade")}</h1>
<p>${n} ${L(lang, "problem(s) in", "problema(s) em")} ${results.length} ${L(lang, "document(s)", "documento(s)")}.</p>
<ul class="totals">${SEVERITIES.map((s) => `<li>${total[s]} ${sevName(s, lang)}</li>`).join("")}</ul>
${sections}
</main>
</body>
</html>
`;
}

// ---------------------------------------------------------------- GitHub Actions

const escData = (s: string): string => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s: string): string => escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** Workflow commands that show findings as annotations on the changed files. */
export function githubAnnotations(input: AuditResult | AuditResult[], options: ReportOptions = {}): string {
  const results = Array.isArray(input) ? input : [input];
  const lang = options.lang ?? "en";
  const lines: string[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      const level = f.severity === "critical" || f.severity === "serious" ? "error" : f.severity === "moderate" ? "warning" : "notice";
      const props = [r.source && !/^https?:/.test(r.source) ? `file=${escProp(r.source)}` : "", f.line ? `line=${f.line}` : "", f.column ? `col=${f.column}` : "", `title=${escProp(`${f.title[lang]} (WCAG ${f.wcag.map((w) => w.id).join(", ")})`)}`]
        .filter(Boolean)
        .join(",");
      lines.push(`::${level} ${props}::${escData(`${f.message[lang]}\nFix: ${f.fix.summary[lang]}\n${f.fix.after}`)}`);
    }
  }
  return lines.join("\n") + (lines.length ? "\n" : "");
}

/** Markdown for $GITHUB_STEP_SUMMARY. */
export function githubSummary(input: AuditResult | AuditResult[], options: ReportOptions = {}): string {
  const results = Array.isArray(input) ? input : [input];
  const lang = options.lang ?? "en";
  const total = mergeCounts(results);
  const n = results.reduce((a, r) => a + r.findings.length, 0);
  const out: string[] = [];
  out.push(`## a11ymedic: ${n === 0 ? L(lang, "healthy", "saudável") : summarize(total, lang)}`);
  out.push("");
  out.push(`| ${L(lang, "Document", "Documento")} | critical | serious | moderate | minor | ${L(lang, "auto fixable", "corrigível")} |`);
  out.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const r of results) {
    out.push(`| ${(r.source ?? r.title) || "document"} | ${r.counts.critical} | ${r.counts.serious} | ${r.counts.moderate} | ${r.counts.minor} | ${r.findings.filter((f) => f.fix.safe).length} |`);
  }
  const rules = new Map<string, { title: string; count: number; severity: Severity; url: string }>();
  for (const r of results) {
    for (const f of r.findings) {
      const e = rules.get(f.rule) ?? { title: f.title[lang], count: 0, severity: f.severity, url: f.wcag[0]?.url ?? "" };
      e.count++;
      rules.set(f.rule, e);
    }
  }
  if (rules.size) {
    out.push("");
    out.push(`### ${L(lang, "Top problems", "Principais problemas")}`);
    out.push("");
    for (const [id, e] of [...rules].sort((a, b) => b[1].count - a[1].count).slice(0, 15)) {
      out.push(`- **${e.title}** (\`${id}\`, ${sevName(e.severity, lang)}): ${e.count}. [WCAG](${e.url})`);
    }
  }
  return out.join("\n") + "\n";
}
