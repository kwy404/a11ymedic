import {
  ABSTRACT_ROLES,
  ARIA_ATTRIBUTES,
  NAME_PROHIBITED,
  REQUIRED_ATTRIBUTES,
  REQUIRED_PARENT,
  ROLES,
  isValidAriaValue,
  suggestAriaAttribute,
  suggestRole,
} from "../aria";
import { inputType, snippet } from "../dom";
import { t, type Rule } from "../engine";
import type { FixOp } from "../types";

const DEFAULTS: Record<string, string> = {
  "aria-checked": "false",
  "aria-expanded": "false",
  "aria-level": "2",
  "aria-valuenow": "0",
  "aria-controls": "ID_OF_CONTROLLED_ELEMENT",
};

/** Native elements that already provide the state a role requires. */
function nativelyProvides(el: Element, role: string): boolean {
  const tag = el.localName;
  const type = inputType(el);
  if ((role === "checkbox" || role === "switch" || role === "menuitemcheckbox") && tag === "input" && type === "checkbox") return true;
  if ((role === "radio" || role === "menuitemradio") && tag === "input" && type === "radio") return true;
  if (role === "heading" && /^h[1-6]$/.test(tag)) return true;
  if (role === "slider" && tag === "input" && type === "range") return true;
  if (role === "meter" && tag === "meter") return true;
  if (role === "combobox" && (tag === "select" || (tag === "input" && el.hasAttribute("list")))) return true;
  return false;
}

function valueSuggestion(name: string, value: string): string | null {
  const def = ARIA_ATTRIBUTES[name];
  if (!def) return null;
  const v = value.trim().toLowerCase();
  if (def.type === "boolean" || def.type === "tristate" || def.type === "true-false-undefined") {
    if (/^(yes|1|on|checked|selected|expanded|hidden)$/.test(v) || v === "") return "true";
    if (/^(no|0|off|none|null)$/.test(v)) return "false";
  }
  if (def.values) {
    const hit = def.values.find((x) => x.startsWith(v.slice(0, 3)));
    if (hit) return hit;
  }
  if (def.type === "integer") {
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return String(n);
  }
  return null;
}

export const ariaRules: Rule[] = [
  {
    id: "aria-valid-role",
    title: t("Invalid ARIA role", "Role ARIA inválido"),
    explanation: t(
      "A role tells assistive technology what an element is. A misspelled or made up role (role=\"buton\") is ignored, so the element is announced as something else, or as nothing.",
      "Um role diz à tecnologia assistiva o que o elemento é. Um role digitado errado ou inventado (role=\"buton\") é ignorado, e o elemento é anunciado como outra coisa, ou como nada.",
    ),
    affects: t("Screen reader and voice control users.", "Usuários de leitores de tela e de controle por voz."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        const raw = el.getAttribute("role");
        if (raw === null) continue;
        const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (!tokens.length) continue;
        if (tokens.some((r) => ROLES.has(r) && !ABSTRACT_ROLES.has(r))) continue;
        const first = tokens[0]!;
        const abstract = ABSTRACT_ROLES.has(first);
        const suggestion = abstract ? null : suggestRole(first);
        ctx.report({
          el,
          message: abstract
            ? t(`role="${first}" is an abstract role meant for the specification, not for pages.`, `role="${first}" é um role abstrato da especificação, não deve ser usado em páginas.`)
            : t(`role="${raw.trim()}" is not a valid ARIA role.`, `role="${raw.trim()}" não é um role ARIA válido.`),
          fix: suggestion
            ? {
                summary: t(`Did you mean role="${suggestion}"?`, `Você quis dizer role="${suggestion}"?`),
                ops: [{ op: "set-attr", name: "role", value: suggestion }],
                safe: false,
              }
            : {
                summary: t("Remove the role, or use a real one (a native HTML element is even better).", "Remova o role, ou use um válido (um elemento HTML nativo é melhor ainda)."),
                ops: [{ op: "remove-attr", name: "role" }],
                safe: true,
              },
        });
      }
    },
  },
  {
    id: "aria-valid-attr",
    title: t("Misspelled or unknown ARIA attribute", "Atributo ARIA desconhecido ou digitado errado"),
    explanation: t(
      "Browsers silently ignore aria-* attributes they do not know. A typo like aria-labeledby (one l) means the label never reaches screen readers.",
      "Navegadores ignoram em silêncio atributos aria-* que não conhecem. Um erro como aria-labeledby (com um l) faz com que o rótulo nunca chegue aos leitores de tela.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        for (const attr of Array.from(el.attributes)) {
          if (!attr.name.startsWith("aria-") || ARIA_ATTRIBUTES[attr.name]) continue;
          const suggestion = suggestAriaAttribute(attr.name);
          const ops: FixOp[] = suggestion ? [{ op: "rename-attr", name: attr.name, to: suggestion }] : [{ op: "remove-attr", name: attr.name }];
          ctx.report({
            el,
            message: t(`${attr.name} is not an ARIA attribute.`, `${attr.name} não é um atributo ARIA.`),
            fix: {
              summary: suggestion ? t(`Rename it to ${suggestion}.`, `Renomeie para ${suggestion}.`) : t("Remove it.", "Remova-o."),
              ops,
              safe: !!suggestion && !el.hasAttribute(suggestion),
            },
          });
        }
      }
    },
  },
  {
    id: "aria-valid-attr-value",
    title: t("Invalid ARIA attribute value", "Valor de atributo ARIA inválido"),
    explanation: t(
      "ARIA attributes only accept specific values: aria-expanded takes true or false, aria-labelledby takes ids that exist. Anything else is ignored or misread.",
      "Atributos ARIA aceitam apenas valores específicos: aria-expanded aceita true ou false, aria-labelledby aceita ids que existem. Qualquer outra coisa é ignorada ou mal interpretada.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        for (const attr of Array.from(el.attributes)) {
          const def = ARIA_ATTRIBUTES[attr.name];
          if (!def) continue;
          if (def.type === "idref" || def.type === "idrefs") {
            if (attr.name === "aria-controls" || attr.name === "aria-owns" || attr.name === "aria-flowto") continue;
            const ids = attr.value.split(/\s+/).filter(Boolean);
            if (!ids.length) continue;
            const missing = ids.filter((id) => !ctx.dom.byId(id));
            if (missing.length === ids.length) {
              ctx.report({
                el,
                message: t(`${attr.name} points to id "${missing.join(" ")}", which does not exist.`, `${attr.name} aponta para o id "${missing.join(" ")}", que não existe.`),
                fix: {
                  summary: t(`Add id="${missing[0]}" to the element that holds the text, or fix the reference.`, `Adicione id="${missing[0]}" ao elemento que tem o texto, ou corrija a referência.`),
                  after: `${snippet(el)}\n<span id="${missing[0]}">...</span>`,
                  safe: false,
                },
              });
            }
            continue;
          }
          if (isValidAriaValue(attr.name, attr.value)) continue;
          if (def.type === "string") continue;
          const suggestion = valueSuggestion(attr.name, attr.value);
          const allowed = def.values ? def.values.join(", ") : def.type === "boolean" ? "true, false" : def.type === "tristate" ? "true, false, mixed" : def.type === "true-false-undefined" ? "true, false" : def.type;
          ctx.report({
            el,
            message: t(`${attr.name}="${attr.value}" is not valid. Allowed: ${allowed}.`, `${attr.name}="${attr.value}" não é válido. Permitido: ${allowed}.`),
            fix: {
              summary: suggestion ? t(`Use ${attr.name}="${suggestion}".`, `Use ${attr.name}="${suggestion}".`) : t(`Use one of: ${allowed}.`, `Use um destes: ${allowed}.`),
              ...(suggestion ? { ops: [{ op: "set-attr" as const, name: attr.name, value: suggestion }] } : {}),
              safe: false,
            },
          });
        }
      }
    },
  },
  {
    id: "aria-required-attr",
    title: t("ARIA role missing a required state", "Role ARIA sem um estado obrigatório"),
    explanation: t(
      "Some roles are meaningless without their state: a checkbox must say if it is checked, a slider must say its value, a heading needs a level. Without it screen readers announce the control but not its state.",
      "Alguns roles não fazem sentido sem seu estado: uma caixa de seleção precisa dizer se está marcada, um slider precisa dizer seu valor, um título precisa de nível. Sem isso o leitor de tela anuncia o controle mas não o estado.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "critical",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        const role = ctx.dom.explicitRole(el);
        const required = REQUIRED_ATTRIBUTES[role];
        if (!required || nativelyProvides(el, role)) continue;
        if (role === "separator" && !ctx.dom.isFocusable(el)) continue;
        const missing = required.filter((a) => !el.hasAttribute(a));
        if (!missing.length) continue;
        ctx.report({
          el,
          message: t(`role="${role}" needs ${missing.join(" and ")}.`, `role="${role}" precisa de ${missing.join(" e ")}.`),
          fix: {
            summary: t(`Add ${missing.join(" and ")} and keep it updated from your script. A native element (for example <input type="checkbox">) does this for you.`, `Adicione ${missing.join(" e ")} e mantenha atualizado pelo script. Um elemento nativo (por exemplo <input type="checkbox">) faz isso por você.`),
            ops: missing.map((a) => ({ op: "set-attr" as const, name: a, value: a === "aria-valuenow" ? el.getAttribute("aria-valuemin") ?? "0" : DEFAULTS[a] ?? "" })),
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "aria-hidden-focus",
    title: t("Hidden content that can still receive focus", "Conteúdo oculto que ainda recebe foco"),
    explanation: t(
      "aria-hidden=\"true\" hides content from screen readers, but not from the keyboard. Focus can land on a link or button inside it and screen reader users hear nothing, or something confusing.",
      "aria-hidden=\"true\" esconde o conteúdo dos leitores de tela, mas não do teclado. O foco pode cair em um link ou botão dentro dele e quem usa leitor de tela não ouve nada, ou ouve algo confuso.",
    ),
    affects: t("Screen reader users who also use the keyboard.", "Usuários de leitores de tela que também usam o teclado."),
    severity: "serious",
    wcag: ["4.1.2", "1.3.1"],
    level: "A",
    tags: ["aria", "keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.getAttribute("aria-hidden")?.trim().toLowerCase() !== "true") continue;
        if (el === ctx.doc.body || el === ctx.doc.documentElement) continue;
        if (el.parentElement?.closest("[aria-hidden='true']")) continue;
        if (ctx.dom.isHidden(el) || el.hasAttribute("inert")) continue;
        const focusable = [el, ...Array.from(el.querySelectorAll("*"))].filter((n) => ctx.dom.isTabbable(n));
        if (!focusable.length) continue;
        ctx.report({
          el,
          message: t(`This aria-hidden element contains ${focusable.length} focusable element(s), starting with <${focusable[0]!.localName}>.`, `Este elemento com aria-hidden contém ${focusable.length} elemento(s) focável(is), começando por <${focusable[0]!.localName}>.`),
          fix: {
            summary: t("Add the inert attribute so its contents cannot be focused, or remove aria-hidden if the content is meant to be used.", "Adicione o atributo inert para que o conteúdo não receba foco, ou remova aria-hidden se o conteúdo deve ser usado."),
            ops: [{ op: "set-attr", name: "inert", value: "" }],
            safe: false,
          },
          data: { focusable: focusable.length },
        });
      }
    },
  },
  {
    id: "aria-hidden-body",
    title: t("Whole page hidden from screen readers", "Página inteira oculta dos leitores de tela"),
    explanation: t(
      "aria-hidden=\"true\" on <body> or <html> hides every element from assistive technology. This often happens when a modal script forgets to clean up.",
      "aria-hidden=\"true\" no <body> ou <html> esconde todos os elementos da tecnologia assistiva. Isso costuma acontecer quando o script de um modal esquece de limpar o atributo.",
    ),
    affects: t("Everyone using a screen reader: the page is empty to them.", "Todos que usam leitor de tela: a página fica vazia para eles."),
    severity: "critical",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of [ctx.doc.documentElement, ctx.doc.body]) {
        if (!el || el.getAttribute("aria-hidden")?.trim().toLowerCase() !== "true") continue;
        ctx.report({
          el,
          message: t(`<${el.localName}> has aria-hidden="true".`, `<${el.localName}> tem aria-hidden="true".`),
          fix: { summary: t("Remove aria-hidden from it. To hide content behind a modal, use inert on the siblings.", "Remova aria-hidden dele. Para esconder o conteúdo atrás de um modal, use inert nos elementos irmãos."), ops: [{ op: "remove-attr", name: "aria-hidden" }], safe: true },
        });
      }
    },
  },
  {
    id: "aria-prohibited-label",
    title: t("aria-label on an element that cannot be named", "aria-label em elemento que não pode ter nome"),
    explanation: t(
      "aria-label only works on interactive elements, landmarks, images and a few other roles. On a plain <div>, <span> or <p> most screen readers ignore it, so the text you wrote is never heard.",
      "aria-label só funciona em elementos interativos, landmarks, imagens e alguns outros roles. Em uma <div>, <span> ou <p> comum a maioria dos leitores de tela o ignora, e o texto escrito nunca é ouvido.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "moderate",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby")) continue;
        if (!(el.getAttribute("aria-label") ?? "").trim() && !ctx.dom.idrefs(el, "aria-labelledby").length) continue;
        const role = ctx.dom.role(el);
        if (!NAME_PROHIBITED.has(role) && role !== "") continue;
        if (ctx.dom.isFocusable(el) || ctx.dom.isHiddenFromAT(el)) continue;
        if (/^(html|body|head|svg|g|path|use|symbol|iframe|object|embed|canvas|video|audio|label|legend|summary)$/.test(el.localName)) continue;
        const label = el.getAttribute("aria-label") ?? "";
        ctx.report({
          el,
          message: t(`<${el.localName}> has the role "${role || "generic"}", which cannot have an accessible name, so the label is ignored.`, `<${el.localName}> tem o role "${role || "generic"}", que não pode ter nome acessível, então o rótulo é ignorado.`),
          fix: {
            summary: t("Put the text in the content (visible or visually hidden), or give the element a role that supports a name (for example role=\"group\" or role=\"img\").", "Coloque o texto no conteúdo (visível ou visualmente oculto), ou dê ao elemento um role que aceite nome (por exemplo role=\"group\" ou role=\"img\")."),
            ops: label ? [{ op: "set-attr", name: "role", value: "group" }] : [],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "aria-required-parent",
    title: t("ARIA role outside of its required container", "Role ARIA fora do contêiner obrigatório"),
    explanation: t(
      "Some roles only make sense inside a parent: a tab inside a tablist, an option inside a listbox, a menuitem inside a menu. Outside of it, screen readers cannot say \"tab 2 of 4\" and keyboard patterns break.",
      "Alguns roles só fazem sentido dentro de um pai: uma tab dentro de uma tablist, uma option dentro de uma listbox, um menuitem dentro de um menu. Fora dele, leitores de tela não conseguem dizer \"aba 2 de 4\" e os padrões de teclado quebram.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "critical",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        const role = ctx.dom.explicitRole(el);
        const parents = REQUIRED_PARENT[role];
        if (!parents || ctx.dom.isHiddenFromAT(el)) continue;
        let ok = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const r = ctx.dom.role(p);
          if (parents.includes(r)) {
            ok = true;
            break;
          }
          if (r && r !== "generic" && r !== "none" && r !== "presentation" && r !== "group") break;
        }
        const id = el.getAttribute("id");
        if (!ok && id && ctx.doc.querySelector(`[aria-owns~="${id}"]`)) ok = true;
        if (ok) continue;
        const parent = parents[0]!;
        ctx.report({
          el,
          message: t(`role="${role}" must be inside an element with role="${parents.join('" or "')}".`, `role="${role}" deve estar dentro de um elemento com role="${parents.join('" ou "')}".`),
          fix: { summary: t(`Wrap it in an element with role="${parent}".`, `Envolva-o em um elemento com role="${parent}".`), after: `<div role="${parent}">\n  ${snippet(el, 200)}\n</div>`, safe: false },
        });
      }
    },
  },
  {
    id: "presentation-role-conflict",
    title: t("role=\"presentation\" that browsers ignore", "role=\"presentation\" que os navegadores ignoram"),
    explanation: t(
      "role=\"none\" or role=\"presentation\" removes an element's meaning, but browsers ignore it when the element can receive focus or has global ARIA attributes. The page then behaves differently from what the code says.",
      "role=\"none\" ou role=\"presentation\" remove o significado de um elemento, mas os navegadores ignoram isso quando o elemento recebe foco ou tem atributos ARIA globais. A página passa a se comportar diferente do que o código diz.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "minor",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        const explicit = ctx.dom.explicitRole(el);
        if (explicit !== "none" && explicit !== "presentation") continue;
        if (!ctx.dom.isFocusable(el) && !ctx.dom.hasGlobalAria(el)) continue;
        ctx.report({
          el,
          message: ctx.dom.isFocusable(el)
            ? t(`This element can receive focus, so role="${explicit}" is ignored.`, `Este elemento recebe foco, então role="${explicit}" é ignorado.`)
            : t(`This element has global ARIA attributes, so role="${explicit}" is ignored.`, `Este elemento tem atributos ARIA globais, então role="${explicit}" é ignorado.`),
          fix: { summary: t("Remove the role (it has no effect), or remove the focus and ARIA attributes if the element really is decorative.", "Remova o role (ele não tem efeito), ou remova o foco e os atributos ARIA se o elemento for mesmo decorativo."), ops: [{ op: "remove-attr", name: "role" }], safe: true },
        });
      }
    },
  },
];
