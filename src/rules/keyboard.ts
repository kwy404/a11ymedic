import { WIDGET_ROLES } from "../aria";
import { parseDeclarations, splitTopLevel, type StyleRule } from "../css";
import { clean, inputType, mergeStyle } from "../dom";
import { t, type Rule, type RuleContext } from "../engine";
import { evalLength } from "../style";

const CLICK_ATTRS = ["onclick", "ng-click", "@click", "v-on:click", "(click)", "onmousedown", "onmouseup"];

function hasClickHandler(el: Element): boolean {
  return CLICK_ATTRS.some((a) => el.hasAttribute(a));
}

const removesOutline = (decls: Map<string, string>): boolean => {
  const outline = decls.get("outline");
  if (outline !== undefined && /^(none|0|0px|transparent|0 none|none 0)$/i.test(outline.trim())) return true;
  if (decls.get("outline-style")?.trim().toLowerCase() === "none") return true;
  if (/^0(px)?$/.test(decls.get("outline-width")?.trim() ?? "")) return true;
  if (decls.get("outline-color")?.trim().toLowerCase() === "transparent") return true;
  return false;
};

const providesIndicator = (decls: Map<string, string>): boolean => {
  for (const [prop, value] of decls) {
    const v = value.trim().toLowerCase();
    if (prop === "outline" && !/^(none|0|0px|transparent)/.test(v)) return true;
    if (prop === "outline-style" && v !== "none") return true;
    if (prop === "outline-color" && v !== "transparent") return true;
    if (prop === "outline-width" && !/^0(px)?$/.test(v)) return true;
    if (prop === "box-shadow" && v !== "none") return true;
    if (/^border(-(top|right|bottom|left|block|inline))?(-(color|width|style))?$/.test(prop) && v !== "none" && v !== "0") return true;
    if (/^background(-color|-image)?$/.test(prop)) return true;
    if (prop === "text-decoration" || prop === "text-decoration-line") return true;
    if (prop === "color" || prop === "transform" || prop === "filter") return true;
  }
  return false;
};

const declMap = (rule: StyleRule): Map<string, string> => new Map(rule.declarations.map((d) => [d.property, d.value]));
const FOCUS = /:focus(-visible)?\b/g;
const baseOf = (sel: string): string => clean(sel.replace(/:focus(-visible)?(?!-)/g, "").replace(/:not\(\s*\)/g, "")) || "*";

/** Line and column of a CSS rule, computed from the position of its <style> element. */
export function cssLocation(ctx: RuleContext, sheet: number, offset: number): { line?: number; column?: number } {
  const source = ctx.cssSources[sheet];
  if (!source?.owner) return {};
  const at = ctx.options.locate?.(source.owner);
  if (!at) return {};
  const before = source.text.slice(0, offset);
  const lines = before.split("\n");
  if (lines.length === 1) return { line: at.line, column: at.column + before.length };
  return { line: at.line + lines.length - 1, column: lines[lines.length - 1]!.length + 1 };
}

function ownerOf(ctx: RuleContext, sheet: number): Element {
  return ctx.cssSources[sheet]?.owner ?? ctx.doc.documentElement;
}

function isTarget(ctx: RuleContext, el: Element): boolean {
  const role = ctx.dom.role(el);
  if (!["button", "link", "checkbox", "radio", "switch", "tab", "menuitem", "option", "menuitemcheckbox", "menuitemradio"].includes(role)) return false;
  if (ctx.dom.isHidden(el) || ctx.dom.isDisabled(el)) return false;
  return ctx.dom.isFocusable(el) || /^(input|button)$/.test(el.localName);
}

function inlineInText(ctx: RuleContext, el: Element): boolean {
  if (ctx.dom.role(el) !== "link" || !/^inline$/.test(ctx.style.display(el))) return false;
  const parent = el.parentElement;
  if (!parent) return false;
  return Array.from(parent.childNodes).some((n) => n.nodeType === 3 && clean(n.nodeValue ?? "").length > 1);
}

function staticSize(ctx: RuleContext, el: Element, axis: "width" | "height"): number {
  const s = ctx.style;
  const em = s.fontSize(el);
  const read = (p: string): number => {
    const v = s.get(el, p);
    // Percentages depend on the containing block, which static analysis does not know.
    return v && !v.includes("%") ? evalLength(v, em) : NaN;
  };
  let size = read(axis);
  const min = read(`min-${axis}`);
  if (Number.isFinite(min) && (!Number.isFinite(size) || min > size)) size = min;
  if (!Number.isFinite(size)) return NaN;
  if (s.get(el, "box-sizing") !== "border-box") {
    const [a, b] = axis === "width" ? ["left", "right"] : ["top", "bottom"];
    for (const p of [`padding-${a}`, `padding-${b}`]) {
      const v = read(p);
      if (Number.isFinite(v)) size += v;
    }
  }
  return size;
}

export const keyboardRules: Rule[] = [
  {
    id: "tabindex",
    title: t("Positive tabindex changes the focus order", "tabindex positivo muda a ordem do foco"),
    explanation: t(
      "tabindex values above 0 move an element to the front of the Tab order, ahead of everything else on the page. Keyboard users then jump around the page in an order that does not match what they see.",
      "Valores de tabindex acima de 0 levam o elemento para o início da ordem do Tab, antes de todo o resto da página. Quem usa teclado passa a pular pela página em uma ordem que não corresponde ao que vê.",
    ),
    affects: t("Keyboard users, switch users and screen reader users.", "Usuários de teclado, de acionadores e de leitores de tela."),
    severity: "serious",
    wcag: ["2.4.3"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        const ti = ctx.dom.tabIndex(el);
        if (ti === null || ti <= 0) continue;
        ctx.report({
          el,
          message: t(`tabindex="${ti}" puts this element ahead of the natural focus order.`, `tabindex="${ti}" coloca este elemento antes da ordem natural do foco.`),
          fix: {
            summary: t("Use tabindex=\"0\" and arrange the HTML in the order you want focus to follow.", "Use tabindex=\"0\" e organize o HTML na ordem em que o foco deve seguir."),
            ops: [{ op: "set-attr", name: "tabindex", value: "0" }],
            safe: true,
          },
        });
      }
    },
  },
  {
    id: "focus-visible",
    title: t("Focus indicator removed", "Indicador de foco removido"),
    explanation: t(
      "The focus ring shows keyboard users where they are on the page. outline: none without a replacement style makes focus invisible, like moving a mouse with no pointer on screen.",
      "O anel de foco mostra a quem usa teclado onde está na página. outline: none sem um estilo substituto deixa o foco invisível, como mover um mouse sem ponteiro na tela.",
    ),
    affects: t("Keyboard users, switch users and people with low vision or attention difficulties.", "Usuários de teclado, de acionadores e pessoas com baixa visão ou dificuldades de atenção."),
    severity: "serious",
    wcag: ["2.4.7"],
    level: "AA",
    tags: ["keyboard", "color"],
    run(ctx) {
      // Which selectors get a focus style from some rule.
      const indicated = new Set<string>();
      for (const rule of ctx.css.rules) {
        if (!providesIndicator(declMap(rule))) continue;
        for (const sel of splitTopLevel(rule.selector, ",")) {
          if (/:focus(-visible)?\b/.test(sel)) indicated.add(baseOf(sel));
        }
      }
      for (const rule of ctx.css.rules) {
        const decls = declMap(rule);
        if (!removesOutline(decls)) continue;
        const sameRuleIndicator = providesIndicator(decls);
        for (const raw of splitTopLevel(rule.selector, ",")) {
          const sel = raw.trim();
          if (/:not\(:focus-visible\)/.test(sel) || /:focus-within/.test(sel)) continue;
          const hasFocus = FOCUS.test(sel);
          FOCUS.lastIndex = 0;
          if (hasFocus && sameRuleIndicator) continue;
          const base = baseOf(sel);
          if (!hasFocus) {
            // A plain rule (button { outline: none }) only matters for focusable elements.
            let nodes: Element[] = [];
            try {
              nodes = Array.from(ctx.doc.querySelectorAll(base));
            } catch {
              continue;
            }
            if (!nodes.some((n) => ctx.dom.isFocusable(n)) && !/^(\*|a|button|input|select|textarea|summary)$/.test(base)) continue;
          }
          if (indicated.has(base) || indicated.has("*") || indicated.has("")) continue;
          const where = cssLocation(ctx, rule.sheet, rule.offset);
          const text = rule.text.length > 200 ? rule.text.slice(0, 197) + "..." : rule.text;
          ctx.report({
            el: ownerOf(ctx, rule.sheet),
            css: { selector: sel, text, ...where },
            message: t(`"${sel}" removes the focus outline and no focus style replaces it.`, `"${sel}" remove o contorno de foco e nenhum estilo de foco o substitui.`),
            fix: {
              summary: t(
                "Keep a visible focus style for keyboard users. If the ring bothers mouse users, hide it only when :focus-visible does not match.",
                "Mantenha um estilo de foco visível para quem usa teclado. Se o anel incomoda quem usa mouse, esconda-o apenas quando :focus-visible não se aplica.",
              ),
              after: `${base}:focus:not(:focus-visible) {\n  outline: none;\n}\n${base}:focus-visible {\n  outline: 3px solid #0f8b8d;\n  outline-offset: 2px;\n}`,
              safe: false,
            },
          });
        }
      }
      // Inline style="outline: none" on focusable elements.
      for (const el of ctx.elements) {
        const style = el.getAttribute("style");
        if (!style || !/outline/i.test(style) || !ctx.dom.isFocusable(el)) continue;
        const decls = new Map(parseDeclarations(style).map((d) => [d.property, d.value]));
        if (!removesOutline(decls) || providesIndicator(decls)) continue;
        const rest = parseDeclarations(style)
          .filter((d) => !d.property.startsWith("outline"))
          .map((d) => `${d.property}: ${d.value}`)
          .join("; ");
        ctx.report({
          el,
          message: t("The inline style removes the focus outline of this focusable element.", "O estilo inline remove o contorno de foco deste elemento focável."),
          fix: {
            summary: t("Remove outline from the inline style and style focus in your stylesheet with :focus-visible.", "Remova o outline do estilo inline e estilize o foco na folha de estilos com :focus-visible."),
            ops: rest ? [{ op: "set-attr", name: "style", value: rest }] : [{ op: "remove-attr", name: "style" }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "nested-interactive",
    title: t("Interactive element inside another one", "Elemento interativo dentro de outro"),
    explanation: t(
      "A button inside a link (or a link inside a button) gives one spot two meanings. Screen readers announce only the outer control, the inner one may be unreachable by keyboard, and a click can trigger the wrong action.",
      "Um botão dentro de um link (ou um link dentro de um botão) dá dois significados a um mesmo lugar. Leitores de tela anunciam só o controle externo, o interno pode ficar inacessível pelo teclado e um clique pode disparar a ação errada.",
    ),
    affects: t("Keyboard users, screen reader users and voice control users.", "Usuários de teclado, de leitores de tela e de controle por voz."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      const outerRoles = new Set(["button", "link", "checkbox", "radio", "switch", "tab", "menuitem", "option", "treeitem", "menuitemcheckbox", "menuitemradio"]);
      for (const el of ctx.elements) {
        if (!outerRoles.has(ctx.dom.role(el)) || ctx.dom.isHiddenFromAT(el)) continue;
        const inner = Array.from(el.querySelectorAll("*")).find((d) => ctx.dom.isTabbable(d) || (WIDGET_ROLES.has(ctx.dom.role(d)) && ctx.dom.isFocusable(d)));
        if (!inner) continue;
        ctx.report({
          el,
          message: t(`This ${ctx.dom.role(el)} contains a focusable <${inner.localName}>.`, `Este ${ctx.dom.role(el)} contém um <${inner.localName}> focável.`),
          fix: {
            summary: t("Move the inner control next to the outer one instead of inside it.", "Mova o controle interno para o lado do externo em vez de dentro dele."),
            after: `<div class="card">\n  <a href="...">Title of the card</a>\n  <button type="button">Secondary action</button>\n</div>`,
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "keyboard-click-handler",
    title: t("Clickable element that keyboards cannot use", "Elemento clicável que o teclado não consegue usar"),
    explanation: t(
      "A <div> or <span> with a click handler works with a mouse only. It cannot receive focus with Tab, does not react to Enter or Space, and is not announced as a button.",
      "Uma <div> ou <span> com evento de clique funciona apenas com mouse. Ela não recebe foco com Tab, não reage a Enter ou Espaço e não é anunciada como botão.",
    ),
    affects: t("Keyboard users, switch users, screen reader users and voice control users.", "Usuários de teclado, de acionadores, de leitores de tela e de controle por voz."),
    severity: "serious",
    wcag: ["2.1.1", "4.1.2"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (!hasClickHandler(el) || el.localName === "a" || /^(html|body|label|img|video|audio|form|option)$/.test(el.localName)) continue;
        if (ctx.dom.isHidden(el)) continue;
        const role = ctx.dom.role(el);
        if (WIDGET_ROLES.has(role) && ctx.dom.isTabbable(el)) continue;
        if (ctx.dom.isNativelyFocusable(el)) continue;
        if (Array.from(el.querySelectorAll("*")).some((d) => ctx.dom.isTabbable(d))) continue;
        const generic = /^(div|span|li|p|td|i|b|strong|em|section|article)$/.test(el.localName) && !ctx.dom.explicitRole(el);
        ctx.report({
          el,
          message: WIDGET_ROLES.has(role)
            ? t(`This element has role="${role}" and a click handler but cannot be focused with the keyboard.`, `Este elemento tem role="${role}" e um evento de clique mas não recebe foco pelo teclado.`)
            : t(`This <${el.localName}> reacts to clicks but is not focusable and is not announced as a button.`, `Este <${el.localName}> reage a cliques mas não recebe foco e não é anunciado como botão.`),
          fix: generic
            ? {
                summary: t("Use a real <button type=\"button\">: it is focusable and works with Enter and Space for free.", "Use um <button type=\"button\"> de verdade: ele recebe foco e funciona com Enter e Espaço sem esforço."),
                ops: [
                  { op: "rename-tag", tag: "button" },
                  { op: "set-attr", name: "type", value: "button" },
                ],
                safe: false,
              }
            : {
                summary: t("Add tabindex=\"0\" and handle Enter and Space in your key handler.", "Adicione tabindex=\"0\" e trate Enter e Espaço no evento de teclado."),
                ops: [
                  ...(WIDGET_ROLES.has(role) ? [] : [{ op: "set-attr" as const, name: "role", value: "button" }]),
                  { op: "set-attr", name: "tabindex", value: "0" },
                ],
                safe: false,
              },
        });
      }
    },
  },
  {
    id: "link-as-button",
    title: t("Link used as a button", "Link usado como botão"),
    explanation: t(
      "An <a> without a real href, used only to run a script, is announced as a link (people expect to go somewhere) and, without href, cannot even be reached with the Tab key.",
      "Um <a> sem href de verdade, usado só para executar um script, é anunciado como link (as pessoas esperam ir para algum lugar) e, sem href, nem pode ser alcançado com a tecla Tab.",
    ),
    affects: t("Keyboard users and screen reader users.", "Usuários de teclado e de leitores de tela."),
    severity: "moderate",
    wcag: ["2.1.1", "4.1.2"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "a" || ctx.dom.isHidden(el)) continue;
        const href = el.getAttribute("href");
        const fake = href === null || href.trim() === "#" || /^javascript:/i.test(href.trim());
        if (!fake) continue;
        const handler = hasClickHandler(el) || /^javascript:/i.test(href ?? "");
        if (!handler && ctx.dom.explicitRole(el) !== "button") continue;
        const focusable = ctx.dom.isTabbable(el);
        ctx.report({
          el,
          severity: focusable ? "moderate" : "serious",
          message: href === null
            ? t("This <a> has no href, so it cannot be focused with the keyboard.", "Este <a> não tem href, então não recebe foco pelo teclado.")
            : t(`This link (href="${href}") only runs a script.`, `Este link (href="${href}") só executa um script.`),
          fix: {
            summary: t("Use <button type=\"button\"> for actions and keep <a href> for navigation.", "Use <button type=\"button\"> para ações e mantenha <a href> para navegação."),
            ops: [
              { op: "rename-tag", tag: "button" },
              { op: "remove-attr", name: "href" },
              { op: "remove-attr", name: "role" },
              { op: "set-attr", name: "type", value: "button" },
            ],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "target-size",
    title: t("Click or tap target smaller than 24 by 24 pixels", "Alvo de clique ou toque menor que 24 por 24 pixels"),
    explanation: t(
      "Small buttons and links placed close together are hard to hit. WCAG 2.2 asks for targets of at least 24 by 24 CSS pixels, or enough space around them so a 24 pixel circle does not touch a neighbor.",
      "Botões e links pequenos e próximos são difíceis de acertar. A WCAG 2.2 pede alvos de pelo menos 24 por 24 pixels CSS, ou espaço suficiente ao redor para que um círculo de 24 pixels não encoste no vizinho.",
    ),
    affects: t("People with tremors or limited dexterity, people on phones, and older adults.", "Pessoas com tremores ou destreza limitada, quem usa celular e idosos."),
    severity: "serious",
    wcag: ["2.5.8"],
    level: "AA",
    tags: ["keyboard"],
    run(ctx) {
      const targets = ctx.elements.filter((el) => isTarget(ctx, el));
      const computed = ctx.style.kind === "computed";
      const boxes = new Map<Element, { x: number; y: number; width: number; height: number }>();
      if (computed) for (const el of targets) boxes.set(el, ctx.style.rect(el)!);
      const undersized: Array<{ el: Element; w: number; h: number }> = [];
      for (const el of targets) {
        if (inlineInText(ctx, el)) continue;
        let w: number;
        let h: number;
        if (computed) {
          const r = boxes.get(el)!;
          if (r.width === 0 && r.height === 0) continue;
          w = r.width;
          h = r.height;
          // Unstyled native checkboxes and radios are sized by the browser: exempt.
          if (el.localName === "input" && /^(checkbox|radio)$/.test(inputType(el)) && !ctx.style.get(el, "width").includes("px")) continue;
        } else {
          w = staticSize(ctx, el, "width");
          h = staticSize(ctx, el, "height");
          if (/^inline$/.test(ctx.style.display(el))) {
            w = NaN;
            h = NaN;
          }
        }
        if ((Number.isFinite(w) && w < 24) || (Number.isFinite(h) && h < 24)) undersized.push({ el, w, h });
      }
      for (const { el, w, h } of undersized) {
        const size = `${Number.isFinite(w) ? Math.round(w * 10) / 10 : "?"} x ${Number.isFinite(h) ? Math.round(h * 10) / 10 : "?"}`;
        if (computed) {
          // Spacing exception: a 24px circle centered on the target must not intersect other targets
          // or the circles of other undersized targets.
          const r = boxes.get(el)!;
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          const crowded = targets.some((o) => {
            if (o === el) return false;
            const b = boxes.get(o)!;
            if (b.width === 0 && b.height === 0) return false;
            const small = undersized.some((u) => u.el === o);
            if (small) {
              const ox = b.x + b.width / 2;
              const oy = b.y + b.height / 2;
              return Math.hypot(cx - ox, cy - oy) < 24;
            }
            const nx = Math.max(b.x, Math.min(cx, b.x + b.width));
            const ny = Math.max(b.y, Math.min(cy, b.y + b.height));
            return Math.hypot(cx - nx, cy - ny) < 12;
          });
          if (!crowded) continue;
        } else {
          const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c !== el && targets.includes(c)) : [];
          if (!siblings.length) {
            ctx.incomplete(el, t(`This target is ${size} pixels. Check that it has 24 pixels of space around it.`, `Este alvo tem ${size} pixels. Verifique se há 24 pixels de espaço ao redor.`));
            continue;
          }
        }
        ctx.report({
          el,
          message: t(`This target is ${size} pixels and sits close to other targets.`, `Este alvo tem ${size} pixels e fica perto de outros alvos.`),
          fix: {
            summary: t("Make it at least 24 by 24 pixels (min-width and min-height, or padding), or add space around it.", "Deixe-o com pelo menos 24 por 24 pixels (min-width e min-height, ou padding), ou adicione espaço ao redor."),
            ops: [{ op: "set-attr", name: "style", value: mergeStyle(el.getAttribute("style"), { "min-width": "24px", "min-height": "24px" }) }],
            safe: false,
          },
          data: { width: w, height: h },
        });
      }
    },
  },
];
