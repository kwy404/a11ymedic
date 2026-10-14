import { describe, expect, it } from "vitest";
import { audit, RULES, ruleList, CRITERIA } from "../src/index";
import { RULE_CASES, page } from "./fixtures/rules";

describe("rule catalog", () => {
  it("has at least 40 rules, all with unique ids", () => {
    expect(RULES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
  });

  it("maps every rule to known WCAG 2.2 criteria, with text in English and Portuguese", () => {
    for (const r of ruleList()) {
      expect(r.wcag.length, r.id).toBeGreaterThan(0);
      for (const id of r.wcag) expect(CRITERIA[id], `${r.id} ${id}`).toBeDefined();
      for (const field of [r.title, r.explanation, r.affects]) {
        expect(field.en.length, r.id).toBeGreaterThan(10);
        expect(field.pt.length, r.id).toBeGreaterThan(10);
        expect(field.pt).not.toBe(field.en);
      }
    }
  });

  it("has a passing and a failing fixture for every rule", () => {
    const covered = new Set(RULE_CASES.map((c) => c.rule));
    expect(RULES.map((r) => r.id).filter((id) => !covered.has(id))).toEqual([]);
  });
});

describe.each(RULE_CASES)("$rule", ({ rule, fail, pass, level }) => {
  const options = { level: level ?? ("AA" as const) };

  it("reports the failing fixture with a complete finding", async () => {
    const result = await audit(fail, options);
    const found = result.findings.filter((f) => f.rule === rule);
    expect(found.length, JSON.stringify(result.findings.map((f) => f.rule))).toBeGreaterThan(0);
    for (const f of found) {
      expect(f.message.en).toBeTruthy();
      expect(f.message.pt).toBeTruthy();
      expect(f.explanation.pt).toBeTruthy();
      expect(f.affects.en).toBeTruthy();
      expect(f.wcag[0]!.url).toMatch(/^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/.+\.html$/);
      expect(f.selector).toBeTruthy();
      expect(f.html).toBeTruthy();
      expect(f.fix.summary.en).toBeTruthy();
      expect(f.fix.summary.pt).toBeTruthy();
      expect(f.fix.before).toBeTruthy();
      expect(typeof f.fix.after).toBe("string");
      expect(f.line).toBeGreaterThan(0);
    }
  });

  it("does not report the passing fixture", async () => {
    const result = await audit(pass, options);
    expect(result.findings.filter((f) => f.rule === rule).map((f) => f.message.en)).toEqual([]);
  });
});

describe("page level rules and fragments", () => {
  it("skips page rules for component fragments", async () => {
    const result = await audit("<p>Just a card</p>");
    expect(result.fragment).toBe(true);
    expect(result.rules).not.toContain("document-title");
    expect(result.rules).not.toContain("html-has-lang");
  });

  it("runs page rules for full documents", async () => {
    const result = await audit(page("<main><h1>Hi</h1></main>", { title: null, lang: null }));
    expect(result.fragment).toBe(false);
    expect(result.findings.map((f) => f.rule)).toEqual(expect.arrayContaining(["document-title", "html-has-lang"]));
  });

  it("a well built page is healthy", async () => {
    const html = page(
      `<a class="skip" href="#main">Skip to main content</a>
<header><nav aria-label="Main"><a href="/">Home</a> <a href="/docs">Docs</a></nav></header>
<main id="main">
  <h1>Welcome</h1>
  <img src="team.jpg" alt="Our team at the summer meetup">
  <form><label for="email">Email</label><input id="email" type="email" autocomplete="email"><button>Subscribe</button></form>
  <table><caption>Plans</caption><tr><th scope="col">Plan</th><th scope="col">Price</th></tr><tr><td>Basic</td><td>9</td></tr></table>
</main>
<footer><p>Made with care</p></footer>`,
    );
    const result = await audit(html);
    expect(result.findings.map((f) => `${f.rule}: ${f.message.en}`)).toEqual([]);
  });
});

describe("options", () => {
  it("level A skips AA rules", async () => {
    const result = await audit('<p style="color:#999">x</p>', { level: "A" });
    expect(result.rules).not.toContain("color-contrast");
  });

  it("rules and disable filter what runs", async () => {
    const only = await audit('<img src="a.png"><button></button>', { rules: ["button-name"] });
    expect(only.rules).toEqual(["button-name"]);
    const without = await audit('<img src="a.png"><button></button>', { disable: ["button-name"] });
    expect(without.findings.some((f) => f.rule === "button-name")).toBe(false);
  });

  it("exclude ignores matching elements and their descendants", async () => {
    const result = await audit('<div class="ads"><img src="ad.png"></div><img src="b.png">', { exclude: [".ads"] });
    expect(result.findings.filter((f) => f.rule === "image-alt")).toHaveLength(1);
  });

  it("data-a11ymedic-ignore skips an element", async () => {
    const result = await audit('<img src="ad.png" data-a11ymedic-ignore>');
    expect(result.findings).toEqual([]);
  });

  it("sorts findings from most to least severe and counts them", async () => {
    const result = await audit('<h2></h2><img src="a.png"><div tabindex="3">x</div>');
    const ranks = result.findings.map((f) => ["minor", "moderate", "serious", "critical"].indexOf(f.severity));
    expect([...ranks].sort((a, b) => b - a)).toEqual(ranks);
    expect(result.counts.critical).toBe(result.findings.filter((f) => f.severity === "critical").length);
  });

  it("audits a Document or an Element directly", async () => {
    const { parseHtml } = await import("../src/parse");
    const parsed = await parseHtml('<!doctype html><html lang="en"><title>x</title><body><main><h1>x</h1><div id="card"><img src="a.png"></div></main></body></html>');
    const docResult = await audit(parsed.document);
    expect(docResult.findings.some((f) => f.rule === "image-alt")).toBe(true);
    const elResult = await audit(parsed.document.getElementById("card")!);
    expect(elResult.fragment).toBe(true);
    expect(elResult.findings.map((f) => f.rule)).toEqual(["image-alt"]);
  });

  it("keeps the live element on findings without serializing it", async () => {
    const result = await audit('<img src="a.png">');
    expect(result.findings[0]!.element?.localName).toBe("img");
    expect(JSON.stringify(result.findings[0])).not.toContain('"element"');
  });
});
