import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { expandGlobs, globToRegExp } from "../src/node/glob";
import { unifiedDiff } from "../src/node/diff";
import { detectLanguage, hrefHint, humanize, iconHint, isGenericLinkText, isValidLang, repairLang, slug } from "../src/rules/helpers";
import { isValidAutocomplete } from "../src/rules/forms";
import { repairViewport } from "../src/rules/document";
import { editDistance, isValidAriaValue, suggestAriaAttribute, suggestRole } from "../src/aria";
import { parseHtml, isFragment } from "../src/parse";

describe("glob", () => {
  it.each([
    ["**/*.html", "a.html", true],
    ["**/*.html", "x/y/a.html", true],
    ["*.html", "x/a.html", false],
    ["*.{html,htm}", "a.htm", true],
    ["page?.html", "page1.html", true],
    ["[ab].html", "c.html", false],
    ["[!ab].html", "c.html", true],
    ["docs/**", "docs/a/b.html", true],
    ["a+b.html", "a+b.html", true],
  ])("%s matches %s: %s", (glob, path, expected) => {
    expect(globToRegExp(glob).test(path)).toBe(expected);
  });

  it("expands files, directories and globs, skipping node_modules", () => {
    const dir = mkdtempSync(join(tmpdir(), "a11ymedic-glob-"));
    mkdirSync(join(dir, "a", "b"), { recursive: true });
    mkdirSync(join(dir, "node_modules"), { recursive: true });
    for (const f of ["a/one.html", "a/b/two.htm", "a/b/skip.txt", "node_modules/x.html", "top.html"]) writeFileSync(join(dir, f), "");
    const rel = (list: string[]) => list.map((f) => f.slice(dir.length + 1).replace(/\\/g, "/"));
    expect(rel(expandGlobs(["**/*.html"], dir))).toEqual(["a/one.html", "top.html"]);
    expect(rel(expandGlobs(["a"], dir))).toEqual(["a/b/two.htm", "a/one.html"]);
    expect(rel(expandGlobs(["top.html", "top.html", "missing.html"], dir))).toEqual(["top.html"]);
    expect(rel(expandGlobs(["node_modules/*.html"], dir))).toEqual(["node_modules/x.html"]);
    expect(rel(expandGlobs(["a\\b\\*.htm"], dir))).toEqual(["a/b/two.htm"]);
  });
});

describe("unifiedDiff", () => {
  it("returns nothing for equal texts", () => {
    expect(unifiedDiff("a\nb", "a\nb")).toBe("");
  });

  it("shows changed lines with context and hunk headers", () => {
    const a = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].join("\n");
    const b = ["1", "2", "3", "four", "5", "6", "7", "8", "9", "ten", "11"].join("\n");
    const d = unifiedDiff(a, b, "f.html");
    expect(d).toContain("--- f.html\n+++ f.html\n");
    expect(d).toContain("@@ -2,5 +2,5 @@\n 2\n 3\n-4\n+four\n 5\n 6\n");
    expect(d).toContain("-10\n+ten\n+11");
  });

  it("handles insertions at the start and deletions at the end", () => {
    expect(unifiedDiff("b\nc", "a\nb\nc")).toContain("@@ -1,2 +1,3 @@\n+a\n b\n c");
    expect(unifiedDiff("a\nb\nc", "a\nb")).toContain("-c");
  });
});

describe("rule helpers", () => {
  it.each([
    ["team-photo_2024.jpg", "Team 2024"],
    ["/images/IMG_20240101_ab12cd34ef.png", ""],
    ["firstName", "First name"],
    ["first_name", "First name"],
    ["https://x.com/about-us/?q=1", "About us"],
    ["", ""],
  ])("humanize(%j) = %j", (input, out) => {
    expect(humanize(input)).toBe(out);
  });

  it("guesses icon labels", async () => {
    const { document } = await parseHtml('<button id="a"><i class="fa fa-search"></i></button><button id="b"><svg><use href="#icon-close"></use></svg></button><button id="c"><span class="material-icons">delete</span></button><button id="d"><i class="nothing"></i></button>');
    expect(iconHint(document.getElementById("a")!)?.en).toBe("Search");
    expect(iconHint(document.getElementById("b")!)?.en).toBe("Close");
    expect(iconHint(document.getElementById("c")!)?.pt).toBe("Excluir");
    expect(iconHint(document.getElementById("d")!)).toBeNull();
  });

  it("guesses link labels from the destination", () => {
    expect(hrefHint("mailto:hi@example.com")?.en).toBe("Email hi@example.com");
    expect(hrefHint("tel:+5511999999999")?.pt).toBe("Ligar para +5511999999999");
    expect(hrefHint("https://github.com/kwy404")?.en).toBe("GitHub profile");
    expect(hrefHint("/")?.en).toBe("Home");
    expect(hrefHint("/pricing-plans")?.en).toBe("Pricing plans");
    expect(hrefHint(null)).toBeNull();
  });

  it("recognizes generic link text in English and Portuguese", () => {
    for (const s of ["Click here", "read more", "Read more >", "Saiba mais", "clique aqui!"]) expect(isGenericLinkText(s), s).toBe(true);
    for (const s of ["Read more about pricing", "Pricing"]) expect(isGenericLinkText(s), s).toBe(false);
  });

  it("validates and repairs language codes", () => {
    for (const v of ["en", "pt-BR", "zh-Hant-TW", "fil", "es-419"]) expect(isValidLang(v), v).toBe(true);
    for (const v of ["english", "e", "pt_BR", "xx", "en-"]) expect(isValidLang(v), v).toBe(false);
    expect(repairLang("pt_br")).toBe("pt-BR");
    expect(repairLang("English")).toBe("en");
    expect(repairLang("klingon")).toBeNull();
  });

  it("detects the language of a text", () => {
    const en = "The quick brown fox and the lazy dog are in the garden with you. This is not the end of the story, but you will see that they have fun.";
    const pt = "O cachorro e o gato são amigos, mas não para sempre. Você vai ver que a casa da família é para todos os que estão com uma vontade de brincar.";
    expect(detectLanguage(en)).toBe("en");
    expect(detectLanguage(pt)).toBe("pt");
    expect(detectLanguage("too short")).toBeNull();
  });

  it("slugs", () => {
    expect(slug("Endereço de e-mail")).toBe("endereco-de-e-mail");
    expect(slug("***")).toBe("field");
  });

  it("validates autocomplete tokens", () => {
    for (const v of ["email", "on", "off", "shipping postal-code", "section-a billing street-address", "work email", "current-password webauthn", ""]) expect(isValidAutocomplete(v), v).toBe(true);
    for (const v of ["e-mail", "home name", "email extra", "section-a", "billing"]) expect(isValidAutocomplete(v), v).toBe(false);
  });

  it("repairs viewport content", () => {
    expect(repairViewport("width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")).toBe("width=device-width, initial-scale=1");
    expect(repairViewport("width=device-width; maximum-scale=5")).toBe("width=device-width, maximum-scale=5");
  });

  it("ARIA helpers", () => {
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(suggestAriaAttribute("aria-labeledby")).toBe("aria-labelledby");
    expect(suggestAriaAttribute("aria-zzzzzzzz")).toBeNull();
    expect(suggestRole("buton")).toBe("button");
    expect(suggestRole("qqqqqqqq")).toBeNull();
    expect(isValidAriaValue("aria-checked", "mixed")).toBe(true);
    expect(isValidAriaValue("aria-expanded", "mixed")).toBe(false);
    expect(isValidAriaValue("aria-level", "2")).toBe(true);
    expect(isValidAriaValue("aria-level", "two")).toBe(false);
    expect(isValidAriaValue("aria-valuenow", "1.5")).toBe(true);
    expect(isValidAriaValue("aria-relevant", "additions text")).toBe(true);
    expect(isValidAriaValue("aria-nope", "x")).toBe(false);
  });

  it("tells fragments from documents", () => {
    expect(isFragment("<p>x</p>")).toBe(true);
    expect(isFragment("<!DOCTYPE html><p>x</p>")).toBe(false);
    expect(isFragment("<body><p>x</p></body>")).toBe(false);
  });
});
