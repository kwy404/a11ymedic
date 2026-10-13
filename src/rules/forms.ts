import { clean, escapeAttr, escapeText, inputType } from "../dom";
import { t, type Rule } from "../engine";
import type { Text } from "../types";
import { editDistance } from "../aria";
import { freshId, humanize } from "./helpers";

const SKIP_TYPES = new Set(["hidden", "button", "submit", "reset", "image"]);

const TYPE_LABELS: Record<string, Text> = {
  email: { en: "Email", pt: "E-mail" },
  tel: { en: "Phone number", pt: "Telefone" },
  password: { en: "Password", pt: "Senha" },
  search: { en: "Search", pt: "Pesquisar" },
  url: { en: "Website", pt: "Site" },
  number: { en: "Quantity", pt: "Quantidade" },
  date: { en: "Date", pt: "Data" },
  checkbox: { en: "Option", pt: "Opção" },
  radio: { en: "Option", pt: "Opção" },
  file: { en: "File", pt: "Arquivo" },
  range: { en: "Value", pt: "Valor" },
  color: { en: "Color", pt: "Cor" },
};

function labelText(el: Element): Text {
  const placeholder = clean(el.getAttribute("placeholder") ?? "");
  if (placeholder) return { en: placeholder, pt: placeholder };
  const name = humanize(el.getAttribute("name") ?? el.getAttribute("id") ?? "");
  if (name) return { en: name, pt: name };
  const type = el.localName === "input" ? inputType(el) || "text" : el.localName;
  return TYPE_LABELS[type] ?? (el.localName === "select" ? { en: "Choose an option", pt: "Escolha uma opção" } : { en: "Label", pt: "Rótulo" });
}

const FIELDS = new Set(
  `name honorific-prefix given-name additional-name family-name honorific-suffix nickname username new-password
  current-password one-time-code organization-title organization street-address address-line1 address-line2
  address-line3 address-level4 address-level3 address-level2 address-level1 country country-name postal-code cc-name
  cc-given-name cc-additional-name cc-family-name cc-number cc-exp cc-exp-month cc-exp-year cc-csc cc-type
  transaction-currency transaction-amount language bday bday-day bday-month bday-year sex url photo`.split(/\s+/),
);
const CONTACT_FIELDS = new Set(
  "tel tel-country-code tel-national tel-area-code tel-local tel-local-prefix tel-local-suffix tel-extension email impp".split(" "),
);

const SYNONYMS: Record<string, string> = {
  "e-mail": "email",
  mail: "email",
  emailaddress: "email",
  phone: "tel",
  telephone: "tel",
  mobile: "tel",
  firstname: "given-name",
  "first-name": "given-name",
  fname: "given-name",
  lastname: "family-name",
  "last-name": "family-name",
  surname: "family-name",
  lname: "family-name",
  fullname: "name",
  "full-name": "name",
  zip: "postal-code",
  zipcode: "postal-code",
  "zip-code": "postal-code",
  postcode: "postal-code",
  postalcode: "postal-code",
  address: "street-address",
  city: "address-level2",
  state: "address-level1",
  company: "organization",
  birthday: "bday",
  dob: "bday",
  password: "current-password",
  "credit-card": "cc-number",
  ccnumber: "cc-number",
  user: "username",
  login: "username",
  false: "off",
  true: "on",
};

/** Checks an autocomplete attribute value against the HTML autofill grammar. */
export function isValidAutocomplete(value: string): boolean {
  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  if (tokens.length === 1 && (tokens[0] === "on" || tokens[0] === "off")) return true;
  let i = 0;
  if (tokens[i]?.startsWith("section-")) i++;
  if (tokens[i] === "shipping" || tokens[i] === "billing") i++;
  let contact = false;
  if (["home", "work", "mobile", "fax", "pager"].includes(tokens[i] ?? "")) {
    contact = true;
    i++;
  }
  const field = tokens[i];
  if (!field) return false;
  if (contact ? !CONTACT_FIELDS.has(field) : !FIELDS.has(field) && !CONTACT_FIELDS.has(field)) return false;
  i++;
  if (tokens[i] === "webauthn") i++;
  return i === tokens.length;
}

function repairAutocomplete(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (SYNONYMS[v]) return SYNONYMS[v]!;
  const all = [...FIELDS, ...CONTACT_FIELDS];
  const close = all.filter((f) => editDistance(v, f) <= 2);
  return close.length === 1 ? close[0]! : null;
}

const PURPOSE: Array<[RegExp, string]> = [
  [/^(e-?mail|email-?address|user-?email)$/i, "email"],
  [/^(phone|tel|telephone|mobile|cell|phone-?number|telefone|celular)$/i, "tel"],
  [/^(first-?name|given-?name|fname|nome)$/i, "given-name"],
  [/^(last-?name|family-?name|surname|lname|sobrenome)$/i, "family-name"],
  [/^(full-?name|name|your-?name)$/i, "name"],
  [/^(zip|zip-?code|postal-?code|postcode|cep)$/i, "postal-code"],
  [/^(city|town|cidade)$/i, "address-level2"],
  [/^(country|pais)$/i, "country-name"],
  [/^(address|street|street-?address|endereco)$/i, "street-address"],
  [/^(user-?name|login)$/i, "username"],
];

export const formRules: Rule[] = [
  {
    id: "label",
    title: t("Form field without a label", "Campo de formulário sem rótulo"),
    explanation: t(
      "Every field needs a label that stays visible and is connected to it in code. Screen readers read the label when the field gets focus, and clicking a connected label focuses the field. A placeholder is not a label: it disappears as soon as you type and is usually too light to read.",
      "Todo campo precisa de um rótulo que continue visível e esteja ligado a ele no código. Leitores de tela leem o rótulo quando o campo recebe foco, e clicar em um rótulo ligado foca o campo. Placeholder não é rótulo: some quando você digita e costuma ser claro demais para ler.",
    ),
    affects: t(
      "Screen reader users, people with memory or attention difficulties who lose the placeholder hint, and people with motor disabilities who benefit from a larger click area.",
      "Usuários de leitores de tela, pessoas com dificuldades de memória ou atenção que perdem a dica do placeholder e pessoas com deficiência motora que se beneficiam de uma área de clique maior.",
    ),
    severity: "critical",
    wcag: ["4.1.2", "1.3.1", "3.3.2"],
    level: "A",
    tags: ["forms"],
    run(ctx) {
      for (const el of ctx.elements) {
        const tag = el.localName;
        if (tag !== "input" && tag !== "select" && tag !== "textarea") continue;
        if (tag === "input" && SKIP_TYPES.has(inputType(el))) continue;
        if (ctx.dom.isHiddenFromAT(el)) continue;
        const explicit = ctx.dom.explicitRole(el);
        if (explicit === "none" || explicit === "presentation") continue;
        const hasLabel =
          ctx.dom.labelsOf(el).some((l) => clean(l.textContent ?? "") || l.querySelector("img[alt]:not([alt=''])")) ||
          !!el.getAttribute("aria-label")?.trim() ||
          (ctx.dom.idrefs(el, "aria-labelledby").length > 0 && !!ctx.dom.name(el));
        if (hasLabel) continue;
        const text = labelText(el);
        const existingId = el.getAttribute("id");
        const id = existingId && /^[A-Za-z][\w-]*$/.test(existingId) ? existingId : freshId(ctx.dom, el.getAttribute("name") || text.en);
        const ops = [
          { op: "insert-before" as const, html: `<label for="${escapeAttr(id)}">${escapeText(text.en)}</label>` },
          ...(existingId === id ? [] : [{ op: "set-attr" as const, name: "id", value: id }]),
        ];
        const titleOnly = !!el.getAttribute("title")?.trim();
        const placeholder = !!el.getAttribute("placeholder")?.trim();
        ctx.report({
          el,
          severity: placeholder || titleOnly ? "serious" : "critical",
          message: placeholder
            ? t("This field only has a placeholder. It disappears when people type and is not a real label.", "Este campo só tem placeholder. Ele some quando a pessoa digita e não é um rótulo de verdade.")
            : titleOnly
              ? t("This field is named only by a title tooltip, which is invisible until hovered and never shown on touch screens.", "Este campo só tem nome pelo title, que fica invisível até passar o mouse e nunca aparece em telas de toque.")
              : t("This field has no label, so screen readers announce it as an unnamed edit box.", "Este campo não tem rótulo, então leitores de tela o anunciam como uma caixa de edição sem nome."),
          fix: {
            summary: t(
              `Add a visible <label for="${id}"> connected to the field ("${text.en}"). If the design has no room for it, use aria-label as a last resort.`,
              `Adicione um <label for="${id}"> visível ligado ao campo ("${text.pt}"). Se o design não tiver espaço, use aria-label como último recurso.`,
            ),
            ops,
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "autocomplete-valid",
    title: t("Invalid autocomplete value", "Valor de autocomplete inválido"),
    explanation: t(
      "The autocomplete attribute tells browsers and password managers what a field is for, so they can fill it in. A misspelled value like \"e-mail\" or \"firstname\" is ignored and people have to type everything by hand.",
      "O atributo autocomplete diz ao navegador e ao gerenciador de senhas para que serve o campo, para que possam preenchê-lo. Um valor errado como \"e-mail\" ou \"firstname\" é ignorado e as pessoas precisam digitar tudo à mão.",
    ),
    affects: t("People with motor or cognitive disabilities and anyone filling forms on a phone.", "Pessoas com deficiências motoras ou cognitivas e qualquer pessoa preenchendo formulários no celular."),
    severity: "serious",
    wcag: ["1.3.5"],
    level: "AA",
    tags: ["forms"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (!/^(input|select|textarea)$/.test(el.localName)) continue;
        const value = el.getAttribute("autocomplete");
        if (value === null || isValidAutocomplete(value)) continue;
        if (ctx.dom.isHidden(el)) continue;
        const repaired = repairAutocomplete(value);
        ctx.report({
          el,
          message: t(`"${value}" is not a valid autocomplete value, so browsers ignore it.`, `"${value}" não é um valor válido de autocomplete, então os navegadores o ignoram.`),
          fix: repaired
            ? {
                summary: t(`Use the standard token "${repaired}".`, `Use o valor padrão "${repaired}".`),
                ops: [{ op: "set-attr", name: "autocomplete", value: repaired }],
                safe: true,
              }
            : {
                summary: t("Use a token from the HTML autofill list (for example email, given-name, postal-code, tel).", "Use um valor da lista de preenchimento automático do HTML (por exemplo email, given-name, postal-code, tel)."),
                ops: [{ op: "set-attr", name: "autocomplete", value: "on" }],
                safe: false,
              },
        });
      }
    },
  },
  {
    id: "input-purpose",
    title: t("Personal data field without autocomplete", "Campo de dados pessoais sem autocomplete"),
    explanation: t(
      "Fields that ask for the user's own email, phone, name or address should say so with autocomplete. Browsers then fill them in, and some tools show familiar icons next to them.",
      "Campos que pedem o e-mail, telefone, nome ou endereço da própria pessoa devem dizer isso com autocomplete. Assim o navegador os preenche, e algumas ferramentas mostram ícones conhecidos ao lado.",
    ),
    affects: t("People with motor, memory or cognitive disabilities.", "Pessoas com deficiências motoras, de memória ou cognitivas."),
    severity: "minor",
    wcag: ["1.3.5"],
    level: "AA",
    tags: ["forms"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "input" || el.hasAttribute("autocomplete")) continue;
        if (el.closest("form[autocomplete]")) continue;
        if (ctx.dom.isHidden(el)) continue;
        const type = inputType(el);
        let purpose: string | null = type === "email" ? "email" : type === "tel" ? "tel" : null;
        if (!purpose && (type === "" || type === "text")) {
          const key = el.getAttribute("name") ?? el.getAttribute("id") ?? "";
          purpose = PURPOSE.find(([re]) => re.test(key))?.[1] ?? null;
        }
        if (type === "password") purpose = "current-password";
        if (!purpose) continue;
        ctx.report({
          el,
          message: t(`This field seems to ask for "${purpose}" but has no autocomplete attribute.`, `Este campo parece pedir "${purpose}" mas não tem atributo autocomplete.`),
          fix: {
            summary: t(`Add autocomplete="${purpose}" if the field asks for the user's own data.`, `Adicione autocomplete="${purpose}" se o campo pede dados da própria pessoa.`),
            ops: [{ op: "set-attr", name: "autocomplete", value: purpose }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "paste-blocked",
    title: t("Pasting into a field is blocked", "Colar no campo está bloqueado"),
    explanation: t(
      "Blocking paste on password or code fields stops password managers and forces people to remember and retype secrets. WCAG 2.2 treats this as a cognitive function test.",
      "Bloquear colar em campos de senha ou código impede gerenciadores de senha e obriga as pessoas a memorizar e redigitar segredos. A WCAG 2.2 trata isso como um teste de função cognitiva.",
    ),
    affects: t("People with memory or learning disabilities, dyslexia, and anyone using a password manager.", "Pessoas com deficiências de memória ou aprendizagem, dislexia e qualquer pessoa que use gerenciador de senhas."),
    severity: "serious",
    wcag: ["3.3.8"],
    level: "AA",
    tags: ["forms"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (!/^(input|textarea)$/.test(el.localName)) continue;
        const handler = el.getAttribute("onpaste");
        if (!handler || !/return\s+false|preventDefault/.test(handler)) continue;
        ctx.report({
          el,
          message: t("This field cancels the paste event.", "Este campo cancela o evento de colar."),
          fix: {
            summary: t("Remove the onpaste handler so people can paste and password managers can fill the field.", "Remova o onpaste para que as pessoas possam colar e os gerenciadores de senha possam preencher o campo."),
            ops: [{ op: "remove-attr", name: "onpaste" }],
            safe: true,
          },
        });
      }
    },
  },
  {
    id: "radio-group",
    title: t("Radio buttons without a group label", "Botões de opção sem rótulo do grupo"),
    explanation: t(
      "A set of radio buttons answers one question. Wrapping them in <fieldset> with a <legend> makes screen readers read the question (\"Shipping speed\") before each option (\"Express\").",
      "Um conjunto de botões de opção responde a uma pergunta. Envolver os botões em <fieldset> com <legend> faz o leitor de tela ler a pergunta (\"Tipo de frete\") antes de cada opção (\"Expresso\").",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "moderate",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["forms"],
    run(ctx) {
      const groups = new Map<string, Element[]>();
      for (const el of ctx.elements) {
        if (el.localName !== "input" || inputType(el) !== "radio" || ctx.dom.isHiddenFromAT(el)) continue;
        const name = el.getAttribute("name");
        if (!name) continue;
        const form = el.closest("form");
        const key = `${form ? Array.from(ctx.doc.forms).indexOf(form as HTMLFormElement) : -1}|${name}`;
        const list = groups.get(key) ?? [];
        list.push(el);
        groups.set(key, list);
      }
      for (const [key, radios] of groups) {
        if (radios.length < 2) continue;
        const first = radios[0]!;
        const grouped = radios.every((r) => {
          const fs = r.closest("fieldset");
          if (fs && ctx.dom.name(fs)) return true;
          const g = r.parentElement?.closest("[role=radiogroup], [role=group]");
          return !!(g && ctx.dom.name(g));
        });
        if (grouped) continue;
        const name = key.split("|")[1]!;
        const legend = humanize(name) || "Choose one";
        ctx.report({
          el: first,
          message: t(`The ${radios.length} radio buttons named "${name}" are not inside a labelled group.`, `Os ${radios.length} botões de opção chamados "${name}" não estão em um grupo com rótulo.`),
          fix: {
            summary: t("Wrap the options in <fieldset> and put the question in a <legend>.", "Envolva as opções em <fieldset> e coloque a pergunta em um <legend>."),
            after: `<fieldset>\n  <legend>${escapeText(legend)}</legend>\n  ${radios
              .map((r) => {
                const label = ctx.dom.name(r) || r.getAttribute("value") || "";
                return `<label><input type="radio" name="${escapeAttr(name)}" value="${escapeAttr(r.getAttribute("value") ?? "")}"> ${escapeText(label)}</label>`;
              })
              .join("\n  ")}\n</fieldset>`,
            safe: false,
          },
          data: { count: radios.length },
        });
      }
    },
  },
];
