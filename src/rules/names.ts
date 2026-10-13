import { clean, inputType } from "../dom";
import { t, type Rule } from "../engine";
import { hrefHint, iconHint, isGenericLinkText, nearestHeading } from "./helpers";

const norm = (s: string): string =>
  clean(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " "),
  );

export const nameRules: Rule[] = [
  {
    id: "button-name",
    title: t("Button without a name", "Botão sem nome"),
    explanation: t(
      "A button needs a name that says what it does. Icon only buttons (a trash can, an X, a magnifier) have no text, so screen readers announce just \"button\" and voice control users cannot say which one to press.",
      "Um botão precisa de um nome que diga o que ele faz. Botões só com ícone (uma lixeira, um X, uma lupa) não têm texto, então leitores de tela anunciam apenas \"botão\" e quem usa controle por voz não consegue dizer qual apertar.",
    ),
    affects: t("Screen reader users and people who control the computer by voice.", "Usuários de leitores de tela e pessoas que controlam o computador pela voz."),
    severity: "critical",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["forms", "keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (ctx.dom.role(el) !== "button") continue;
        if (el.localName === "input" && inputType(el) === "image") continue;
        if (ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        if (el.localName === "input") {
          const v = inputType(el) === "reset" ? t("Reset", "Limpar") : t("Send", "Enviar");
          ctx.report({
            el,
            message: t("This input button has an empty value, so it has no name.", "Este botão input tem value vazio, então não tem nome."),
            fix: {
              summary: t(`Give it a value that says what it does, for example "${v.en}".`, `Dê um value que diga o que ele faz, por exemplo "${v.pt}".`),
              ops: [{ op: "set-attr", name: "value", value: v.en }],
              safe: false,
            },
          });
          continue;
        }
        const hint = iconHint(el);
        const label = hint ?? t("Describe the action", "Descreva a ação");
        ctx.report({
          el,
          message: hint
            ? t(`This button only has an icon and no name. The icon suggests "${hint.en}".`, `Este botão só tem um ícone e nenhum nome. O ícone sugere "${hint.pt}".`)
            : t("This button has no text, aria-label or title, so it has no name.", "Este botão não tem texto, aria-label nem title, então não tem nome."),
          fix: {
            summary: t(
              `Add an aria-label that says what the button does ("${label.en}"), or visible text inside it.`,
              `Adicione um aria-label que diga o que o botão faz ("${label.pt}"), ou um texto visível dentro dele.`,
            ),
            ops: [{ op: "set-attr", name: "aria-label", value: label.en }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "link-name",
    title: t("Link without a name", "Link sem nome"),
    explanation: t(
      "Links are announced by their text. A link that wraps only an icon or an image without alt text is announced as \"link\" or as its raw URL, so people cannot tell where it goes.",
      "Links são anunciados pelo texto. Um link que envolve só um ícone ou uma imagem sem alt é anunciado como \"link\" ou pela URL crua, e ninguém sabe para onde ele vai.",
    ),
    affects: t("Screen reader users, voice control users and people who browse a list of links.", "Usuários de leitores de tela, de controle por voz e quem navega pela lista de links."),
    severity: "serious",
    wcag: ["2.4.4", "4.1.2"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (ctx.dom.role(el) !== "link" || el.localName === "area") continue;
        if (ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        const hint = iconHint(el) ?? hrefHint(el.getAttribute("href")) ?? t("Describe the destination", "Descreva o destino");
        const img = el.querySelector("img:not([alt])");
        if (img) {
          ctx.report({
            el,
            message: t("This link contains only an image without alt text, so the link has no name.", "Este link contém só uma imagem sem alt, então o link não tem nome."),
            fix: {
              summary: t(`Give the image alt text that says where the link goes ("${hint.en}").`, `Dê à imagem um alt que diga para onde o link vai ("${hint.pt}").`),
              ops: [{ op: "set-attr", name: "alt", value: hint.en }],
              target: img,
              safe: false,
            },
          });
          continue;
        }
        ctx.report({
          el,
          message: t("This link has no text, so screen readers cannot say where it goes.", "Este link não tem texto, então leitores de tela não conseguem dizer para onde ele vai."),
          fix: {
            summary: t(`Add an aria-label that names the destination ("${hint.en}"), or visible text.`, `Adicione um aria-label com o destino ("${hint.pt}"), ou um texto visível.`),
            ops: [{ op: "set-attr", name: "aria-label", value: hint.en }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "link-text-generic",
    title: t("Link text like \"click here\"", "Texto de link como \"clique aqui\""),
    explanation: t(
      "People using screen readers often jump from link to link or open a list of all links. Ten links called \"read more\" all sound the same, so the link text should say where it goes.",
      "Quem usa leitor de tela costuma pular de link em link ou abrir a lista de todos os links. Dez links chamados \"leia mais\" soam iguais, então o texto do link deve dizer para onde ele vai.",
    ),
    affects: t("Screen reader users, voice control users and people with cognitive disabilities who scan the page.", "Usuários de leitores de tela, de controle por voz e pessoas com deficiências cognitivas que passam os olhos pela página."),
    severity: "moderate",
    wcag: ["2.4.4"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (ctx.dom.role(el) !== "link" || ctx.dom.isHiddenFromAT(el)) continue;
        const name = ctx.dom.name(el);
        if (!name || !isGenericLinkText(name)) continue;
        if (ctx.dom.description(el)) continue;
        const topic = nearestHeading(ctx.dom, el) || hrefHint(el.getAttribute("href"))?.en || "";
        const visible = ctx.dom.visibleText(el) || name;
        const better = topic ? `${visible} about ${topic}` : `${visible} about the topic`;
        const betterPt = topic ? `${visible} sobre ${topic}` : `${visible} sobre o assunto`;
        ctx.report({
          el,
          message: t(`The link text "${name}" does not say where the link goes.`, `O texto do link "${name}" não diz para onde o link vai.`),
          fix: {
            summary: t(
              `Rewrite the link text so it makes sense on its own, or keep it and add the topic with aria-label ("${better}").`,
              `Reescreva o texto do link para que faça sentido sozinho, ou mantenha e acrescente o assunto com aria-label ("${betterPt}").`,
            ),
            ops: [{ op: "set-attr", name: "aria-label", value: better }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "label-in-name",
    title: t("Visible label missing from the accessible name", "Rótulo visível ausente do nome acessível"),
    explanation: t(
      "Voice control users say what they see (\"click Search\"). If an aria-label replaces the visible text with different words, the command does not work and screen reader users hear something other than what is on screen.",
      "Quem usa controle por voz fala o que vê (\"clicar em Pesquisar\"). Se um aria-label troca o texto visível por outras palavras, o comando não funciona e quem usa leitor de tela ouve algo diferente do que está na tela.",
    ),
    affects: t("Voice control users and screen reader users who can partly see the screen.", "Usuários de controle por voz e usuários de leitores de tela que enxergam parcialmente a tela."),
    severity: "serious",
    wcag: ["2.5.3"],
    level: "A",
    tags: ["aria", "forms"],
    run(ctx) {
      const roles = new Set(["button", "link", "menuitem", "tab", "checkbox", "radio", "switch", "option", "treeitem", "menuitemcheckbox", "menuitemradio"]);
      for (const el of ctx.elements) {
        if (!roles.has(ctx.dom.role(el))) continue;
        const aria = el.getAttribute("aria-label")?.trim() || (ctx.dom.idrefs(el, "aria-labelledby").length ? ctx.dom.name(el) : "");
        if (!aria || ctx.dom.isHiddenFromAT(el)) continue;
        const visible = ctx.dom.visibleText(el);
        const v = norm(visible);
        if (v.replace(/\s/g, "").length < 2) continue;
        if (norm(ctx.dom.name(el)).includes(v)) continue;
        const suggestion = norm(aria).includes(v) ? aria : `${visible} ${aria.charAt(0).toLowerCase()}${aria.slice(1)}`;
        ctx.report({
          el,
          message: t(`The visible text is "${visible}" but the accessible name is "${ctx.dom.name(el)}".`, `O texto visível é "${visible}" mas o nome acessível é "${ctx.dom.name(el)}".`),
          fix: {
            summary: t("Make the accessible name start with the visible text, or remove the aria-label.", "Faça o nome acessível começar com o texto visível, ou remova o aria-label."),
            ops: [{ op: "set-attr", name: "aria-label", value: suggestion }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "aria-dialog-name",
    title: t("Dialog without a name", "Diálogo sem nome"),
    explanation: t(
      "When a dialog opens, screen readers announce its name so people know what popped up. Without a name they only hear \"dialog\".",
      "Quando um diálogo abre, leitores de tela anunciam o nome dele para que as pessoas saibam o que apareceu. Sem nome elas ouvem só \"diálogo\".",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        const role = ctx.dom.role(el);
        if (role !== "dialog" && role !== "alertdialog") continue;
        if (ctx.dom.name(el)) continue;
        if (ctx.dom.isHidden(el) && !(el.localName === "dialog")) continue;
        const heading = el.querySelector("h1, h2, h3, h4, h5, h6, [role=heading]");
        const headingId = heading?.getAttribute("id");
        if (heading && headingId) {
          ctx.report({
            el,
            message: t("This dialog has no name, but it has a heading with an id.", "Este diálogo não tem nome, mas tem um título com id."),
            fix: {
              summary: t("Point aria-labelledby at the heading.", "Aponte aria-labelledby para o título."),
              ops: [{ op: "set-attr", name: "aria-labelledby", value: headingId }],
              safe: true,
            },
          });
          continue;
        }
        const text = heading ? clean(heading.textContent ?? "") : "";
        ctx.report({
          el,
          message: t("This dialog has no accessible name.", "Este diálogo não tem nome acessível."),
          fix: {
            summary: t("Add aria-labelledby pointing to the dialog heading, or an aria-label.", "Adicione aria-labelledby apontando para o título do diálogo, ou um aria-label."),
            ops: [{ op: "set-attr", name: "aria-label", value: text || "Dialog title" }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "aria-widget-name",
    title: t("Custom control without a name", "Controle personalizado sem nome"),
    explanation: t(
      "Custom controls built from <div> or <span> with an ARIA role (a switch, a tab, a slider, a menu item) need a name, or screen readers announce the role with nothing to identify it.",
      "Controles personalizados feitos com <div> ou <span> e um role ARIA (um switch, uma aba, um slider, um item de menu) precisam de nome, senão leitores de tela anunciam o role sem nada que o identifique.",
    ),
    affects: t("Screen reader and voice control users.", "Usuários de leitores de tela e de controle por voz."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["aria", "forms"],
    run(ctx) {
      const roles = new Set([
        "checkbox",
        "combobox",
        "listbox",
        "menuitem",
        "menuitemcheckbox",
        "menuitemradio",
        "meter",
        "option",
        "progressbar",
        "radio",
        "scrollbar",
        "searchbox",
        "slider",
        "spinbutton",
        "switch",
        "tab",
        "textbox",
        "tooltip",
        "tree",
        "treeitem",
        "tabpanel",
      ]);
      for (const el of ctx.elements) {
        const role = ctx.dom.explicitRole(el);
        if (!roles.has(role)) continue;
        if (/^(input|select|textarea|button|meter|progress)$/.test(el.localName)) continue;
        if (ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        if (role === "tabpanel") {
          const id = el.getAttribute("id");
          const tab = id ? ctx.doc.querySelector(`[role=tab][aria-controls~="${id}"]`) : null;
          const tabId = tab?.getAttribute("id");
          if (tab && tabId) {
            ctx.report({
              el,
              message: t("This tab panel has no name; its tab has an id.", "Este painel de aba não tem nome; a aba dele tem id."),
              fix: { summary: t("Label the panel with its tab.", "Rotule o painel com a aba."), ops: [{ op: "set-attr", name: "aria-labelledby", value: tabId }], safe: true },
            });
            continue;
          }
        }
        const hint = iconHint(el) ?? t("Describe the control", "Descreva o controle");
        ctx.report({
          el,
          message: t(`This element has role="${role}" but no name.`, `Este elemento tem role="${role}" mas não tem nome.`),
          fix: {
            summary: t("Add an aria-label, or aria-labelledby pointing to the visible label.", "Adicione um aria-label, ou aria-labelledby apontando para o rótulo visível."),
            ops: [{ op: "set-attr", name: "aria-label", value: hint.en }],
            safe: false,
          },
        });
      }
    },
  },
];
