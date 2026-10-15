import { score, type Score } from "./score";
import { SEVERITIES, severityRank, type AuditResult, type Finding, type Lang, type Severity } from "./types";
import { VERSION } from "./version";

export interface ReportOptions {
  lang?: Lang;
  /** Use ANSI colors (text format only). */
  color?: boolean;
  /** Show at most this many instances per rule in text output. Default 20. */
  maxPerRule?: number;
  /** Date printed on the HTML report. Default today. */
  date?: Date | string;
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
    out.push(c("bold", `${r.source ?? L(lang, "document", "documento")}`) + c("gray", `  ${r.title ? `"${r.title}"  ` : ""}${r.findings.length} ${L(lang, "finding(s)", "problema(s)")}, ${L(lang, "score", "nota")} ${score(r).value}/100, ${r.styles === "static" ? L(lang, "static CSS analysis", "análise estática de CSS") : L(lang, "browser styles", "estilos do navegador")}`));
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
  const overall = score(results);
  const gradeColor = overall.grade === "healthy" ? "green" : overall.grade === "fair" ? "yellow" : "red";
  out.push(`${L(lang, "Health score", "Nota de saúde")}: ${c(gradeColor, c("bold", `${overall.value}/100`))} (${overall.label[lang ?? "en"]})`);
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
  const overall = score(results);
  out.push(`${L(lang, "Checked", "Verificados")}: ${results.length} ${L(lang, "document(s)", "documento(s)")}. ${L(lang, "Result", "Resultado")}: **${summarize(total, lang)}**.`);
  out.push("");
  out.push(`${L(lang, "Health score", "Nota de saúde")}: **${overall.value}/100** (${overall.label[lang]}).`);
  out.push("");
  out.push(`| ${L(lang, "Document", "Documento")} | critical | serious | moderate | minor | ${L(lang, "score", "nota")} |`);
  out.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const r of results) out.push(`| ${(r.source ?? r.title) || "document"} | ${r.counts.critical} | ${r.counts.serious} | ${r.counts.moderate} | ${r.counts.minor} | ${score(r).value} |`);
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

/** The date shown on reports, as YYYY-MM-DD. */
const dayOf = (date: Date | string | undefined): string => {
  if (typeof date === "string") return date;
  return (date ?? new Date()).toISOString().slice(0, 10);
};

const GAUGE_R = 52;
const GAUGE_C = (2 * Math.PI * GAUGE_R).toFixed(1);

/** A score ring: an SVG arc with the number in the middle, named for screen readers. */
export function scoreGauge(s: Score, lang: Lang = "en", size: "big" | "small" = "big"): string {
  const label = L(lang, `Health score ${s.value} out of 100: ${s.label.en}`, `Nota de saúde ${s.value} de 100: ${s.label.pt}`);
  const dash = ((s.value / 100) * Number(GAUGE_C)).toFixed(1);
  return `<div class="gauge gauge-${size} g-${s.grade}" role="img" aria-label="${esc(label)}"><svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="track" cx="60" cy="60" r="${GAUGE_R}"/><circle class="arc" cx="60" cy="60" r="${GAUGE_R}" stroke-dasharray="${dash} ${GAUGE_C}" transform="rotate(-90 60 60)"/></svg><span class="num" aria-hidden="true">${s.value}</span></div>`;
}

const REPORT_CSS = `
:root{--bg:#f6fbfb;--card:#fff;--text:#12343b;--muted:#46666c;--line:#bfe6e1;--teal:#0a6b6d;--coral:#b4402f;--code:#eef7f6;--critical:#8a1c5c;--serious:#b4261a;--moderate:#8a5a00;--minor:#0a5c7a;--track:#dcefed}
@media (prefers-color-scheme:dark){:root{--bg:#0b1f24;--card:#10323a;--text:#e8f6f5;--muted:#9fc9c6;--line:#1f5660;--teal:#5fd6cb;--coral:#ff9a8a;--code:#0b262c;--critical:#ff8fcf;--serious:#ff9a8a;--moderate:#ffd27a;--minor:#8fd8ff;--track:#1f4a52}}
*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,"Segoe UI",Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text)}
main{max-width:1000px;margin:0 auto;padding:24px 16px 64px}h1{margin:.1em 0;font-size:1.8rem}a{color:var(--teal)}
.top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:12px}
.brand{margin:0;font-weight:700;color:var(--teal);letter-spacing:.04em}.meta{margin:0;color:var(--muted)}
.print{font:inherit;font-weight:600;color:var(--bg);background:var(--teal);border:0;border-radius:10px;padding:10px 16px;min-height:44px;cursor:pointer}
.print:focus-visible{outline:3px solid var(--coral);outline-offset:2px}
.overview{display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin:20px 0;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.overview p{margin:.2em 0}.grade{font-size:1.4rem;font-weight:700}
.gauge{position:relative;flex:none;display:grid;place-items:center}.gauge svg{width:100%;height:100%}
.gauge-big{width:132px;height:132px}.gauge-small{width:64px;height:64px}
.gauge circle{fill:none;stroke-width:12}.gauge .track{stroke:var(--track)}.gauge .arc{stroke:var(--g);stroke-linecap:round}
.gauge .num{position:absolute;font-weight:800;color:var(--g)}.gauge-big .num{font-size:2.4rem}.gauge-small .num{font-size:1.1rem}
.g-healthy{--g:var(--teal)}.g-fair{--g:var(--moderate)}.g-unwell{--g:var(--serious)}.g-urgent{--g:var(--critical)}
.totals{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:8px 0 0;list-style:none}.totals li{background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:2px 12px}
table{border-collapse:collapse;width:100%;margin:16px 0;background:var(--card)}caption{text-align:left;font-weight:700;padding:4px 0}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:right}th[scope=row],thead th:first-child{text-align:left}
.doc{margin-top:36px}.doc-head{display:flex;align-items:center;gap:14px}.doc-head h2{margin:0;font-size:1.3rem;word-break:break-word}.summary{margin:0;color:var(--muted)}
.rule{background:var(--card);border:1px solid var(--line);border-left:6px solid var(--teal);border-radius:12px;padding:16px;margin:16px 0}
.sev-critical{border-left-color:var(--critical)}.sev-serious{border-left-color:var(--serious)}.sev-moderate{border-left-color:var(--moderate)}.sev-minor{border-left-color:var(--minor)}
.badge{display:inline-block;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;border:1px solid currentColor;border-radius:6px;padding:0 6px;vertical-align:middle}
.sev-critical .badge{color:var(--critical)}.sev-serious .badge{color:var(--serious)}.sev-moderate .badge{color:var(--moderate)}.sev-minor .badge{color:var(--minor)}
.count{color:var(--muted);font-weight:400}.wcag,.loc{color:var(--muted);font-size:.9rem}.findings{padding-left:20px}.finding{margin:14px 0}
.code{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media (max-width:700px){.code{grid-template-columns:1fr}}
.label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}pre{margin:2px 0 0;background:var(--code);border:1px solid var(--line);border-radius:8px;padding:10px;overflow:auto;white-space:pre-wrap;word-break:break-word}
code{font:13px/1.5 ui-monospace,Consolas,monospace}.safe{color:var(--teal);font-size:.85rem;border:1px solid var(--line);border-radius:6px;padding:0 6px}.healthy{color:var(--teal);font-weight:600}
.review{margin:12px 0;color:var(--muted)}.review summary{cursor:pointer;font-weight:600}
footer{margin-top:40px;border-top:1px solid var(--line);padding-top:12px;color:var(--muted);font-size:.9rem}
@media (prefers-reduced-motion:no-preference){.gauge .arc{animation:a11ymedic-fill .9s ease-out both}}
@keyframes a11ymedic-fill{from{stroke-dasharray:0 ${GAUGE_C}}}
@media print{
:root{--bg:#fff;--card:#fff;--text:#111;--muted:#444;--line:#bbb;--teal:#0a5557;--code:#f4f4f4;--critical:#8a1c5c;--serious:#a3221a;--moderate:#6e4700;--minor:#0a4c66;--track:#e4e4e4}
@page{margin:14mm}
body{font-size:11pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
main{max-width:none;padding:0}.print{display:none}.gauge .arc{animation:none}
.rule{padding:10px 12px;margin:10px 0}
h2,h3{break-after:avoid}.code,.doc-head,.overview,tr{break-inside:avoid}.msg,.loc{break-after:avoid}
.code{grid-template-columns:1fr 1fr}pre{overflow:visible}
.wcag a{color:inherit;text-decoration:none}.wcag a::after{content:" (" attr(href) ")";font-size:8pt;word-break:break-all}
}
`;

/**
 * A self contained, accessible HTML report with light and dark themes, a 0 to 100 health score
 * and a print layout: open it in a browser and print it or save it as PDF.
 */
export function toHtml(input: AuditResult | AuditResult[], options: ReportOptions = {}): string {
  const results = Array.isArray(input) ? input : [input];
  const lang = options.lang ?? "en";
  const total = mergeCounts(results);
  const n = results.reduce((a, r) => a + r.findings.length, 0);
  const fixable = results.reduce((a, r) => a + r.findings.filter((f) => f.fix.safe).length, 0);
  const overall = score(results);
  const day = dayOf(options.date);
  const docName = (r: AuditResult): string => (r.source ?? r.title) || L(lang, "Document", "Documento");
  const sections = results
    .map((r, ri) => {
      const id = `d${ri}`;
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
          return `<section class="rule sev-${f0.severity}" aria-labelledby="${id}-${f0.rule}">
<h3 id="${id}-${f0.rule}"><span class="badge">${sevName(f0.severity, lang)}</span> ${esc(f0.title[lang])} <span class="count">${group.length}</span></h3>
<p>${esc(f0.explanation[lang])}</p>
<p><strong>${L(lang, "Who is affected", "Quem é afetado")}:</strong> ${esc(f0.affects[lang])}</p>
<p class="wcag">WCAG ${f0.wcag.map((w) => `<a href="${w.url}">${w.id} ${esc(lang === "pt" ? w.namePt : w.name)}</a> (${w.level})`).join(", ")} &middot; <code>${f0.rule}</code></p>
<ol class="findings">${items}</ol>
</section>`;
        })
        .join("\n");
      const s = score(r);
      const review = r.incomplete.length
        ? `<details class="review"><summary>${L(lang, "Needs a human check", "Precisa de verificação humana")} (${r.incomplete.length})</summary><ul>${r.incomplete
            .map((i) => `<li>${esc(i.message[lang])} <code>${esc(i.line ? `${r.source ?? L(lang, "line", "linha")}:${i.line}` : i.selector)}</code></li>`)
            .join("")}</ul></details>`
        : "";
      return `<section class="doc" aria-labelledby="${id}">
<div class="doc-head">${scoreGauge(s, lang, "small")}<div><h2 id="${id}">${esc(docName(r))}</h2><p class="summary">${esc(s.label[lang])}: ${esc(summarize(r.counts, lang))}</p></div></div>
${groups}
${review}
</section>`;
    })
    .join("\n");
  const table =
    results.length > 1
      ? `<table class="docs"><caption>${L(lang, "Documents checked", "Documentos verificados")}</caption>
<thead><tr><th scope="col">${L(lang, "Document", "Documento")}</th><th scope="col">${L(lang, "Score", "Nota")}</th>${SEVERITIES.map((sv) => `<th scope="col">${sevName(sv, lang)}</th>`).join("")}</tr></thead>
<tbody>${results.map((r, ri) => `<tr><th scope="row"><a href="#d${ri}">${esc(docName(r))}</a></th><td>${score(r).value}</td>${SEVERITIES.map((sv) => `<td>${r.counts[sv]}</td>`).join("")}</tr>`).join("")}</tbody>
</table>`
      : "";
  const title = L(lang, "Accessibility report", "Relatório de acessibilidade");
  return `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} (a11ymedic)</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<main>
<header class="top">
<div><p class="brand">a11ymedic</p><h1>${title}</h1><p class="meta">${L(lang, "Checked on", "Verificado em")} <time datetime="${esc(day)}">${esc(day)}</time> &middot; ${results.length} ${L(lang, "document(s)", "documento(s)")}</p></div>
<button type="button" class="print" onclick="window.print()">${L(lang, "Print or save as PDF", "Imprimir ou salvar em PDF")}</button>
</header>
<section class="overview" aria-label="${L(lang, "Summary", "Resumo")}">
${scoreGauge(overall, lang)}
<div><p class="grade">${esc(overall.label[lang])}</p>
<p>${n} ${L(lang, "problem(s) in", "problema(s) em")} ${results.length} ${L(lang, "document(s)", "documento(s)")}${fixable ? `, ${fixable} ${L(lang, "fixable with", "corrigíveis com")} <code>a11ymedic fix --write</code>` : ""}.</p>
<ul class="totals">${SEVERITIES.map((sv) => `<li>${total[sv]} ${sevName(sv, lang)}</li>`).join("")}</ul></div>
</section>
${table}
${sections}
<footer>
<p>${L(
    lang,
    "How the score works: every failing rule takes points by severity (critical 12, serious 7, moderate 3, minor 1), up to double when it repeats. 100 means no automated findings. Healthy needs 90 or more and no critical or serious problem.",
    "Como a nota funciona: cada regra com problema tira pontos pela gravidade (crítico 12, grave 7, moderado 3, leve 1), até o dobro quando se repete. 100 significa nenhum problema encontrado automaticamente. Saudável pede 90 ou mais e nenhum problema crítico ou grave.",
  )}</p>
<p>${L(
    lang,
    "Automated checks find many common problems but not all of them. Test with a keyboard and a screen reader too.",
    "Verificações automáticas encontram muitos problemas comuns, mas não todos. Teste também com teclado e leitor de tela.",
  )}</p>
<p>${L(lang, "Generated by", "Gerado por")} <a href="https://kwy404.github.io/a11ymedic/">a11ymedic</a> ${VERSION}.</p>
</footer>
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
  out.push(`## a11ymedic: ${n === 0 ? L(lang, "healthy", "saudável") : summarize(total, lang)} (${L(lang, "score", "nota")} ${score(results).value}/100)`);
  out.push("");
  out.push(`| ${L(lang, "Document", "Documento")} | critical | serious | moderate | minor | ${L(lang, "auto fixable", "corrigível")} | ${L(lang, "score", "nota")} |`);
  out.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const r of results) {
    out.push(`| ${(r.source ?? r.title) || "document"} | ${r.counts.critical} | ${r.counts.serious} | ${r.counts.moderate} | ${r.counts.minor} | ${r.findings.filter((f) => f.fix.safe).length} | ${score(r).value} |`);
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
