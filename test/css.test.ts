import { describe, expect, it } from "vitest";
import { mediaMatches, parseCss, parseDeclarations, specificity, splitTopLevel, isDynamicSelector } from "../src/css";
import { StaticStyles, evalLength } from "../src/style";
import { parseHtml } from "../src/parse";
import { Dom, mergeStyle, snippet } from "../src/dom";

describe("CSS parser", () => {
  it("parses rules, media blocks, keyframes and comments", () => {
    const css = parseCss([
      `/* comment { not a rule } */
      a, b > c { color: red; background: url("x;y.png") !important }
      @media (max-width: 600px) { .m { color: blue } }
      @supports (display: grid) { .g { display: grid } }
      @keyframes slide { from { transform: translateX(0) } to { transform: translateX(10px); opacity: 1 } }
      @import url("other.css");
      .after { color: green }`,
    ]);
    expect(css.rules.map((r) => r.selector)).toEqual(["a, b > c", ".m", ".g", ".after"]);
    expect(css.rules[0]!.declarations).toEqual([
      { property: "color", value: "red", important: false },
      { property: "background", value: 'url("x;y.png")', important: true },
    ]);
    expect(css.rules[1]!.media).toEqual(["(max-width: 600px)"]);
    expect(css.keyframes[0]).toMatchObject({ name: "slide", properties: ["transform", "opacity"] });
    expect(css.mediaQueries).toEqual(["(max-width: 600px)"]);
  });

  it("supports CSS nesting", () => {
    const css = parseCss([".card { color: red; & .title { color: blue } .x & { color: green } @media (min-width: 1px) { color: black } }"]);
    expect(css.rules.map((r) => [r.selector, r.declarations.map((d) => d.value).join()])).toEqual([
      [".card", "red"],
      [".card .title", "blue"],
      [".x .card", "green"],
      [".card", "black"],
    ]);
  });

  it("survives stray braces and unterminated blocks", () => {
    const css = parseCss(["} .a { color: red } .b { color: blue"]);
    expect(css.rules.map((r) => r.selector)).toEqual([".a", ".b"]);
  });

  it("splits at the top level only", () => {
    expect(splitTopLevel("a, :is(b, c), d", ",").map((s) => s.trim())).toEqual(["a", ":is(b, c)", "d"]);
    expect(parseDeclarations("color: red; --x: a;b; ; bad")).toEqual([
      { property: "color", value: "red", important: false },
      { property: "--x", value: "a", important: false },
    ]);
  });

  it.each([
    ["a", [0, 0, 1]],
    ["#id", [1, 0, 0]],
    [".a.b", [0, 2, 0]],
    ["ul li a:hover", [0, 1, 3]],
    ["[type=text]", [0, 1, 0]],
    [":where(#a) p", [0, 0, 1]],
    [":is(#a, .b) p", [1, 0, 1]],
    [":not(.x) a::before", [0, 1, 2]],
    ["*", [0, 0, 0]],
  ])("specificity of %s", (sel, expected) => {
    expect(specificity(sel)).toEqual(expected);
  });

  it("detects interaction and pseudo element selectors", () => {
    expect(isDynamicSelector("a:hover")).toBe(true);
    expect(isDynamicSelector("p::before")).toBe(true);
    expect(isDynamicSelector("p.note")).toBe(false);
  });

  it.each([
    ["screen", true],
    ["print", false],
    ["(min-width: 600px)", true],
    ["(max-width: 600px)", false],
    ["screen and (min-width: 40em)", true],
    ["(prefers-color-scheme: dark)", false],
    ["(prefers-reduced-motion: reduce)", false],
    ["(prefers-reduced-motion: no-preference)", true],
    ["not print", true],
    ["print, (min-width: 1px)", true],
    ["(orientation: portrait)", false],
    ["(unknown-feature: 1)", false],
    ["(min-height: 600px) and (hover: hover)", true],
    ["(forced-colors: active)", false],
  ])("media %s matches a desktop screen: %s", (q, expected) => {
    expect(mediaMatches(q)).toBe(expected);
  });
});

describe("lengths", () => {
  it.each([
    ["16px", 16],
    ["12pt", 16],
    ["2em", 32],
    ["1.5rem", 24],
    ["150%", 24],
    ["1in", 96],
    ["2.54cm", 96],
    ["10vw", 128],
    ["calc(1rem + 4px)", 20],
    ["calc(2 * 10px)", 20],
    ["clamp(12px, 2vw, 40px)", 25.6],
    ["min(10px, 2em)", 10],
    ["max(10px, 2em)", 32],
    ["auto", NaN],
  ])("%s is %s px", (v, px) => {
    if (Number.isNaN(px)) expect(evalLength(v, 16)).toBeNaN();
    else expect(evalLength(v, 16)).toBeCloseTo(px, 3);
  });
});

describe("static cascade", () => {
  async function styles(html: string) {
    const { document } = await parseHtml(html);
    const sources = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "");
    return { document, s: new StaticStyles(document, parseCss(sources)) };
  }

  it("applies specificity, order, !important and inline styles", async () => {
    const { document, s } = await styles(`<style>
      p { color: red } .a { color: green } p { color: blue }
      #x { color: purple } .imp { color: orange !important }
    </style><p class="a" id="x">1</p><p class="a imp" style="color: black">2</p><p style="color: teal">3</p>`);
    const [p1, p2, p3] = Array.from(document.querySelectorAll("p"));
    expect(s.get(p1!, "color")).toBe("purple");
    expect(s.get(p2!, "color")).toBe("orange");
    expect(s.get(p3!, "color")).toBe("teal");
  });

  it("inherits color and font size, not backgrounds", async () => {
    const { document, s } = await styles(`<style>body { color: #123456; font-size: 20px; background: #eee } .big { font-size: 1.5em }</style><div><p class="big"><span>x</span></p></div>`);
    const span = document.querySelector("span")!;
    expect(s.get(span, "color")).toBe("#123456");
    expect(s.fontSize(span)).toBe(30);
    expect(s.backgroundColor(span)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(s.backgroundColor(document.body)).toEqual({ r: 238, g: 238, b: 238, a: 1 });
  });

  it("resolves custom properties with fallbacks and inherit keywords", async () => {
    const { document, s } = await styles(`<style>:root { --brand: #0f8b8d; --size: 18px } .a { color: var(--brand) } .b { color: var(--missing, red); font-size: var(--size) } .c { color: inherit }</style><p class="a"><span class="c">x</span></p><p class="b">y</p>`);
    expect(s.get(document.querySelector(".a")!, "color")).toBe("#0f8b8d");
    expect(s.get(document.querySelector(".c")!, "color")).toBe("#0f8b8d");
    expect(s.get(document.querySelector(".b")!, "color")).toBe("red");
    expect(s.fontSize(document.querySelector(".b")!)).toBe(18);
  });

  it("expands background, font, outline and padding shorthands", async () => {
    const { document, s } = await styles(`<style>.x { background: url(a.png) no-repeat #fff; font: bold 24px/1.2 sans-serif; outline: 0; padding: 4px 8px }</style><p class="x">x</p>`);
    const p = document.querySelector("p")!;
    expect(s.get(p, "background-color")).toBe("#fff");
    expect(s.backgroundImage(p)).toBe("url(a.png)");
    expect(s.fontSize(p)).toBe(24);
    expect(s.fontWeight(p)).toBe(700);
    expect(s.get(p, "outline-style")).toBe("none");
    expect(s.get(p, "padding-left")).toBe("8px");
    expect(s.get(p, "padding-top")).toBe("4px");
  });

  it("knows user agent defaults: headings, hidden elements, links", async () => {
    const { document, s } = await styles(`<h1>a</h1><h6>b</h6><small>c</small><a href="/">d</a><p hidden>e</p><strong>f</strong>`);
    expect(s.fontSize(document.querySelector("h1")!)).toBe(32);
    expect(s.fontSize(document.querySelector("h6")!)).toBeCloseTo(10.72, 2);
    expect(s.fontSize(document.querySelector("small")!)).toBeCloseTo(13.33, 2);
    expect(s.get(document.querySelector("a")!, "color")).toBe("#0000ee");
    expect(s.display(document.querySelector("p")!)).toBe("none");
    expect(s.fontWeight(document.querySelector("strong")!)).toBe(700);
    expect(s.display(document.querySelector("h1")!)).toBe("block");
    expect(s.display(document.querySelector("a")!)).toBe("inline");
  });

  it("ignores rules for other media and interaction states", async () => {
    const { document, s } = await styles(`<style>p { color: black } @media print { p { color: red } } p:hover { color: blue } @media (min-width: 600px) { p { color: green } }</style><p>x</p>`);
    expect(s.get(document.querySelector("p")!, "color")).toBe("green");
  });

  it("has no layout", async () => {
    const { s } = await styles("<p>x</p>");
    expect(s.rect()).toBeNull();
  });
});

describe("DOM helpers", () => {
  it("builds unique selectors", async () => {
    const { document } = await parseHtml('<main id="m"><p>a</p><p><span>b</span></p></main><div><i>c</i></div>');
    const parsed = parseCss([]);
    const dom = new Dom(document, new StaticStyles(document, parsed));
    expect(dom.selector(document.querySelector("span")!)).toBe("#m > p:nth-of-type(2) > span");
    expect(dom.selector(document.querySelector("i")!)).toBe("html > body > div > i");
  });

  it("shortens long snippets", async () => {
    const { document } = await parseHtml(`<p class="x">${"word ".repeat(200)}</p><img src="${"a".repeat(300)}.png">`);
    const p = snippet(document.querySelector("p")!);
    expect(p.length).toBeLessThan(140);
    expect(p).toMatch(/^<p class="x">word word .*\.\.\.<\/p>$/);
    expect(snippet(document.querySelector("img")!)).toContain("...");
  });

  it("merges inline styles", () => {
    expect(mergeStyle("color: red; margin: 0", { color: "#000" })).toBe("margin: 0; color: #000");
    expect(mergeStyle(null, { "min-width": "24px" })).toBe("min-width: 24px");
  });

  it("detects focusable and disabled elements", async () => {
    const { document } = await parseHtml(`<a id="a" href="/">x</a><a id="b">x</a><button id="c" disabled>x</button><fieldset disabled><legend><button id="d">x</button></legend><input id="e"></fieldset><div id="f" tabindex="-1"></div><div id="g" contenteditable></div><details><summary id="h">s</summary></details>`);
    const dom = new Dom(document, new StaticStyles(document, parseCss([])));
    const q = (id: string) => document.getElementById(id)!;
    expect(dom.isTabbable(q("a"))).toBe(true);
    expect(dom.isFocusable(q("b"))).toBe(false);
    expect(dom.isFocusable(q("c"))).toBe(false);
    expect(dom.isFocusable(q("d"))).toBe(true);
    expect(dom.isFocusable(q("e"))).toBe(false);
    expect(dom.isFocusable(q("f"))).toBe(true);
    expect(dom.isTabbable(q("f"))).toBe(false);
    expect(dom.isTabbable(q("g"))).toBe(true);
    expect(dom.isTabbable(q("h"))).toBe(true);
  });
});
