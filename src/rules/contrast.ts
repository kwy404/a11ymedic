import { blend, contrastRatio, formatRatio, parseColor, suggestColors, toHex, WHITE, type RGBA } from "../color";
import { splitTopLevel } from "../css";
import { clean, mergeStyle } from "../dom";
import { t, type RuleContext, type Rule } from "../engine";
import type { Text } from "../types";

interface Measure {
  ratio: number;
  foreground: RGBA;
  background: RGBA;
  large: boolean;
  fontSize: number;
  fontWeight: number;
  gradient: boolean;
}

type Premul = [number, number, number, number];
const pre = (c: RGBA): Premul => [c.r * c.a, c.g * c.a, c.b * c.a, c.a];
const over = (top: Premul, bottom: Premul): Premul => {
  const k = 1 - top[3];
  return [top[0] + bottom[0] * k, top[1] + bottom[1] * k, top[2] + bottom[2] * k, top[3] + bottom[3] * k];
};
const unpre = (p: Premul): RGBA => (p[3] === 0 ? { r: 0, g: 0, b: 0, a: 0 } : { r: p[0] / p[3], g: p[1] / p[3], b: p[2] / p[3], a: p[3] });

/** Colors of a CSS gradient's stops, or null when it is not a gradient we can read. */
function gradientStops(value: string, current: RGBA): RGBA[] | null {
  const m = /^(?:repeating-)?(?:linear|radial|conic)-gradient\(([\s\S]*)\)$/i.exec(value.trim());
  if (!m) return null;
  const stops: RGBA[] = [];
  for (const part of splitTopLevel(m[1]!, ",")) {
    const tokens = splitTopLevel(part.trim(), " ").filter(Boolean);
    for (const tok of tokens) {
      const c = parseColor(tok, current);
      if (c) stops.push(c);
    }
  }
  return stops.length ? stops : null;
}

/** Direct, visible text of an element (not the text of its children). */
function ownText(el: Element): string {
  let s = "";
  for (const n of Array.from(el.childNodes)) if (n.nodeType === 3) s += n.nodeValue ?? "";
  return clean(s);
}

/** Measures the contrast of an element's own text against what is painted behind it. */
export function measureContrast(ctx: RuleContext, el: Element): Measure | Text | null {
  const style = ctx.style;
  const fg = style.color(el);
  if (!fg) return t("The text color could not be read.", "A cor do texto não pôde ser lida.");
  const chain: Element[] = [];
  for (let n: Element | null = el; n; n = n.parentElement) chain.unshift(n);
  // Find a background image between the text and the first opaque background color.
  let gradientIndex = -1;
  let stops: RGBA[] | null = null;
  for (let i = chain.length - 1; i >= 0; i--) {
    const node = chain[i]!;
    const image = style.backgroundImage(node);
    if (image && image !== "none") {
      const layers = splitTopLevel(image, ",").map((l) => l.trim());
      const found: RGBA[] = [];
      for (const layer of layers) {
        const g = gradientStops(layer, fg);
        if (!g) return t("The text sits on a background image, so its contrast must be checked by eye.", "O texto está sobre uma imagem de fundo, então o contraste precisa ser verificado a olho.");
        found.push(...g);
      }
      gradientIndex = i;
      stops = found;
      break;
    }
    const bg = style.backgroundColor(node);
    if (bg && bg.a >= 1) break;
  }
  const paint = (text: RGBA | null, stop: RGBA | null): RGBA => {
    let acc: Premul = text ? pre(text) : [0, 0, 0, 0];
    for (let i = chain.length - 1; i >= 0; i--) {
      const node = chain[i]!;
      let bg = style.backgroundColor(node) ?? { r: 0, g: 0, b: 0, a: 0 };
      if (i === gradientIndex && stop) bg = blend(stop, bg);
      acc = over(acc, pre(bg));
      const o = style.opacity(node);
      if (o < 1) acc = [acc[0] * o, acc[1] * o, acc[2] * o, acc[3] * o];
    }
    return unpre(over(acc, pre(WHITE)));
  };
  const candidates = stops ?? [null];
  let worst: Measure | null = null;
  const size = style.fontSize(el);
  const weight = style.fontWeight(el);
  const large = size >= 24 || (size >= 18.66 && weight >= 700);
  for (const stop of candidates) {
    const background = paint(null, stop);
    const foreground = paint(fg, stop);
    const ratio = contrastRatio(foreground, background);
    if (!worst || ratio < worst.ratio) worst = { ratio, foreground, background, large, fontSize: size, fontWeight: weight, gradient: !!stops };
  }
  return worst;
}

function candidates(ctx: RuleContext): Element[] {
  return ctx.elements.filter((el) => {
    if (/^(script|style|template|noscript|title|head|option|textarea|svg|math)$/.test(el.localName)) return false;
    if (el.closest("svg, math")) return false;
    const text = ownText(el);
    if (!text || !/[\p{L}\p{N}]/u.test(text)) return false;
    if (ctx.dom.isHidden(el) || ctx.dom.isVisuallyHidden(el)) return false;
    // Text in disabled controls is exempt (incidental).
    const control = el.closest("button, input, select, label, fieldset, [aria-disabled='true']");
    if (control && ctx.dom.isDisabled(control)) return false;
    if (control?.localName === "label") {
      const id = control.getAttribute("for");
      const input = id ? ctx.dom.byId(id) : control.querySelector("input, select, textarea");
      if (input && ctx.dom.isDisabled(input)) return false;
    }
    return true;
  });
}

function makeRule(enhanced: boolean): Rule {
  return {
    id: enhanced ? "color-contrast-enhanced" : "color-contrast",
    title: enhanced ? t("Text contrast below the enhanced level (AAA)", "Contraste do texto abaixo do nível melhorado (AAA)") : t("Text with low color contrast", "Texto com baixo contraste de cor"),
    explanation: enhanced
      ? t(
          "Level AAA asks for 7:1 for normal text and 4.5:1 for large text, which helps people with moderately low vision read without assistive technology.",
          "O nível AAA pede 7:1 para texto normal e 4,5:1 para texto grande, o que ajuda pessoas com baixa visão moderada a ler sem tecnologia assistiva.",
        )
      : t(
          "Light gray text on white (or any pair of colors too close in brightness) is hard to read. WCAG asks for a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (24px, or 18.66px bold).",
          "Texto cinza claro sobre branco (ou qualquer par de cores com brilho parecido) é difícil de ler. A WCAG pede uma razão de contraste de pelo menos 4,5:1 para texto normal e 3:1 para texto grande (24px, ou 18,66px em negrito).",
        ),
    affects: t(
      "People with low vision, color blindness or cataracts, older adults, and everyone reading a phone in sunlight.",
      "Pessoas com baixa visão, daltonismo ou catarata, idosos e qualquer pessoa lendo o celular sob o sol.",
    ),
    severity: enhanced ? "minor" : "serious",
    wcag: [enhanced ? "1.4.6" : "1.4.3"],
    level: enhanced ? "AAA" : "AA",
    tags: ["color"],
    run(ctx) {
      for (const el of candidates(ctx)) {
        const m = measureContrast(ctx, el);
        if (!m) continue;
        if ("en" in m) {
          if (!enhanced) ctx.incomplete(el, m);
          continue;
        }
        const aa = m.large ? 3 : 4.5;
        const aaa = m.large ? 4.5 : 7;
        const required = enhanced ? aaa : aa;
        if (m.ratio >= required) continue;
        if (enhanced && m.ratio < aa) continue; // already reported by color-contrast
        const s = suggestColors(m.foreground, m.background, { ratio: required });
        const fgHex = toHex({ ...m.foreground, a: 1 });
        const bgHex = toHex({ ...m.background, a: 1 });
        const changeFg = s.changed !== "background";
        const style = mergeStyle(el.getAttribute("style"), changeFg ? { color: s.foreground } : { "background-color": s.background });
        const sizeNote = m.large ? t("large text", "texto grande") : t("normal text", "texto normal");
        const other = changeFg ? s.backgroundOption : s.foregroundOption;
        ctx.report({
          el,
          message: t(
            `Contrast is ${formatRatio(m.ratio)}:1 (${fgHex} on ${bgHex}${m.gradient ? ", worst point of a gradient" : ""}). ${sizeNote.en.charAt(0).toUpperCase() + sizeNote.en.slice(1)} needs ${required}:1.`,
            `O contraste é ${formatRatio(m.ratio).replace(".", ",")}:1 (${fgHex} sobre ${bgHex}${m.gradient ? ", pior ponto de um degradê" : ""}). ${sizeNote.pt.charAt(0).toUpperCase() + sizeNote.pt.slice(1)} precisa de ${String(required).replace(".", ",")}:1.`,
          ),
          fix: {
            summary: changeFg
              ? t(
                  `Change the text color to ${s.foreground} (${formatRatio(s.ratio)}:1), the closest color with the same hue that passes.${other ? ` Or keep the text and use the background ${other.background}.` : ""}`,
                  `Mude a cor do texto para ${s.foreground} (${formatRatio(s.ratio).replace(".", ",")}:1), a cor mais próxima com o mesmo matiz que passa.${other ? ` Ou mantenha o texto e use o fundo ${other.background}.` : ""}`,
                )
              : t(
                  `Change the background to ${s.background} (${formatRatio(s.ratio)}:1), the closest shade that passes.${other ? ` Or change the text color to ${other.foreground}.` : ""}`,
                  `Mude o fundo para ${s.background} (${formatRatio(s.ratio).replace(".", ",")}:1), o tom mais próximo que passa.${other ? ` Ou mude a cor do texto para ${other.foreground}.` : ""}`,
                ),
            ops: [{ op: "set-attr", name: "style", value: style }],
            safe: false,
          },
          data: {
            ratio: Math.round(m.ratio * 100) / 100,
            required,
            foreground: fgHex,
            background: bgHex,
            large: m.large,
            fontSize: Math.round(m.fontSize * 100) / 100,
            fontWeight: m.fontWeight,
            suggestion: { foreground: s.foreground, background: s.background, ratio: Math.round(s.ratio * 100) / 100, changed: s.changed },
          },
        });
      }
    },
  };
}

export const contrastRules: Rule[] = [makeRule(false), makeRule(true)];
