import { namedColor } from "./named-colors";

/** An sRGB color. Channels are 0 to 255 (may be fractional), alpha is 0 to 1. */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A color in the OKLCH space: lightness 0 to 1, chroma 0 to about 0.4, hue in degrees. */
export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

export const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };
export const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
export const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };

const SYSTEM: Record<string, RGBA> = {
  canvas: WHITE,
  canvastext: BLACK,
  buttonface: { r: 239, g: 239, b: 239, a: 1 },
  buttontext: BLACK,
  field: WHITE,
  fieldtext: BLACK,
  linktext: { r: 0, g: 0, b: 238, a: 1 },
  visitedtext: { r: 85, g: 26, b: 139, a: 1 },
  graytext: { r: 109, g: 109, b: 109, a: 1 },
  highlight: { r: 0, g: 120, b: 215, a: 1 },
  highlighttext: WHITE,
  mark: { r: 255, g: 255, b: 0, a: 1 },
  marktext: BLACK,
};

/** Splits the inside of a color function into numeric arguments and an optional alpha. */
function splitArgs(body: string): { parts: string[]; alpha?: string } | null {
  const trimmed = body.trim();
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    if (parts.length === 4) return { parts: parts.slice(0, 3), alpha: parts[3]! };
    if (parts.length === 3) return { parts };
    return null;
  }
  const [main, alpha] = trimmed.split("/").map((p) => p.trim());
  const parts = (main ?? "").split(/\s+/).filter(Boolean);
  if (parts.length !== 3) return null;
  return alpha === undefined ? { parts } : { parts, alpha };
}

function num(token: string, percentScale: number): number {
  if (token === "none") return 0;
  if (token.endsWith("%")) return (parseFloat(token) / 100) * percentScale;
  return parseFloat(token);
}

function hue(token: string): number {
  if (token === "none") return 0;
  const n = parseFloat(token);
  if (token.endsWith("turn")) return n * 360;
  if (token.endsWith("grad")) return n * 0.9;
  if (token.endsWith("rad")) return (n * 180) / Math.PI;
  return n;
}

function alphaOf(token: string | undefined): number {
  if (token === undefined) return 1;
  return clamp(num(token, 1), 0, 1);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function hwbToRgb(h: number, w: number, bl: number): [number, number, number] {
  if (w + bl >= 1) {
    const gray = (w / (w + bl)) * 255;
    return [gray, gray, gray];
  }
  const [r, g, b] = hslToRgb(h, 1, 0.5);
  const scale = 1 - w - bl;
  return [r * scale + w * 255, g * scale + w * 255, b * scale + w * 255];
}

// sRGB transfer functions.
const toLinear = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const fromLinear = (v: number): number => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return c * 255;
};

function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

// CIE Lab (D50) to linear sRGB, through XYZ with Bradford adaptation to D65.
function labToLinear(L: number, a: number, b: number): [number, number, number] {
  const k = 24389 / 27;
  const e = 216 / 24389;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const x = (fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k) * 0.3457 / 0.3585;
  const y = L > k * e ? fy ** 3 : L / k;
  const z = (fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k) * (1 - 0.3457 - 0.3585) / 0.3585;
  const X = 0.9554734527042182 * x - 0.023098536874261423 * y + 0.0632593086610217 * z;
  const Y = -0.028369706963208136 * x + 1.0099954580058226 * y + 0.021041398966943008 * z;
  const Z = 0.012314001688319899 * x - 0.020507696433477912 * y + 1.3303659366080753 * z;
  return [
    3.2409699419045226 * X - 1.537383177570094 * Y - 0.4986107602930034 * Z,
    -0.9692436362808796 * X + 1.8759675015077202 * Y + 0.04155505740717559 * Z,
    0.05563007969699366 * X - 0.20397695888897652 * Y + 1.0569715142428786 * Z,
  ];
}

function p3ToLinearSrgb(r: number, g: number, b: number): [number, number, number] {
  const lin = (v: number): number => toLinear(v * 255);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  return [
    1.2249401 * R - 0.2249404 * G + 0 * B,
    -0.0420569 * R + 1.0420571 * G + 0 * B,
    -0.0196376 * R - 0.0786361 * G + 1.0982735 * B,
  ];
}

function fromLinearTriplet([r, g, b]: [number, number, number], a: number): RGBA {
  return {
    r: clamp(fromLinear(r), 0, 255),
    g: clamp(fromLinear(g), 0, 255),
    b: clamp(fromLinear(b), 0, 255),
    a,
  };
}

/**
 * Parses a CSS color: hex, named colors, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(),
 * color(srgb | srgb-linear | display-p3), transparent and common system colors.
 * Returns null for values it cannot resolve (for example currentcolor without a context or var()).
 */
export function parseColor(input: string, currentColor?: RGBA): RGBA | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;
  if (value === "transparent") return { ...TRANSPARENT };
  if (value === "currentcolor") return currentColor ? { ...currentColor } : null;
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    if (hex.length === 3 || hex.length === 4) {
      const [r, g, b, a] = [...hex].map((ch) => parseInt(ch + ch, 16));
      return { r: r!, g: g!, b: b!, a: a === undefined ? 1 : a / 255 };
    }
    if (hex.length === 6 || hex.length === 8) {
      const n = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
      return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
    }
    return null;
  }
  const named = namedColor(value);
  if (named !== undefined) return { r: (named >> 16) & 255, g: (named >> 8) & 255, b: named & 255, a: 1 };
  const system = SYSTEM[value];
  if (system) return { ...system };

  const fn = /^([a-z-]+)\((.*)\)$/s.exec(value);
  if (!fn) return null;
  const [, name, body] = fn as unknown as [string, string, string];
  if (name === "color") {
    const m = /^\s*([a-z0-9-]+)\s+(.*)$/s.exec(body);
    if (!m) return null;
    const args = splitArgs(m[2]!);
    if (!args) return null;
    const [x, y, z] = args.parts.map((p) => num(p, 1)) as [number, number, number];
    const a = alphaOf(args.alpha);
    if (m[1] === "srgb") return { r: clamp(x * 255, 0, 255), g: clamp(y * 255, 0, 255), b: clamp(z * 255, 0, 255), a };
    if (m[1] === "srgb-linear") return fromLinearTriplet([x, y, z], a);
    if (m[1] === "display-p3") return fromLinearTriplet(p3ToLinearSrgb(x, y, z), a);
    return null;
  }
  const args = splitArgs(body);
  if (!args) return null;
  const [p0, p1, p2] = args.parts as [string, string, string];
  const a = alphaOf(args.alpha);
  if ([p0, p1, p2].some((p) => p !== "none" && Number.isNaN(parseFloat(p)))) return null;
  switch (name) {
    case "rgb":
    case "rgba":
      return { r: clamp(num(p0, 255), 0, 255), g: clamp(num(p1, 255), 0, 255), b: clamp(num(p2, 255), 0, 255), a };
    case "hsl":
    case "hsla": {
      const [r, g, b] = hslToRgb(hue(p0), num(p1, 100) / 100, num(p2, 100) / 100);
      return { r, g, b, a };
    }
    case "hwb": {
      const [r, g, b] = hwbToRgb(hue(p0), num(p1, 100) / 100, num(p2, 100) / 100);
      return { r, g, b, a };
    }
    case "oklab":
      return fromLinearTriplet(oklabToLinear(num(p0, 1), num(p1, 0.4), num(p2, 0.4)), a);
    case "oklch": {
      const h = (hue(p2) * Math.PI) / 180;
      const c = num(p1, 0.4);
      return fromLinearTriplet(oklabToLinear(num(p0, 1), c * Math.cos(h), c * Math.sin(h)), a);
    }
    case "lab":
      return fromLinearTriplet(labToLinear(num(p0, 100), num(p1, 125), num(p2, 125)), a);
    case "lch": {
      const h = (hue(p2) * Math.PI) / 180;
      const c = num(p1, 150);
      return fromLinearTriplet(labToLinear(num(p0, 100), c * Math.cos(h), c * Math.sin(h)), a);
    }
    default:
      return null;
  }
}

/** Formats a color as #rrggbb, or #rrggbbaa when it is not opaque. */
export function toHex(c: RGBA): string {
  const h = (n: number): string => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  const base = `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  return c.a >= 1 ? base : base + h(c.a * 255);
}

/** Paints `top` over `bottom` with source-over alpha compositing. */
export function blend(top: RGBA, bottom: RGBA): RGBA {
  const a = top.a + bottom.a * (1 - top.a);
  if (a === 0) return { ...TRANSPARENT };
  const mix = (t: number, b: number): number => (t * top.a + b * bottom.a * (1 - top.a)) / a;
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
}

/** WCAG 2.x relative luminance of an opaque color. */
export function relativeLuminance(c: RGBA): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

/**
 * WCAG contrast ratio between two colors, from 1 to 21. A translucent foreground is painted
 * over the background first; a translucent background is painted over white.
 */
export function contrastRatio(foreground: RGBA | string, background: RGBA | string): number {
  const bgParsed = typeof background === "string" ? parseColor(background) : background;
  const fgParsed = typeof foreground === "string" ? parseColor(foreground) : foreground;
  if (!bgParsed || !fgParsed) throw new TypeError("contrastRatio: could not parse color");
  const bg = bgParsed.a < 1 ? blend(bgParsed, WHITE) : bgParsed;
  const fg = fgParsed.a < 1 ? blend(fgParsed, bg) : fgParsed;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Truncates a ratio to two decimals for display, never rounding a failing value up to a pass. */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

export function toOklch(c: RGBA): OKLCH {
  const [L, a, b] = linearToOklab(toLinear(c.r), toLinear(c.g), toLinear(c.b));
  const chroma = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  // Grays carry rounding noise in a and b: treat near zero chroma as exactly neutral.
  return chroma < 0.002 ? { l: L, c: 0, h: 0 } : { l: L, c: chroma, h };
}

function oklchToLinear({ l, c, h }: OKLCH): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear(l, c * Math.cos(rad), c * Math.sin(rad));
}

const inGamut = (rgb: [number, number, number]): boolean => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** Converts OKLCH to sRGB, reducing chroma (keeping lightness and hue) until it fits the sRGB gamut. */
export function fromOklch(color: OKLCH, alpha = 1): RGBA {
  const l = clamp(color.l, 0, 1);
  let rgb = oklchToLinear({ ...color, l });
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = color.c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToLinear({ l, c: lo, h: color.h });
  }
  return fromLinearTriplet(rgb, alpha);
}

/** Perceptual distance between two colors (Euclidean distance in OKLab). */
export function deltaE(x: RGBA, y: RGBA): number {
  const [l1, a1, b1] = linearToOklab(toLinear(x.r), toLinear(x.g), toLinear(x.b));
  const [l2, a2, b2] = linearToOklab(toLinear(y.r), toLinear(y.g), toLinear(y.b));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const roundRgb = (c: RGBA): RGBA => ({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b), a: 1 });

/**
 * Finds the color closest to `moving` (same OKLCH hue and chroma where the gamut allows,
 * only the lightness changes) whose contrast against `fixed` reaches `target`.
 * Returns null when no lightness can reach the target.
 */
function closestPassing(moving: RGBA, fixed: RGBA, target: number): RGBA | null {
  const start = toOklch(moving);
  const passes = (c: RGBA): boolean => contrastRatio(c, fixed) >= target;
  let best: RGBA | null = null;
  let bestDistance = Infinity;
  for (const end of [0, 1]) {
    const endpoint = roundRgb(fromOklch({ ...start, l: end }));
    if (!passes(endpoint)) continue;
    let lo = start.l;
    let hi = end;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (passes(roundRgb(fromOklch({ ...start, l: mid })))) hi = mid;
      else lo = mid;
    }
    let candidate = roundRgb(fromOklch({ ...start, l: hi }));
    // Hex rounding can land a hair under the target: keep nudging toward the endpoint.
    let l = hi;
    while (!passes(candidate) && Math.abs(l - end) > 1e-6) {
      l += end > l ? 0.002 : -0.002;
      l = end > start.l ? Math.min(l, 1) : Math.max(l, 0);
      candidate = roundRgb(fromOklch({ ...start, l }));
    }
    if (!passes(candidate)) candidate = endpoint;
    const distance = deltaE(candidate, moving);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export interface ColorOption {
  foreground: string;
  background: string;
  ratio: number;
  /** Perceptual distance (OKLab) from the original color that changed. */
  distance: number;
}

export interface ColorSuggestion extends ColorOption {
  /** Which color the recommended option changes ("both" when neither alone can reach the target). */
  changed: "foreground" | "background" | "both" | "none";
  /** The best option that changes only the text color, if one exists. */
  foregroundOption: ColorOption | null;
  /** The best option that changes only the background color, if one exists. */
  backgroundOption: ColorOption | null;
}

/**
 * Suggests the accessible color pair closest to the original: it walks the OKLCH lightness
 * of the text color (and, separately, of the background) keeping the hue, and returns the
 * smallest perceptual change that reaches `ratio` (4.5 by default, 3 for large text, 7 for AAA).
 * Changing the text color is preferred unless changing the background is clearly smaller.
 */
export function suggestColors(
  foreground: RGBA | string,
  background: RGBA | string,
  options: { ratio?: number } = {},
): ColorSuggestion {
  const target = options.ratio ?? 4.5;
  const bgParsed = typeof background === "string" ? parseColor(background) : background;
  const fgParsed = typeof foreground === "string" ? parseColor(foreground) : foreground;
  if (!bgParsed || !fgParsed) throw new TypeError("suggestColors: could not parse color");
  const bg = roundRgb(bgParsed.a < 1 ? blend(bgParsed, WHITE) : bgParsed);
  const fg = roundRgb(fgParsed.a < 1 ? blend(fgParsed, bg) : fgParsed);
  const current = contrastRatio(fg, bg);
  if (current >= target) {
    const option = { foreground: toHex(fg), background: toHex(bg), ratio: current, distance: 0 };
    return { ...option, changed: "none", foregroundOption: option, backgroundOption: option };
  }
  const newFg = closestPassing(fg, bg, target);
  const newBg = closestPassing(bg, fg, target);
  const fgOption: ColorOption | null = newFg
    ? { foreground: toHex(newFg), background: toHex(bg), ratio: contrastRatio(newFg, bg), distance: deltaE(newFg, fg) }
    : null;
  const bgOption: ColorOption | null = newBg
    ? { foreground: toHex(fg), background: toHex(newBg), ratio: contrastRatio(fg, newBg), distance: deltaE(newBg, bg) }
    : null;
  let pick: "foreground" | "background";
  if (fgOption && bgOption) pick = bgOption.distance < fgOption.distance * 0.6 ? "background" : "foreground";
  else if (fgOption) pick = "foreground";
  else if (bgOption) pick = "background";
  else {
    // Neither color alone can reach the target (for example 7:1 on a mid tone): push the text to
    // black or white, whichever is closer to working, then move the background the other way.
    const black = contrastRatio(BLACK, bg);
    const white = contrastRatio(WHITE, bg);
    const extreme = black >= white ? BLACK : WHITE;
    const background = closestPassing(bg, extreme, target) ?? (extreme === BLACK ? WHITE : BLACK);
    const option = {
      foreground: toHex(extreme),
      background: toHex(background),
      ratio: contrastRatio(extreme, background),
      distance: deltaE(extreme, fg) + deltaE(background, bg),
    };
    return { ...option, changed: "both", foregroundOption: null, backgroundOption: null };
  }
  const chosen = (pick === "foreground" ? fgOption : bgOption)!;
  return { ...chosen, changed: pick, foregroundOption: fgOption, backgroundOption: bgOption };
}
