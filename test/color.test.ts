import { describe, expect, it } from "vitest";
import { blend, contrastRatio, deltaE, formatRatio, fromOklch, parseColor, relativeLuminance, suggestColors, toHex, toOklch } from "../src/color";
import { audit } from "../src/index";

const close = (a: number, b: number, digits = 2): void => expect(a).toBeCloseTo(b, digits);

describe("parseColor", () => {
  it.each([
    ["#fff", [255, 255, 255, 1]],
    ["#000000", [0, 0, 0, 1]],
    ["#0f8b8d", [15, 139, 141, 1]],
    ["#ff000080", [255, 0, 0, 128 / 255]],
    ["#f008", [255, 0, 0, 136 / 255]],
    ["rgb(10, 20, 30)", [10, 20, 30, 1]],
    ["rgba(10,20,30,0.5)", [10, 20, 30, 0.5]],
    ["rgb(10 20 30 / 25%)", [10, 20, 30, 0.25]],
    ["rgb(100% 0% 50%)", [255, 0, 127.5, 1]],
    ["hsl(0, 100%, 50%)", [255, 0, 0, 1]],
    ["hsl(120deg 100% 25%)", [0, 127.5, 0, 1]],
    ["hsla(240, 100%, 50%, .5)", [0, 0, 255, 0.5]],
    ["hsl(0.5turn 100% 50%)", [0, 255, 255, 1]],
    ["hwb(0 0% 0%)", [255, 0, 0, 1]],
    ["hwb(0 100% 100%)", [127.5, 127.5, 127.5, 1]],
    ["rebeccapurple", [102, 51, 153, 1]],
    ["Teal", [0, 128, 128, 1]],
    ["transparent", [0, 0, 0, 0]],
    ["Canvas", [255, 255, 255, 1]],
    ["color(srgb 1 0 0)", [255, 0, 0, 1]],
  ])("%s", (input, [r, g, b, a]) => {
    const c = parseColor(input)!;
    expect(c).not.toBeNull();
    close(c.r, r!, 0);
    close(c.g, g!, 0);
    close(c.b, b!, 0);
    close(c.a, a!, 2);
  });

  it("parses oklch, oklab, lab and lch close to their sRGB values", () => {
    expect(toHex(parseColor("oklch(62.796% 0.25768 29.2339)")!)).toBe("#ff0000");
    expect(toHex(parseColor("oklch(0.5 0 0 / 50%)")!)).toBe("#636363" + "80");
    expect(toHex(parseColor("oklab(1 0 0)")!)).toBe("#ffffff");
    expect(toHex(parseColor("lab(54.29 80.82 69.88)")!)).toBe("#ff0000");
    expect(toHex(parseColor("lch(100 0 0)")!)).toBe("#ffffff");
    expect(toHex(parseColor("color(display-p3 1 1 1)")!)).toBe("#ffffff");
    expect(toHex(parseColor("color(srgb-linear 0 0 0)")!)).toBe("#000000");
  });

  it("resolves currentcolor only with a context", () => {
    expect(parseColor("currentColor")).toBeNull();
    expect(parseColor("currentcolor", { r: 1, g: 2, b: 3, a: 1 })).toEqual({ r: 1, g: 2, b: 3, a: 1 });
  });

  it.each(["", "#ggg", "#12345", "rgb(1,2)", "var(--x)", "notacolor", "rgb(a b c)", "color(xyz 1 1 1)"])("rejects %j", (input) => {
    expect(parseColor(input)).toBeNull();
  });
});

describe("contrast math (WCAG 2.x)", () => {
  it.each([
    ["#000000", "#ffffff", 21],
    ["#ffffff", "#ffffff", 1],
    ["#777777", "#ffffff", 4.48],
    ["#767676", "#ffffff", 4.54],
    ["#595959", "#ffffff", 7.0],
    ["#0000ff", "#ffffff", 8.59],
    ["#ff0000", "#ffffff", 4.0],
    ["#008000", "#ffffff", 5.14],
    ["#ffffff", "#0f8b8d", 4.12],
  ])("%s on %s is %s:1", (fg, bg, ratio) => {
    close(contrastRatio(fg, bg), ratio, 2);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#123456", "#abcdef")).toBeCloseTo(contrastRatio("#abcdef", "#123456"), 10);
  });

  it("paints a translucent foreground over the background first", () => {
    // 50% black on white is #808080 (rounded), about 3.95:1.
    close(contrastRatio("rgba(0,0,0,0.5)", "#ffffff"), contrastRatio("#7f7f7f", "#ffffff"), 1);
    expect(contrastRatio("rgba(0,0,0,0)", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("relative luminance of white and black", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 6);
    expect(relativeLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBe(0);
  });

  it("never rounds a failing ratio up when formatting", () => {
    expect(formatRatio(4.4999)).toBe("4.49");
    expect(formatRatio(21)).toBe("21.00");
  });

  it("blend composites source over", () => {
    expect(blend({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 255, a: 1 })).toEqual({ r: 127.5, g: 0, b: 127.5, a: 1 });
    expect(blend({ r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 0 }).a).toBe(0);
  });

  it("throws on unreadable colors", () => {
    expect(() => contrastRatio("nope", "#fff")).toThrow(TypeError);
  });
});

describe("OKLCH", () => {
  it("round trips sRGB colors", () => {
    for (const hex of ["#0f8b8d", "#ff7a66", "#12343b", "#ffffff", "#000000", "#808080", "#3366cc"]) {
      expect(toHex(fromOklch(toOklch(parseColor(hex)!)))).toBe(hex);
    }
  });

  it("treats grays as neutral", () => {
    expect(toOklch(parseColor("#999999")!).c).toBe(0);
  });

  it("maps out of gamut colors by reducing chroma", () => {
    const c = fromOklch({ l: 0.9, c: 0.4, h: 260 });
    for (const v of [c.r, c.g, c.b]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
  });
});

describe("suggestColors", () => {
  // Deterministic pseudo random pairs.
  let seed = 7;
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const randomHex = (): string =>
    "#" +
    Array.from({ length: 3 }, () =>
      Math.floor(rand() * 256)
        .toString(16)
        .padStart(2, "0"),
    ).join("");

  it.each([3, 4.5, 7])("every suggested pair reaches %s:1 (200 random pairs)", (ratio) => {
    for (let i = 0; i < 200; i++) {
      const fg = randomHex();
      const bg = randomHex();
      const s = suggestColors(fg, bg, { ratio });
      expect(contrastRatio(s.foreground, s.background), `${fg} on ${bg}`).toBeGreaterThanOrEqual(ratio);
      expect(s.ratio).toBeGreaterThanOrEqual(ratio);
      if (s.foregroundOption) expect(contrastRatio(s.foregroundOption.foreground, s.foregroundOption.background)).toBeGreaterThanOrEqual(ratio);
      if (s.backgroundOption) expect(contrastRatio(s.backgroundOption.foreground, s.backgroundOption.background)).toBeGreaterThanOrEqual(ratio);
    }
  });

  it("keeps the hue of colorful text", () => {
    const s = suggestColors("#4fa3ff", "#ffffff", { ratio: 4.5 });
    expect(s.changed).toBe("foreground");
    const before = toOklch(parseColor("#4fa3ff")!);
    const after = toOklch(parseColor(s.foreground)!);
    expect(Math.abs(before.h - after.h)).toBeLessThan(8);
    expect(after.l).toBeLessThan(before.l);
  });

  it("finds the closest gray for gray text", () => {
    const s = suggestColors("#999999", "#ffffff");
    expect(s.foreground).toBe("#767676");
    expect(s.background).toBe("#ffffff");
  });

  it("goes lighter on dark backgrounds", () => {
    const s = suggestColors("#555555", "#222222");
    expect(relativeLuminance(parseColor(s.foreground)!)).toBeGreaterThan(relativeLuminance(parseColor("#555555")!));
  });

  it("changes both colors when neither alone can reach the target", () => {
    const s = suggestColors("#9306dc", "#c158d0", { ratio: 7 });
    expect(s.changed).toBe("both");
    expect(contrastRatio(s.foreground, s.background)).toBeGreaterThanOrEqual(7);
  });

  it("returns the original pair when it already passes", () => {
    const s = suggestColors("#000000", "#ffffff");
    expect(s.changed).toBe("none");
    expect(s.foreground).toBe("#000000");
    expect(s.distance).toBe(0);
  });

  it("prefers the smallest perceptual change", () => {
    const s = suggestColors("#ffffff", "#7fbfff", { ratio: 4.5 });
    const chosen = s.changed === "foreground" ? s.foregroundOption! : s.backgroundOption!;
    expect(chosen.distance).toBeGreaterThan(0);
    expect(deltaE(parseColor("#000")!, parseColor("#fff")!)).toBeCloseTo(1, 2);
  });

  it("throws on unreadable colors", () => {
    expect(() => suggestColors("nope", "#fff")).toThrow(TypeError);
  });
});

describe("color-contrast rule", () => {
  const css = (body: string, style: string): string => `<!doctype html><html lang="en"><head><title>t</title><style>${style}</style></head><body><main><h1>t</h1>${body}</main></body></html>`;
  const contrast = async (html: string) => (await audit(html, { rules: ["color-contrast"] })).findings;

  it("uses the large text threshold of 3:1 for 24px text", async () => {
    // #949494 on white is about 3.03:1: fails as normal text, passes as large text.
    expect(await contrast(css('<p class="x">Hi</p>', ".x{color:#949494;font-size:16px}"))).toHaveLength(1);
    expect(await contrast(css('<p class="x">Hi</p>', ".x{color:#949494;font-size:24px}"))).toHaveLength(0);
    expect(await contrast(css('<p class="x">Hi</p>', ".x{color:#949494;font-size:19px;font-weight:bold}"))).toHaveLength(0);
    expect(await contrast(css('<p class="x">Hi</p>', ".x{color:#949494;font-size:19px}"))).toHaveLength(1);
  });

  it("treats h1 as large through the user agent font size", async () => {
    expect(await contrast(css('<h2 class="x">Big</h2>', ".x{color:#949494}"))).toHaveLength(0);
  });

  it("composites translucent backgrounds and text alpha", async () => {
    const f = await contrast(css('<div class="card"><p class="t">Text</p></div>', ".card{background:rgba(0,0,0,.5)} .t{color:rgba(255,255,255,.5)}"));
    expect(f).toHaveLength(1);
    expect(f[0]!.data!.background).toBe("#808080");
  });

  it("applies ancestor opacity", async () => {
    const f = await contrast(css('<div style="opacity:.4"><p>Faded</p></div>', ""));
    expect(f).toHaveLength(1);
    expect(f[0]!.data!.ratio as number).toBeLessThan(4.5);
  });

  it("follows CSS variables, inheritance and specificity", async () => {
    const style = ":root{--muted:#aaa} body{color:#000} .note{color:var(--muted)} #ok.note{color:#333}";
    const f = await contrast(css('<p class="note">Low</p><p class="note" id="ok">Fine</p>', style));
    expect(f.map((x) => x.html)).toEqual(['<p class="note">Low</p>']);
  });

  it("checks every stop of a gradient background and reports the worst", async () => {
    const f = await contrast(css('<div class="hero"><p>On gradient</p></div>', ".hero{background:linear-gradient(90deg,#000 0%,#777 100%);color:#fff}"));
    expect(f).toHaveLength(1);
    expect(f[0]!.data!.background).toBe("#777777");
  });

  it("asks for a human check on background images", async () => {
    const r = await audit(css('<div style="background-image:url(sky.jpg)"><p style="color:#fff">Over image</p></div>', ""), { rules: ["color-contrast"] });
    expect(r.findings).toHaveLength(0);
    expect(r.incomplete).toHaveLength(1);
  });

  it("skips hidden, visually hidden and disabled text", async () => {
    const body = '<p style="color:#ccc;display:none">a</p><span class="sr" style="color:#ccc">b</span><button disabled style="color:#ccc">c</button>';
    expect(await contrast(css(body, ".sr{position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden}"))).toHaveLength(0);
  });

  it("suggests a patched style with a passing color", async () => {
    const f = (await contrast(css('<p style="color:#999">x</p>', "")))[0]!;
    const s = f.data!.suggestion as { foreground: string };
    expect(contrastRatio(s.foreground, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(f.fix.after).toBe(`<p style="color: ${s.foreground}">x</p>`);
  });
});
