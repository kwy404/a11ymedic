import { describe, expect, it } from "vitest";
import { audit, formatText, githubAnnotations, githubSummary, summarize, toHtml, toJSON, toMarkdown } from "../src/index";
import { toHaveNoViolations } from "../src/matchers";
import "../src/vitest";

const BROKEN = '<main><h1>Hi</h1><img src="team.jpg"><p style="color:#aaa">Low</p><button></button></main>';

describe("reports", () => {
  it("text report groups by rule, shows the fix as a diff and a summary", async () => {
    const result = await audit(BROKEN, { source: "page.html" });
    const text = formatText(result);
    expect(text).toContain("page.html");
    expect(text).toContain("CRITICAL Image without alt text [image-alt] x1");
    expect(text).toContain("WCAG 1.1.1 Non-text Content (A)");
    expect(text).toContain('- <img src="team.jpg">');
    expect(text).toContain('+ <img src="team.jpg" alt="Team">');
    expect(text).toMatch(/page\.html:1:\d+/);
    expect(text).toContain("problem(s) (2 critical, 1 serious)");
    expect(text).not.toContain("\u001b[");
    expect(formatText(result, { color: true })).toContain("\u001b[");
  });

  it("text report in Portuguese", async () => {
    const text = formatText(await audit(BROKEN), { lang: "pt" });
    expect(text).toContain("Imagem sem texto alternativo");
    expect(text).toContain("Correção");
    expect(text).toContain("2 crítico, 1 grave");
  });

  it("text report says when a page is healthy and lists human checks", async () => {
    const healthy = formatText(await audit("<main><h1>Hi</h1></main>"));
    expect(healthy).toContain("Healthy: no problems found.");
    const review = formatText(await audit('<div style="background:url(a.jpg)"><p style="color:#fff">x</p></div>'));
    expect(review).toContain("Needs a human check (1)");
  });

  it("limits instances per rule", async () => {
    const many = Array.from({ length: 5 }, (_, i) => `<img src="p${i}.png">`).join("");
    expect(formatText(await audit(many), { maxPerRule: 2 })).toContain("... 3 more");
  });

  it("JSON report is plain data", async () => {
    const json = JSON.parse(toJSON(await audit(BROKEN)));
    expect(json.tool).toBe("a11ymedic");
    expect(json.counts.critical).toBe(2);
    expect(json.results[0].findings[0].fix.after).toBeTruthy();
    expect(json.results[0].findings[0].element).toBeUndefined();
  });

  it("Markdown report has a table, explanations and diff blocks", async () => {
    const md = toMarkdown(await audit(BROKEN, { source: "a.html" }));
    expect(md).toContain("# Accessibility report");
    expect(md).toContain("| a.html | 2 | 1 | 0 | 0 |");
    expect(md).toContain("### Image without alt text (critical, 1)");
    expect(md).toContain("**Who is affected:**");
    expect(md).toContain("```diff");
    expect(md).toContain("[1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)");
    expect(toMarkdown(await audit(BROKEN), { lang: "pt" })).toContain("# Relatório de acessibilidade");
  });

  it("HTML report is a complete, escaped, accessible page", async () => {
    const html = toHtml(await audit(BROKEN, { source: "a.html" }));
    expect(html).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(html).toContain("<title>Accessibility report (a11ymedic)</title>");
    expect(html).toContain("&lt;img src=&quot;team.jpg&quot;&gt;");
    expect(html).not.toContain('<img src="team.jpg">');
    expect(html).toContain("prefers-color-scheme:dark");
    const checked = await audit(html);
    expect(checked.findings.map((f) => `${f.rule}: ${f.message.en}`)).toEqual([]);
    expect(toHtml(await audit("<main><h1>x</h1></main>"), { lang: "pt" })).toContain("Saudável");
  });

  it("GitHub annotations escape data and map severities", async () => {
    const out = githubAnnotations(await audit(BROKEN, { source: "src/a,b.html" }));
    const lines = out.trim().split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^::error file=src\/a%2Cb\.html,line=1,col=\d+,title=Image without alt text \(WCAG 1\.1\.1\)::/);
    expect(out).toContain("%0AFix: ");
    const minor = githubAnnotations(await audit('<input type="email" aria-label="Email">'));
    expect(minor).toMatch(/^::notice /);
    const moderate = githubAnnotations(await audit("<h2></h2>"));
    expect(moderate).toMatch(/^::warning /);
    expect(githubAnnotations(await audit("<p>ok</p>"))).toBe("");
  });

  it("GitHub job summary", async () => {
    const md = githubSummary([await audit(BROKEN, { source: "a.html" }), await audit("<p>ok</p>", { source: "b.html" })]);
    expect(md).toContain("## a11ymedic: 2 critical, 1 serious");
    expect(md).toContain("| b.html | 0 | 0 | 0 | 0 | 0 |");
    expect(md).toContain("### Top problems");
    expect(githubSummary(await audit("<p>ok</p>"))).toContain("healthy");
  });

  it("summarize", () => {
    expect(summarize({ critical: 1, serious: 0, moderate: 2, minor: 0 })).toBe("1 critical, 2 moderate");
    expect(summarize({ critical: 0, serious: 0, moderate: 0, minor: 0 }, "pt")).toBe("nenhum problema encontrado");
  });
});

describe("test matchers", () => {
  it("toHaveNoViolations passes for healthy HTML", async () => {
    expect(await audit('<img src="a.png" alt="A cat">')).toHaveNoViolations();
  });

  it("toHaveNoViolations fails with a readable message", async () => {
    const result = toHaveNoViolations(await audit('<img src="a.png">'));
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("found 1");
    expect(result.message()).toContain("image-alt");
    expect(() => expect({ findings: [{ rule: "x", severity: "minor" }] }).not.toHaveNoViolations()).not.toThrow();
  });

  it("filters by severity and ignored rules", async () => {
    const result = await audit('<input type="email" aria-label="Email">');
    expect(result).toHaveNoViolations({ severity: "serious" });
    expect(result).toHaveNoViolations({ ignore: ["input-purpose"] });
    expect(toHaveNoViolations(result).pass).toBe(false);
  });

  it("explains a missing await", () => {
    const r = toHaveNoViolations(Promise.resolve());
    expect(r.pass).toBe(false);
    expect(r.message()).toContain("forget await");
  });
});
