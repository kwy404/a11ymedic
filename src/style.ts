import { parseColor, type RGBA, BLACK } from "./color";
import { isDynamicSelector, mediaMatches, parseDeclarations, splitTopLevel, specificity, type ParsedCss } from "./css";

/** Reads the styles accessibility rules care about, from a real browser or from parsed CSS. */
export interface StyleProvider {
  readonly kind: "computed" | "static";
  /** The cascaded (static) or computed (browser) value of a property, "" when unknown. */
  get(el: Element, prop: string): string;
  fontSize(el: Element): number;
  fontWeight(el: Element): number;
  color(el: Element): RGBA | null;
  backgroundColor(el: Element): RGBA | null;
  backgroundImage(el: Element): string;
  opacity(el: Element): number;
  display(el: Element): string;
  visibility(el: Element): string;
  /** The rendered box, or null when layout is not available (static analysis). */
  rect(el: Element): { x: number; y: number; width: number; height: number } | null;
}

const INHERITED = new Set([
  "color",
  "font-size",
  "font-weight",
  "font-style",
  "font-family",
  "visibility",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-align",
  "cursor",
  "direction",
  "white-space",
]);

const BLOCK_TAGS = new Set(
  "address article aside blockquote body center dd details dialog dir div dl dt fieldset figcaption figure footer form frameset h1 h2 h3 h4 h5 h6 header hgroup hr html legend li listing main menu nav ol optgroup option p plaintext pre search section summary ul xmp".split(
    " ",
  ),
);
const HIDDEN_TAGS = new Set("head script style template title meta link base noscript datalist area param source track".split(" "));

const KEYWORD_SIZES: Record<string, number> = {
  "xx-small": 9,
  "x-small": 10,
  small: 13,
  medium: 16,
  large: 18,
  "x-large": 24,
  "xx-large": 32,
  "xxx-large": 48,
};

const HEADING_SCALE: Record<string, number> = { h1: 2, h2: 1.5, h3: 1.17, h4: 1, h5: 0.83, h6: 0.67 };

function parseWeight(value: string, parent: number): number {
  const v = value.trim().toLowerCase();
  if (v === "normal") return 400;
  if (v === "bold") return 700;
  if (v === "bolder") return parent < 400 ? 400 : parent < 600 ? 700 : 900;
  if (v === "lighter") return parent < 600 ? 100 : parent < 800 ? 400 : 700;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : parent;
}

/**
 * Evaluates a CSS length to pixels. `em` is the font size used for em, percentages and ex/ch.
 * Supports calc(), min(), max() and clamp() with the usual units. Returns NaN when unknown.
 */
export function evalLength(input: string, em: number, rem = 16, percentBase = em): number {
  const src = input.trim().toLowerCase();
  let pos = 0;
  const peek = (): string => src[pos] ?? "";
  const skip = (): void => {
    while (/\s/.test(peek())) pos++;
  };
  const unit = (n: number, u: string): number => {
    switch (u) {
      case "":
      case "px":
        return n;
      case "em":
        return n * em;
      case "rem":
        return n * rem;
      case "ex":
      case "ch":
        return n * em * 0.5;
      case "%":
        return (n * percentBase) / 100;
      case "pt":
        return (n * 96) / 72;
      case "pc":
        return n * 16;
      case "in":
        return n * 96;
      case "cm":
        return (n * 96) / 2.54;
      case "mm":
        return (n * 96) / 25.4;
      case "q":
        return (n * 96) / 101.6;
      case "vw":
      case "vi":
        return n * 12.8;
      case "vh":
      case "vb":
        return n * 8;
      case "vmin":
        return n * 8;
      case "vmax":
        return n * 12.8;
      default:
        return NaN;
    }
  };
  const args = (): number[] => {
    const out: number[] = [];
    pos++; // (
    for (;;) {
      out.push(expr());
      skip();
      if (peek() === ",") {
        pos++;
        continue;
      }
      if (peek() === ")") pos++;
      return out;
    }
  };
  const primary = (): number => {
    skip();
    if (peek() === "(") {
      pos++;
      const v = expr();
      skip();
      if (peek() === ")") pos++;
      return v;
    }
    const fn = /^(calc|min|max|clamp)(?=\()/.exec(src.slice(pos));
    if (fn) {
      pos += fn[1]!.length;
      const values = args();
      if (fn[1] === "calc") return values[0] ?? NaN;
      if (fn[1] === "min") return Math.min(...values);
      if (fn[1] === "max") return Math.max(...values);
      const [lo, v, hi] = values as [number, number, number];
      return Math.max(lo, Math.min(v, hi));
    }
    const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)/.exec(src.slice(pos));
    if (!m) {
      pos = src.length;
      return NaN;
    }
    pos += m[0].length;
    return unit(parseFloat(m[1]!), m[2]!);
  };
  const term = (): number => {
    let v = primary();
    for (;;) {
      skip();
      const op = peek();
      if (op !== "*" && op !== "/") return v;
      pos++;
      const r = primary();
      v = op === "*" ? v * r : v / r;
    }
  };
  const expr = (): number => {
    let v = term();
    for (;;) {
      skip();
      const op = peek();
      if (op !== "+" && op !== "-") return v;
      pos++;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
  };
  const value = expr();
  skip();
  return pos >= src.length ? value : NaN;
}

const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/;

interface Entry {
  spec: number;
  order: number;
  important: boolean;
  property: string;
  value: string;
}

/** Splits `background` into a color and an image layer. */
function expandBackground(value: string): { color: string; image: string } {
  const layers = splitTopLevel(value, ",");
  const last = layers[layers.length - 1] ?? "";
  let color = "transparent";
  const images: string[] = [];
  for (const layer of layers) {
    const m = layer.match(/(?:url|[a-z-]*gradient|image-set|image)\((?:[^()]|\([^()]*\))*\)/gi);
    if (m) images.push(...m);
  }
  for (const token of splitTopLevel(last.trim(), " ")) {
    const t = token.trim();
    if (!t || /\(/.test(t) && /gradient|url|image/i.test(t)) continue;
    if (/^var\(/.test(t) || parseColor(t, BLACK)) color = t;
  }
  return { color, image: images.length ? images.join(", ") : "none" };
}

function expandFont(value: string): { size?: string; weight: string } {
  const v = value.trim();
  const m = /(?:^|\s)((?:[\d.]+(?:px|em|rem|%|pt|pc|vw|vh|ex|ch)|xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger|(?:calc|clamp|min|max|var)\((?:[^()]|\([^()]*\))*\)))(?:\s*\/\s*\S+)?\s/.exec(
    v + " ",
  );
  const before = m ? v.slice(0, m.index) : "";
  const w = /(?:^|\s)(bold|bolder|lighter|[1-9]00)(?=\s|$)/.exec(before);
  return m ? { size: m[1]!, weight: w ? w[1]! : "normal" } : { weight: "normal" };
}

function expandBox(value: string): [string, string, string, string] {
  const p = splitTopLevel(value.trim(), " ").filter(Boolean);
  const [t = "0", r = t, b = t, l = r] = p;
  return [t, r, b, l];
}

/** Cascades parsed stylesheets and inline styles without a layout engine. */
export class StaticStyles implements StyleProvider {
  readonly kind = "static" as const;
  private matched = new Map<Element, Entry[]>();
  private declaredCache = new Map<Element, Map<string, Entry>>();
  private valueCache = new Map<Element, Map<string, string>>();
  private sizeCache = new Map<Element, number>();
  private weightCache = new Map<Element, number>();

  constructor(
    private readonly doc: Document,
    css: ParsedCss,
  ) {
    for (const rule of css.rules) {
      if (!rule.media.every(mediaMatches)) continue;
      if (!rule.declarations.length) continue;
      for (const sel of splitTopLevel(rule.selector, ",")) {
        const selector = sel.trim();
        if (!selector || isDynamicSelector(selector)) continue;
        let nodes: ArrayLike<Element>;
        try {
          nodes = doc.querySelectorAll(selector);
        } catch {
          continue;
        }
        const [a, b, c] = specificity(selector);
        const spec = a * 1e6 + b * 1e3 + c;
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i]!;
          let list = this.matched.get(el);
          if (!list) this.matched.set(el, (list = []));
          for (const d of rule.declarations) list.push({ spec, order: rule.order, important: d.important, property: d.property, value: d.value });
        }
      }
    }
  }

  private declared(el: Element): Map<string, Entry> {
    let map = this.declaredCache.get(el);
    if (map) return map;
    map = new Map();
    const entries = [...(this.matched.get(el) ?? [])];
    const inline = el.getAttribute("style");
    if (inline) {
      for (const d of parseDeclarations(inline)) {
        entries.push({ spec: 1e9, order: Infinity, important: d.important, property: d.property, value: d.value });
      }
    }
    entries.sort((x, y) => Number(x.important) - Number(y.important) || x.spec - y.spec || x.order - y.order);
    const set = (e: Entry, property: string, value: string): void => {
      map!.set(property, { ...e, property, value });
    };
    for (const e of entries) {
      const p = e.property;
      if (p === "background") {
        const bg = expandBackground(e.value);
        set(e, "background-color", bg.color);
        set(e, "background-image", bg.image);
      } else if (p === "font") {
        const f = expandFont(e.value);
        if (f.size) set(e, "font-size", f.size);
        set(e, "font-weight", f.weight);
      } else if (p === "outline") {
        const tokens = e.value.toLowerCase().split(/\s+/);
        set(e, "outline", e.value);
        const style = tokens.find((t) => /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|auto)$/.test(t));
        set(e, "outline-style", style ?? (tokens.some((t) => t === "0" || t === "0px") ? "none" : "solid"));
        if (tokens.some((t) => t === "0" || t === "0px")) set(e, "outline-width", "0");
      } else if (p === "padding" || p === "margin" || p === "inset") {
        const [t, r, b, l] = expandBox(e.value);
        const prefix = p === "inset" ? "" : `${p}-`;
        set(e, `${prefix}top`, t);
        set(e, `${prefix}right`, r);
        set(e, `${prefix}bottom`, b);
        set(e, `${prefix}left`, l);
      } else if (p === "padding-inline" || p === "padding-block") {
        const [a, b = a] = splitTopLevel(e.value.trim(), " ").filter(Boolean);
        const [x, y] = p === "padding-inline" ? ["left", "right"] : ["top", "bottom"];
        set(e, `padding-${x}`, a ?? "0");
        set(e, `padding-${y}`, b ?? "0");
      } else {
        set(e, p, e.value);
      }
    }
    this.declaredCache.set(el, map);
    return map;
  }

  private custom(el: Element | null, name: string): string | undefined {
    for (let n = el; n; n = n.parentElement) {
      const v = this.declared(n).get(name);
      if (v) return v.value;
    }
    return undefined;
  }

  private substitute(el: Element, value: string, depth = 0): string {
    let v = value;
    for (let guard = 0; guard < 20 && VAR.test(v); guard++) {
      v = v.replace(VAR, (_, name: string, fallback: string | undefined) => {
        const found = depth < 10 ? this.custom(el, name) : undefined;
        if (found !== undefined) return this.substitute(el, found, depth + 1);
        return fallback !== undefined ? fallback.trim() : "";
      });
    }
    return v;
  }

  private uaDefault(el: Element, prop: string): string {
    const tag = el.localName;
    switch (prop) {
      case "display": {
        if (HIDDEN_TAGS.has(tag)) return "none";
        if (el.hasAttribute("hidden") && el.getAttribute("hidden") !== "until-found") return "none";
        if (tag === "input" && (el.getAttribute("type") ?? "").toLowerCase() === "hidden") return "none";
        if (tag === "dialog" && !el.hasAttribute("open")) return "none";
        const parent = el.parentElement;
        if (parent?.localName === "details" && !parent.hasAttribute("open") && tag !== "summary") return "none";
        if (tag === "li") return "list-item";
        if (tag === "table") return "table";
        if (tag === "tr") return "table-row";
        if (tag === "td" || tag === "th") return "table-cell";
        if (tag === "img" || tag === "button" || tag === "input" || tag === "select" || tag === "textarea") return "inline-block";
        return BLOCK_TAGS.has(tag) ? "block" : "inline";
      }
      case "color":
        if (tag === "a" && el.hasAttribute("href")) return "#0000ee";
        if (tag === "mark" || tag === "button" || tag === "input" || tag === "select" || tag === "textarea") return "#000000";
        return "";
      case "background-color": {
        if (tag === "mark") return "#ffff00";
        const type = (el.getAttribute("type") ?? "").toLowerCase();
        if (tag === "button" || (tag === "input" && ["button", "submit", "reset"].includes(type))) return "#efefef";
        if (tag === "input" || tag === "textarea" || tag === "select") return "#ffffff";
        return "transparent";
      }
      case "background-image":
        return "none";
      case "opacity":
        return "1";
      case "visibility":
        return "visible";
      case "outline-style":
        return "none";
      case "position":
        return "static";
      default:
        return "";
    }
  }

  get(el: Element, prop: string): string {
    let cache = this.valueCache.get(el);
    if (!cache) this.valueCache.set(el, (cache = new Map()));
    const hit = cache.get(prop);
    if (hit !== undefined) return hit;
    const entry = this.declared(el).get(prop);
    let value = entry ? this.substitute(el, entry.value).trim() : "";
    const keyword = value.toLowerCase();
    const parent = el.parentElement;
    if (keyword === "inherit" || ((keyword === "unset" || keyword === "revert") && INHERITED.has(prop))) {
      value = parent ? this.get(parent, prop) : this.uaDefault(el, prop);
    } else if (keyword === "initial" || keyword === "unset" || keyword === "revert") {
      value = prop === "display" ? "inline" : prop === "background-color" ? "transparent" : "";
    } else if (!value) {
      const ua = this.uaDefault(el, prop);
      value = ua || (INHERITED.has(prop) && parent ? this.get(parent, prop) : "");
    }
    cache.set(prop, value);
    return value;
  }

  fontSize(el: Element): number {
    const hit = this.sizeCache.get(el);
    if (hit !== undefined) return hit;
    const parent = el.parentElement;
    const base = parent ? this.fontSize(parent) : 16;
    const root = this.doc.documentElement && el !== this.doc.documentElement ? this.fontSize(this.doc.documentElement) : 16;
    const entry = this.declared(el).get("font-size");
    let size = base;
    const tag = el.localName;
    if (entry) {
      const v = this.substitute(el, entry.value).trim().toLowerCase();
      if (v in KEYWORD_SIZES) size = KEYWORD_SIZES[v]!;
      else if (v === "smaller") size = base / 1.2;
      else if (v === "larger") size = base * 1.2;
      else if (v === "inherit" || v === "unset" || v === "revert") size = base;
      else if (v === "initial") size = 16;
      else {
        const px = evalLength(v, base, el === this.doc.documentElement ? 16 : root);
        size = Number.isFinite(px) && px >= 0 ? px : base;
      }
    } else if (tag in HEADING_SCALE) size = base * HEADING_SCALE[tag]!;
    else if (tag === "small" || tag === "sub" || tag === "sup") size = base / 1.2;
    else if (tag === "big") size = base * 1.2;
    else if (tag === "code" || tag === "kbd" || tag === "samp" || tag === "pre" || tag === "tt") size = base * 0.8125;
    else if (tag === "button" || tag === "input" || tag === "select" || tag === "textarea") size = 13.333;
    this.sizeCache.set(el, size);
    return size;
  }

  fontWeight(el: Element): number {
    const hit = this.weightCache.get(el);
    if (hit !== undefined) return hit;
    const parent = el.parentElement;
    const base = parent ? this.fontWeight(parent) : 400;
    const entry = this.declared(el).get("font-weight");
    let weight = base;
    if (entry) weight = parseWeight(this.substitute(el, entry.value), base);
    else if (/^(h[1-6]|b|strong|th|optgroup)$/.test(el.localName)) weight = 700;
    this.weightCache.set(el, weight);
    return weight;
  }

  color(el: Element): RGBA | null {
    const v = this.get(el, "color");
    if (!v) return { ...BLACK };
    if (v.toLowerCase() === "currentcolor") return el.parentElement ? this.color(el.parentElement) : { ...BLACK };
    return parseColor(v, el.parentElement ? (this.color(el.parentElement) ?? BLACK) : BLACK);
  }

  backgroundColor(el: Element): RGBA | null {
    const v = this.get(el, "background-color") || "transparent";
    return parseColor(v, this.color(el) ?? BLACK);
  }

  backgroundImage(el: Element): string {
    return this.get(el, "background-image") || "none";
  }

  opacity(el: Element): number {
    const v = this.get(el, "opacity");
    if (!v) return 1;
    const n = v.trim().endsWith("%") ? parseFloat(v) / 100 : parseFloat(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
  }

  display(el: Element): string {
    return (this.get(el, "display") || "inline").toLowerCase();
  }

  visibility(el: Element): string {
    return (this.get(el, "visibility") || "visible").toLowerCase();
  }

  rect(): null {
    return null;
  }
}

/** Reads styles and boxes from a real browser through getComputedStyle. */
export class ComputedStyles implements StyleProvider {
  readonly kind = "computed" as const;
  private cache = new Map<Element, CSSStyleDeclaration>();

  constructor(private readonly win: Window) {}

  private cs(el: Element): CSSStyleDeclaration {
    let s = this.cache.get(el);
    if (!s) this.cache.set(el, (s = this.win.getComputedStyle(el)));
    return s;
  }

  get(el: Element, prop: string): string {
    return this.cs(el).getPropertyValue(prop).trim();
  }

  fontSize(el: Element): number {
    return parseFloat(this.get(el, "font-size")) || 16;
  }

  fontWeight(el: Element): number {
    return parseWeight(this.get(el, "font-weight") || "400", 400);
  }

  color(el: Element): RGBA | null {
    return parseColor(this.get(el, "color"));
  }

  backgroundColor(el: Element): RGBA | null {
    return parseColor(this.get(el, "background-color") || "transparent");
  }

  backgroundImage(el: Element): string {
    return this.get(el, "background-image") || "none";
  }

  opacity(el: Element): number {
    const n = parseFloat(this.get(el, "opacity"));
    return Number.isFinite(n) ? n : 1;
  }

  display(el: Element): string {
    return this.get(el, "display") || "inline";
  }

  visibility(el: Element): string {
    return this.get(el, "visibility") || "visible";
  }

  rect(el: Element): { x: number; y: number; width: number; height: number } | null {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }
}
