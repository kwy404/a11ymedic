/** A small, forgiving CSS parser: enough to cascade the properties accessibility rules need. */

export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

export interface StyleRule {
  selector: string;
  declarations: Declaration[];
  /** The media conditions of enclosing @media blocks, outermost first. */
  media: string[];
  /** Source order across all sheets. */
  order: number;
  /** Index of the stylesheet this rule came from. */
  sheet: number;
  /** Offset of the selector inside the stylesheet text. */
  offset: number;
  /** The original rule text, for reports. */
  text: string;
}

export interface Keyframes {
  name: string;
  /** Properties animated by any keyframe. */
  properties: string[];
  media: string[];
  sheet: number;
  offset: number;
}

export interface ParsedCss {
  rules: StyleRule[];
  keyframes: Keyframes[];
  /** Conditions of every @media block seen, for example "(prefers-reduced-motion: reduce)". */
  mediaQueries: string[];
}

export function stripComments(css: string): string {
  // Replace comments with spaces of the same length so offsets stay valid.
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

/** Splits on a separator at nesting depth 0, ignoring separators inside strings, () and []. */
export function splitTopLevel(text: string, separator: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    else if (ch === separator && depth === 0) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
}

export function parseDeclarations(block: string): Declaration[] {
  const out: Declaration[] = [];
  for (const raw of splitTopLevel(block, ";")) {
    const colon = raw.indexOf(":");
    if (colon < 0) continue;
    const property = raw.slice(0, colon).trim();
    let value = raw.slice(colon + 1).trim();
    if (!property || !value) continue;
    let important = false;
    const imp = /!\s*important\s*$/i.exec(value);
    if (imp) {
      important = true;
      value = value.slice(0, imp.index).trim();
    }
    out.push({ property: property.startsWith("--") ? property : property.toLowerCase(), value, important });
  }
  return out;
}

/** Finds the index of the brace that closes the block opened at `open`. */
function matchBrace(css: string, open: number): number {
  let depth = 0;
  let quote = "";
  for (let i = open; i < css.length; i++) {
    const ch = css[i]!;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return css.length;
}

/** Finds the next `{` or `;` at depth 0 starting at `from`, skipping strings and parentheses. */
function nextStop(css: string, from: number): number {
  let depth = 0;
  let quote = "";
  for (let i = from; i < css.length; i++) {
    const ch = css[i]!;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if ((ch === "{" || ch === ";" || ch === "}") && depth === 0) return i;
  }
  return css.length;
}

export function parseCss(sources: string[]): ParsedCss {
  const result: ParsedCss = { rules: [], keyframes: [], mediaQueries: [] };
  let order = 0;
  sources.forEach((source, sheet) => {
    const css = stripComments(source);
    const walk = (start: number, end: number, media: string[], parentSelector: string | null): void => {
      let i = start;
      while (i < end) {
        while (i < end && /\s/.test(css[i]!)) i++;
        if (i >= end) break;
        const stop = nextStop(css, i);
        if (stop >= end || css[stop] === "}") {
          // Trailing declarations in a nested block, or junk: skip to the end.
          if (parentSelector && stop > i) {
            const decls = parseDeclarations(css.slice(i, Math.min(stop, end)));
            if (decls.length) {
              result.rules.push({ selector: parentSelector, declarations: decls, media, order: order++, sheet, offset: i, text: css.slice(i, stop).trim() });
            }
          }
          if (stop < end) {
            i = stop + 1;
            continue;
          }
          break;
        }
        const prelude = css.slice(i, stop).trim();
        if (css[stop] === ";") {
          // A statement at-rule (@import, @charset) or a declaration inside a nested block.
          if (parentSelector && !prelude.startsWith("@")) {
            const decls = parseDeclarations(prelude);
            if (decls.length) {
              result.rules.push({ selector: parentSelector, declarations: decls, media, order: order++, sheet, offset: i, text: prelude });
            }
          }
          i = stop + 1;
          continue;
        }
        const close = matchBrace(css, stop);
        const inner = css.slice(stop + 1, close);
        if (prelude.startsWith("@")) {
          const at = /^@([a-z-]+)\s*([\s\S]*)$/i.exec(prelude);
          const name = (at?.[1] ?? "").toLowerCase();
          const condition = (at?.[2] ?? "").trim();
          if (name === "media") {
            result.mediaQueries.push(condition);
            walk(stop + 1, close, [...media, condition], parentSelector);
          } else if (name === "supports" || name === "layer" || name === "container" || name === "scope" || name === "document") {
            walk(stop + 1, close, media, parentSelector);
          } else if (name.endsWith("keyframes")) {
            const props = new Set<string>();
            for (const m of inner.matchAll(/\{([^{}]*)\}/g)) {
              for (const d of parseDeclarations(m[1]!)) props.add(d.property);
            }
            result.keyframes.push({ name: condition.replace(/["']/g, ""), properties: [...props], media, sheet, offset: i });
          }
        } else {
          // Separate declarations from nested rules (CSS nesting) in the block.
          const selector = parentSelector ? resolveNested(prelude, parentSelector) : prelude;
          const ownDecls: string[] = [];
          let j = stop + 1;
          let nested = false;
          while (j < close) {
            const s = nextStop(css, j);
            if (s >= close) {
              ownDecls.push(css.slice(j, close));
              break;
            }
            if (css[s] === ";") {
              ownDecls.push(css.slice(j, s));
              j = s + 1;
            } else if (css[s] === "{") {
              nested = true;
              const c = matchBrace(css, s);
              j = c + 1;
            } else {
              j = s + 1;
            }
          }
          const declarations = parseDeclarations(ownDecls.join(";"));
          result.rules.push({
            selector,
            declarations,
            media,
            order: order++,
            sheet,
            offset: i,
            text: css.slice(i, close + 1).replace(/\s+/g, " ").trim(),
          });
          if (nested) {
            // Walk nested rules only (declarations already collected).
            let k = stop + 1;
            while (k < close) {
              const s = nextStop(css, k);
              if (s >= close) break;
              if (css[s] === "{") {
                const c = matchBrace(css, s);
                const nestedPrelude = css.slice(k, s).trim();
                if (nestedPrelude.startsWith("@")) {
                  const at = /^@([a-z-]+)\s*([\s\S]*)$/i.exec(nestedPrelude);
                  const cond = (at?.[2] ?? "").trim();
                  if ((at?.[1] ?? "").toLowerCase() === "media") {
                    result.mediaQueries.push(cond);
                    walk(s + 1, c, [...media, cond], selector);
                  } else walk(s + 1, c, media, selector);
                } else {
                  walk(k, c + 1, media, selector);
                }
                k = c + 1;
              } else k = s + 1;
            }
          }
        }
        i = close + 1;
      }
    };
    walk(0, css.length, [], null);
  });
  return result;
}

function resolveNested(prelude: string, parent: string): string {
  const parents = splitTopLevel(parent, ",").map((p) => p.trim());
  const parts = splitTopLevel(prelude, ",").map((p) => p.trim());
  const out: string[] = [];
  for (const part of parts) {
    for (const p of parents) {
      out.push(part.includes("&") ? part.replace(/&/g, p) : `${p} ${part}`);
    }
  }
  return out.join(", ");
}

/** Specificity of a single complex selector as [ids, classes, types]. */
export function specificity(selector: string): [number, number, number] {
  let ids = 0;
  let classes = 0;
  let types = 0;
  let s = selector;
  // :where() adds nothing; :is(), :not(), :has() add their most specific argument.
  s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, " ");
  s = s.replace(/:(is|not|has|matches)\(((?:[^()]|\([^()]*\))*)\)/g, (_, _n, inner: string) => {
    const best = splitTopLevel(inner, ",")
      .map((x) => specificity(x))
      .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0];
    if (best) {
      ids += best[0];
      classes += best[1];
      types += best[2];
    }
    return " ";
  });
  s = s.replace(/\[[^\]]*\]/g, () => {
    classes++;
    return " ";
  });
  s = s.replace(/::?(before|after|first-line|first-letter)\b/g, () => {
    types++;
    return " ";
  });
  s = s.replace(/::[a-z-]+(\([^)]*\))?/g, () => {
    types++;
    return " ";
  });
  s = s.replace(/#[\w-]+/g, () => {
    ids++;
    return " ";
  });
  s = s.replace(/\.[\w-]+/g, () => {
    classes++;
    return " ";
  });
  s = s.replace(/:[\w-]+(\([^)]*\))?/g, () => {
    classes++;
    return " ";
  });
  for (const token of s.split(/[\s>+~]+/)) {
    if (/^[a-z][\w-]*$/i.test(token)) types++;
  }
  return [ids, classes, types];
}

const DYNAMIC = /:(hover|focus|focus-visible|focus-within|active|visited|target|checked)\b|::?(before|after|placeholder|selection|marker|backdrop|first-line|first-letter|file-selector-button)\b/;

/** True when the selector depends on user interaction or targets a pseudo-element. */
export function isDynamicSelector(selector: string): boolean {
  return DYNAMIC.test(selector);
}

/**
 * Evaluates a media query list for a typical desktop screen (1280x800, light scheme, no motion
 * preference). Unknown features count as not matching, so their rules are ignored.
 */
export function mediaMatches(query: string): boolean {
  return splitTopLevel(query, ",").some((q) => {
    let text = q.trim().toLowerCase();
    let negate = false;
    if (text.startsWith("not ")) {
      negate = true;
      text = text.slice(4);
    }
    text = text.replace(/^only\s+/, "");
    let ok = true;
    for (const part of text.split(/\s+and\s+/)) {
      const p = part.trim();
      if (!p) continue;
      if (p === "all" || p === "screen") continue;
      if (p === "print" || p === "speech") {
        ok = false;
        continue;
      }
      const f = /^\(\s*([a-z-]+)\s*(?::\s*([^)]+))?\)$/.exec(p);
      if (!f) {
        ok = false;
        continue;
      }
      const [, feature, raw] = f as unknown as [string, string, string | undefined];
      const value = (raw ?? "").trim();
      const px = (v: string): number => (v.endsWith("em") ? parseFloat(v) * 16 : parseFloat(v));
      switch (feature) {
        case "min-width":
          ok &&= 1280 >= px(value);
          break;
        case "max-width":
          ok &&= 1280 <= px(value);
          break;
        case "min-height":
          ok &&= 800 >= px(value);
          break;
        case "max-height":
          ok &&= 800 <= px(value);
          break;
        case "prefers-color-scheme":
          ok &&= value === "light";
          break;
        case "prefers-reduced-motion":
          ok &&= value === "no-preference" || value === "";
          break;
        case "orientation":
          ok &&= value === "landscape";
          break;
        case "hover":
        case "any-hover":
          ok &&= value === "hover" || value === "";
          break;
        case "pointer":
        case "any-pointer":
          ok &&= value === "fine" || value === "";
          break;
        case "color":
          break;
        case "forced-colors":
        case "prefers-contrast":
        case "inverted-colors":
          ok &&= value === "none" || value === "no-preference";
          break;
        default:
          ok = false;
      }
    }
    return negate ? !ok : ok;
  });
}
