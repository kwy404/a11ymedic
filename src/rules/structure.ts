import { LANDMARK_ROLES } from "../aria";
import { clean, escapeText, openTag, snippet } from "../dom";
import { t, type Rule, type RuleContext } from "../engine";
import type { Text } from "../types";

function headings(ctx: RuleContext): Element[] {
  return ctx.elements.filter((el) => ctx.dom.role(el) === "heading" && !ctx.dom.isHiddenFromAT(el));
}

function landmarks(ctx: RuleContext, role: string): Element[] {
  return ctx.elements.filter((el) => ctx.dom.role(el) === role && !ctx.dom.isHiddenFromAT(el));
}

const LANDMARK_LABEL: Record<string, Text> = {
  navigation: { en: "navigation", pt: "navegação" },
  complementary: { en: "related content", pt: "conteúdo relacionado" },
  region: { en: "section", pt: "seção" },
  form: { en: "form", pt: "formulário" },
  search: { en: "search", pt: "pesquisa" },
  banner: { en: "header", pt: "cabeçalho" },
  contentinfo: { en: "footer", pt: "rodapé" },
  main: { en: "main", pt: "principal" },
};

function isLandmark(ctx: RuleContext, el: Element): boolean {
  const role = ctx.dom.role(el);
  if (!LANDMARK_ROLES.has(role)) return false;
  if (role === "form" || role === "region") return !!ctx.dom.name(el);
  return true;
}

export const structureRules: Rule[] = [
  {
    id: "heading-order",
    title: t("Heading level skipped", "Nível de título pulado"),
    explanation: t(
      "Headings work like a table of contents. Screen reader users jump between them and use their levels to understand the outline. Jumping from h2 to h4 suggests a missing section and breaks that outline.",
      "Títulos funcionam como um sumário. Quem usa leitor de tela pula entre eles e usa os níveis para entender a estrutura. Pular de h2 para h4 sugere uma seção faltando e quebra essa estrutura.",
    ),
    affects: t("Screen reader users who navigate by headings, and people with cognitive disabilities who scan the structure.", "Usuários de leitores de tela que navegam por títulos e pessoas com deficiências cognitivas que examinam a estrutura."),
    severity: "moderate",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      let prev = 0;
      for (const h of headings(ctx)) {
        const level = ctx.dom.headingLevel(h);
        if (prev && level > prev + 1) {
          const target = prev + 1;
          const native = /^h[1-6]$/.test(h.localName) && !h.hasAttribute("aria-level");
          ctx.report({
            el: h,
            message: t(`This heading jumps from level ${prev} to level ${level}.`, `Este título pula do nível ${prev} para o nível ${level}.`),
            fix: {
              summary: native
                ? t(`Use <h${target}>. If you chose h${level} for its size, keep the look with a CSS class.`, `Use <h${target}>. Se escolheu h${level} pelo tamanho, mantenha a aparência com uma classe CSS.`)
                : t(`Set aria-level="${target}".`, `Use aria-level="${target}".`),
              ops: native ? [{ op: "rename-tag", tag: `h${target}` }] : [{ op: "set-attr", name: "aria-level", value: String(target) }],
              safe: false,
            },
            data: { from: prev, to: level },
          });
        }
        prev = level;
      }
    },
  },
  {
    id: "page-has-heading-one",
    title: t("Page has no main heading (h1)", "Página sem título principal (h1)"),
    explanation: t(
      "The h1 tells people what the page is about and is where many screen reader users start reading. Without one they have to guess where the content begins.",
      "O h1 diz do que se trata a página e é onde muitos usuários de leitores de tela começam a ler. Sem ele precisam adivinhar onde o conteúdo começa.",
    ),
    affects: t("Screen reader users and people with cognitive disabilities.", "Usuários de leitores de tela e pessoas com deficiências cognitivas."),
    severity: "moderate",
    wcag: ["1.3.1", "2.4.6"],
    level: "A",
    page: true,
    tags: ["structure"],
    run(ctx) {
      const all = headings(ctx);
      if (all.some((h) => ctx.dom.headingLevel(h) === 1)) return;
      const first = all[0];
      const title = clean(ctx.doc.title ?? "") || "Page title";
      if (first && /^h[1-6]$/.test(first.localName)) {
        ctx.report({
          el: first,
          message: t("The page has no h1. This is its first heading.", "A página não tem h1. Este é o primeiro título dela."),
          fix: { summary: t("Make the main heading an <h1>.", "Transforme o título principal em <h1>."), ops: [{ op: "rename-tag", tag: "h1" }], safe: false },
        });
        return;
      }
      const host = ctx.doc.querySelector("main") ?? ctx.doc.body;
      if (!host) return;
      ctx.report({
        el: host,
        message: t("The page has no headings at all.", "A página não tem nenhum título."),
        fix: { summary: t("Add an <h1> that says what the page is about.", "Adicione um <h1> que diga do que se trata a página."), ops: [{ op: "prepend", html: `<h1>${escapeText(title)}</h1>` }], safe: false },
      });
    },
  },
  {
    id: "empty-heading",
    title: t("Empty heading", "Título vazio"),
    explanation: t(
      "An empty heading is announced as \"heading\" with nothing after it. It clutters the outline that screen reader users rely on.",
      "Um título vazio é anunciado como \"título\" sem nada depois. Ele polui o sumário em que usuários de leitores de tela confiam.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "moderate",
    wcag: ["1.3.1", "2.4.6"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      for (const h of headings(ctx)) {
        if (ctx.dom.name(h)) continue;
        ctx.report({
          el: h,
          message: t("This heading has no text.", "Este título não tem texto."),
          fix: {
            summary: t("Add text to the heading, or remove the element if it is only used for spacing.", "Adicione texto ao título, ou remova o elemento se ele só serve para espaçamento."),
            ops: [{ op: "append", html: "Section title" }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "landmark-one-main",
    title: t("Page needs exactly one main landmark", "A página precisa de exatamente um landmark main"),
    explanation: t(
      "The <main> element marks the primary content. Screen reader users jump straight to it with one key, skipping headers and menus.",
      "O elemento <main> marca o conteúdo principal. Usuários de leitores de tela pulam direto para ele com uma tecla, ignorando cabeçalhos e menus.",
    ),
    affects: t("Screen reader users and keyboard users with landmark navigation extensions.", "Usuários de leitores de tela e de teclado com extensões de navegação por landmarks."),
    severity: "moderate",
    wcag: ["1.3.1"],
    level: "A",
    page: true,
    tags: ["structure"],
    run(ctx) {
      const mains = landmarks(ctx, "main");
      const body = ctx.doc.body;
      if (!body) return;
      if (mains.length === 0) {
        ctx.report({
          el: body,
          message: t("The page has no <main> element.", "A página não tem elemento <main>."),
          fix: {
            summary: t("Wrap the primary content (not the header, navigation or footer) in <main>.", "Envolva o conteúdo principal (sem o cabeçalho, a navegação ou o rodapé) em <main>."),
            after: `<body>\n  <header>...</header>\n  <main id="main">\n    ...\n  </main>\n  <footer>...</footer>\n</body>`,
            safe: false,
          },
        });
      } else if (mains.length > 1) {
        for (const extra of mains.slice(1)) {
          ctx.report({
            el: extra,
            message: t(`The page has ${mains.length} main landmarks.`, `A página tem ${mains.length} landmarks main.`),
            fix: {
              summary: t("Keep one <main>. Use <section> or <article> for the others.", "Mantenha um <main>. Use <section> ou <article> para os outros."),
              ops: extra.localName === "main" ? [{ op: "rename-tag", tag: "section" }] : [{ op: "remove-attr", name: "role" }],
              safe: false,
            },
          });
        }
      }
    },
  },
  {
    id: "landmark-unique",
    title: t("Landmarks that cannot be told apart", "Landmarks que não se distinguem"),
    explanation: t(
      "When a page has two navigation areas, screen readers list both as \"navigation\". A distinct aria-label (\"Main\", \"Footer\") tells them apart. A page also needs at most one top level header (banner) and footer (contentinfo).",
      "Quando a página tem duas áreas de navegação, leitores de tela listam ambas como \"navegação\". Um aria-label diferente (\"Principal\", \"Rodapé\") as distingue. A página também deve ter no máximo um header (banner) e um footer (contentinfo) de nível principal.",
    ),
    affects: t("Screen reader users who move by landmarks.", "Usuários de leitores de tela que navegam por landmarks."),
    severity: "moderate",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      for (const role of ["banner", "contentinfo"]) {
        const found = landmarks(ctx, role);
        for (const extra of found.slice(1)) {
          ctx.report({
            el: extra,
            message: t(`The page has ${found.length} top level ${LANDMARK_LABEL[role]!.en} landmarks.`, `A página tem ${found.length} landmarks de ${LANDMARK_LABEL[role]!.pt} de nível principal.`),
            fix: {
              summary: t("Keep one, or place the extra one inside <article> or <section>.", "Mantenha um, ou coloque o extra dentro de <article> ou <section>."),
              ops: extra.localName === "header" || extra.localName === "footer" ? [{ op: "rename-tag", tag: "div" }] : [{ op: "remove-attr", name: "role" }],
              safe: false,
            },
          });
        }
      }
      for (const role of ["navigation", "complementary", "region", "form", "search"]) {
        const found = landmarks(ctx, role).filter((el) => role !== "region" || ctx.dom.name(el));
        if (found.length < 2) continue;
        const byName = new Map<string, Element[]>();
        for (const el of found) {
          const key = ctx.dom.name(el).toLowerCase();
          byName.set(key, [...(byName.get(key) ?? []), el]);
        }
        for (const [name, list] of byName) {
          if (list.length < 2) continue;
          list.forEach((el, i) => {
            const where = el.closest("footer") ? "Footer" : el.closest("header") ? "Main" : i === 0 ? "Main" : `Secondary ${i}`;
            const label = role === "navigation" ? where : `${where} ${LANDMARK_LABEL[role]!.en}`;
            ctx.report({
              el,
              message: name
                ? t(`${list.length} ${LANDMARK_LABEL[role]!.en} landmarks share the name "${name}".`, `${list.length} landmarks de ${LANDMARK_LABEL[role]!.pt} têm o mesmo nome "${name}".`)
                : t(`${list.length} ${LANDMARK_LABEL[role]!.en} landmarks have no name to tell them apart.`, `${list.length} landmarks de ${LANDMARK_LABEL[role]!.pt} não têm nome para distingui-los.`),
              fix: {
                summary: t("Give each one a short, distinct aria-label.", "Dê a cada um um aria-label curto e diferente."),
                ops: [{ op: "set-attr", name: "aria-label", value: label }],
                safe: false,
              },
            });
          });
        }
      }
    },
  },
  {
    id: "region",
    title: t("Content outside of landmarks", "Conteúdo fora dos landmarks"),
    explanation: t(
      "When all content lives inside header, nav, main, aside or footer, screen reader users can jump between areas and nothing gets missed. Content outside any landmark is easy to skip by accident.",
      "Quando todo o conteúdo está dentro de header, nav, main, aside ou footer, quem usa leitor de tela pode pular entre as áreas e nada se perde. Conteúdo fora de qualquer landmark é fácil de pular sem querer.",
    ),
    affects: t("Screen reader users who navigate by landmarks.", "Usuários de leitores de tela que navegam por landmarks."),
    severity: "moderate",
    wcag: ["1.3.1"],
    level: "A",
    page: true,
    tags: ["structure"],
    run(ctx) {
      const body = ctx.doc.body;
      if (!body) return;
      const hasContent = (el: Element): boolean => {
        if (ctx.dom.isHidden(el) || isLandmark(ctx, el)) return false;
        for (const c of Array.from(el.childNodes)) {
          if (c.nodeType === 3 && clean(c.nodeValue ?? "")) return true;
          if (c.nodeType === 1) {
            const e = c as Element;
            if (/^(script|style|template|noscript)$/.test(e.localName)) continue;
            if (e.localName === "img" && !ctx.dom.isHidden(e) && e.getAttribute("alt") !== "") return true;
            if (/^(input|select|textarea|button|iframe|video|audio)$/.test(e.localName) && !ctx.dom.isHidden(e)) return true;
            if (hasContent(e)) return true;
          }
        }
        return false;
      };
      // With no landmarks at all, landmark-one-main already reports the page once.
      if (!ctx.elements.some((el) => isLandmark(ctx, el) && !ctx.dom.isHidden(el))) return;
      const visit = (el: Element): void => {
        for (const child of Array.from(el.children)) {
          if (ctx.dom.isHidden(child) || isLandmark(ctx, child) || ctx.dom.isHiddenFromAT(child)) continue;
          if (/^(script|style|template|noscript)$/.test(child.localName)) continue;
          if (child.localName === "a" && (child.getAttribute("href") ?? "").startsWith("#")) continue;
          if (ctx.dom.role(child) === "dialog" || ctx.dom.role(child) === "alertdialog") continue;
          if (!hasContent(child)) continue;
          const containsLandmark = Array.from(child.querySelectorAll("*")).some((d) => isLandmark(ctx, d));
          if (containsLandmark) {
            visit(child);
            continue;
          }
          const mainLike = ctx.doc.querySelector("main, [role=main]");
          const before = mainLike ? !!(child.compareDocumentPosition(mainLike) & 4) : true;
          const wrap = mainLike ? (before ? "header" : "footer") : "main";
          ctx.report({
            el: child,
            message: t("This content is not inside any landmark.", "Este conteúdo não está dentro de nenhum landmark."),
            fix: {
              summary: t(`Move it into a landmark such as <${wrap}>.`, `Mova-o para um landmark como <${wrap}>.`),
              after: `<${wrap}>\n  ${snippet(child, 240)}\n</${wrap}>`,
              safe: false,
            },
          });
        }
      };
      visit(body);
    },
  },
  {
    id: "bypass",
    title: t("No way to skip repeated content", "Sem forma de pular conteúdo repetido"),
    explanation: t(
      "Keyboard users have to tab through every menu link on every page unless there is a skip link, a <main> landmark or headings to jump to.",
      "Quem usa teclado precisa passar por todos os links do menu em todas as páginas, a menos que exista um link para pular, um landmark <main> ou títulos para onde saltar.",
    ),
    affects: t("Keyboard users, switch users and screen reader users.", "Usuários de teclado, de acionadores e de leitores de tela."),
    severity: "serious",
    wcag: ["2.4.1"],
    level: "A",
    page: true,
    tags: ["keyboard", "structure"],
    run(ctx) {
      const body = ctx.doc.body;
      if (!body) return;
      if (landmarks(ctx, "main").length || headings(ctx).length) return;
      const skip = Array.from(ctx.doc.querySelectorAll("a[href^='#']")).some((a) => {
        const id = (a.getAttribute("href") ?? "").slice(1);
        return id && ctx.dom.byId(id);
      });
      if (skip) return;
      ctx.report({
        el: body,
        message: t("The page has no main landmark, no headings and no skip link.", "A página não tem landmark main, títulos nem link para pular."),
        fix: {
          summary: t("Add a skip link as the first focusable element and a <main id=\"main\">.", "Adicione um link para pular como primeiro elemento focável e um <main id=\"main\">."),
          ops: [{ op: "prepend", html: '<a class="skip-link" href="#main">Skip to main content</a>' }],
          safe: false,
        },
      });
    },
  },
  {
    id: "skip-link",
    title: t("In-page link points nowhere", "Link interno aponta para lugar nenhum"),
    explanation: t(
      "A link like href=\"#main\" moves focus to the element with that id. If the id does not exist, a skip link does nothing and keyboard users are stuck at the top.",
      "Um link como href=\"#main\" move o foco para o elemento com esse id. Se o id não existe, o link para pular não faz nada e quem usa teclado fica preso no topo.",
    ),
    affects: t("Keyboard and screen reader users.", "Usuários de teclado e de leitores de tela."),
    severity: "moderate",
    wcag: ["2.4.1"],
    level: "A",
    tags: ["keyboard"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "a") continue;
        const href = el.getAttribute("href") ?? "";
        if (!href.startsWith("#") || href.length < 2 || href === "#top" || href.startsWith("#!") || href.startsWith("#/")) continue;
        let id = href.slice(1);
        try {
          id = decodeURIComponent(id);
        } catch {
          // keep raw
        }
        if (ctx.dom.byId(id) || ctx.doc.querySelector(`a[name="${id.replace(/["\\]/g, "\\$&")}"]`)) continue;
        const main = ctx.doc.querySelector("main, [role=main]");
        const mainId = main?.getAttribute("id");
        ctx.report({
          el,
          message: t(`Nothing on the page has id="${id}".`, `Nenhum elemento da página tem id="${id}".`),
          fix: mainId
            ? { summary: t(`Point the link at the main content (#${mainId}).`, `Aponte o link para o conteúdo principal (#${mainId}).`), ops: [{ op: "set-attr", name: "href", value: `#${mainId}` }], safe: false }
            : { summary: t(`Add id="${id}" to the element the link should jump to.`, `Adicione id="${id}" ao elemento para onde o link deve saltar.`), after: `${snippet(el)}\n...\n<main id="${id}">...</main>`, safe: false },
        });
      }
    },
  },
  {
    id: "list",
    title: t("List with invalid children", "Lista com filhos inválidos"),
    explanation: t(
      "Screen readers announce lists with their item count (\"list, 5 items\"). That only works when <ul> and <ol> contain <li> elements directly.",
      "Leitores de tela anunciam listas com a quantidade de itens (\"lista, 5 itens\"). Isso só funciona quando <ul> e <ol> contêm elementos <li> diretamente.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "ul" && el.localName !== "ol") continue;
        if (ctx.dom.explicitRole(el) && ctx.dom.explicitRole(el) !== "list") continue;
        if (ctx.dom.isHiddenFromAT(el)) continue;
        const bad = Array.from(el.children).filter((c) => !/^(li|script|template)$/.test(c.localName) && ctx.dom.explicitRole(c) !== "listitem");
        const strayText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && clean(n.nodeValue ?? ""));
        if (!bad.length && !strayText) continue;
        const items = Array.from(el.children)
          .filter((c) => !/^(script|template)$/.test(c.localName))
          .map((c) => (c.localName === "li" ? snippet(c, 120) : `<li>${snippet(c, 110)}</li>`));
        ctx.report({
          el,
          message: bad.length
            ? t(`This list directly contains <${bad[0]!.localName}>, which is not a list item.`, `Esta lista contém diretamente <${bad[0]!.localName}>, que não é um item de lista.`)
            : t("This list contains loose text outside of <li>.", "Esta lista contém texto solto fora de <li>."),
          fix: {
            summary: t("Wrap every child in <li>.", "Envolva cada filho em <li>."),
            after: `${openTag(el)}\n  ${items.join("\n  ")}\n</${el.localName}>`,
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "listitem",
    title: t("List item outside of a list", "Item de lista fora de uma lista"),
    explanation: t(
      "An <li> must live inside <ul>, <ol> or <menu>. Outside of a list it is not announced as part of a list and its position (\"2 of 4\") is lost.",
      "Um <li> deve estar dentro de <ul>, <ol> ou <menu>. Fora de uma lista ele não é anunciado como parte de uma lista e sua posição (\"2 de 4\") se perde.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "li" || ctx.dom.explicitRole(el) || ctx.dom.isHiddenFromAT(el)) continue;
        const parent = el.parentElement;
        if (!parent) continue;
        if (/^(ul|ol|menu)$/.test(parent.localName) || ctx.dom.explicitRole(parent) === "list") continue;
        ctx.report({
          el,
          message: t(`This <li> is inside <${parent.localName}>, not a list.`, `Este <li> está dentro de <${parent.localName}>, não de uma lista.`),
          fix: { summary: t("Wrap the items in <ul> (or <ol> when order matters).", "Envolva os itens em <ul> (ou <ol> quando a ordem importa)."), after: `<ul>\n  ${snippet(el, 200)}\n</ul>`, safe: false },
        });
      }
    },
  },
  {
    id: "definition-list",
    title: t("Definition list with invalid structure", "Lista de definição com estrutura inválida"),
    explanation: t(
      "A <dl> pairs terms (<dt>) with descriptions (<dd>). Other elements inside, or <dt> and <dd> outside a <dl>, break the pairing that screen readers announce.",
      "Uma <dl> combina termos (<dt>) com descrições (<dd>). Outros elementos dentro dela, ou <dt> e <dd> fora de uma <dl>, quebram a relação que os leitores de tela anunciam.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (ctx.dom.isHiddenFromAT(el)) continue;
        if (el.localName === "dl" && !ctx.dom.explicitRole(el)) {
          const bad = Array.from(el.children).find(
            (c) => !/^(dt|dd|script|template)$/.test(c.localName) && !(c.localName === "div" && Array.from(c.children).every((g) => /^(dt|dd|script|template)$/.test(g.localName))),
          );
          if (bad) {
            ctx.report({
              el,
              message: t(`This <dl> directly contains <${bad.localName}>.`, `Esta <dl> contém diretamente <${bad.localName}>.`),
              fix: { summary: t("Only put <dt>, <dd> (or a <div> grouping them) inside <dl>.", "Coloque só <dt>, <dd> (ou uma <div> agrupando-os) dentro de <dl>."), after: `${openTag(el)}\n  <dt>Term</dt>\n  <dd>Description</dd>\n</dl>`, safe: false },
            });
          }
        }
        if (el.localName === "dt" || el.localName === "dd") {
          const p = el.parentElement;
          const ok = p && (p.localName === "dl" || (p.localName === "div" && p.parentElement?.localName === "dl"));
          if (!ok) {
            ctx.report({
              el,
              message: t(`This <${el.localName}> is not inside a <dl>.`, `Este <${el.localName}> não está dentro de uma <dl>.`),
              fix: { summary: t("Wrap the terms and descriptions in <dl>.", "Envolva os termos e descrições em <dl>."), after: `<dl>\n  ${snippet(el, 200)}\n</dl>`, safe: false },
            });
          }
        }
      }
    },
  },
  {
    id: "duplicate-id",
    title: t("Duplicate id", "Id duplicado"),
    explanation: t(
      "An id must be unique. Labels, aria-labelledby, aria-describedby and skip links find their target by id, so a duplicate makes them point at the wrong element, often silently.",
      "Um id deve ser único. Labels, aria-labelledby, aria-describedby e links para pular encontram o alvo pelo id, então uma duplicata faz com que apontem para o elemento errado, muitas vezes sem aviso.",
    ),
    affects: t("Screen reader users, who may hear the wrong label or description.", "Usuários de leitores de tela, que podem ouvir o rótulo ou a descrição errados."),
    severity: "minor",
    wcag: ["4.1.2", "1.3.1"],
    level: "A",
    tags: ["aria", "structure"],
    run(ctx) {
      const referenced = new Set<string>();
      for (const el of Array.from(ctx.doc.querySelectorAll("[for], [aria-labelledby], [aria-describedby], [aria-controls], [aria-owns], [aria-activedescendant], [aria-errormessage], [aria-details], [headers], [list]"))) {
        for (const attr of ["for", "aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant", "aria-errormessage", "aria-details", "headers", "list"]) {
          for (const id of (el.getAttribute(attr) ?? "").split(/\s+/)) if (id) referenced.add(id);
        }
      }
      const seen = new Map<string, number>();
      for (const el of ctx.elements) {
        const id = el.getAttribute("id");
        if (!id) continue;
        const n = (seen.get(id) ?? 0) + 1;
        seen.set(id, n);
        if (n < 2) continue;
        const isRef = referenced.has(id);
        ctx.report({
          el,
          severity: isRef ? "serious" : "minor",
          message: isRef
            ? t(`id="${id}" is used ${ctx.dom.idFrequency(id)} times and a label or ARIA attribute points to it.`, `id="${id}" é usado ${ctx.dom.idFrequency(id)} vezes e um rótulo ou atributo ARIA aponta para ele.`)
            : t(`id="${id}" is used ${ctx.dom.idFrequency(id)} times.`, `id="${id}" é usado ${ctx.dom.idFrequency(id)} vezes.`),
          fix: {
            summary: t("Give this element its own id and update anything that should point to it.", "Dê a este elemento um id próprio e atualize o que deve apontar para ele."),
            ops: [{ op: "set-attr", name: "id", value: `${id}-${n}` }],
            safe: false,
          },
        });
      }
    },
  },
];
