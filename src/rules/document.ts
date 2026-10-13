import { clean, escapeText } from "../dom";
import { t, type Rule } from "../engine";
import { detectLanguage, isValidLang, repairLang } from "./helpers";

/** Rewrites a viewport content value so pinch zoom works: drops user-scalable=no and low maximum-scale. */
export function repairViewport(content: string): string {
  return content
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter((p) => {
      const [k, v = ""] = p.split("=").map((x) => x.trim().toLowerCase());
      if (k === "user-scalable" && (v === "no" || v === "0")) return false;
      if (k === "maximum-scale" && parseFloat(v) < 2) return false;
      return p.length > 0;
    })
    .join(", ");
}

export const documentRules: Rule[] = [
  {
    id: "html-has-lang",
    title: t("Page language is not set", "Idioma da página não definido"),
    explanation: t(
      "Screen readers pick a voice and pronunciation from the lang attribute. Without it, a Portuguese page may be read with an English accent and become hard to understand. Browsers also use it for translation and hyphenation.",
      "Leitores de tela escolhem a voz e a pronúncia pelo atributo lang. Sem ele, uma página em português pode ser lida com sotaque inglês e ficar difícil de entender. Navegadores também usam o lang para tradução e hifenização.",
    ),
    affects: t("Screen reader users, people using translation tools and braille display users.", "Usuários de leitores de tela, de ferramentas de tradução e de linhas braille."),
    severity: "serious",
    wcag: ["3.1.1"],
    level: "A",
    page: true,
    tags: ["language"],
    run(ctx) {
      const html = ctx.doc.documentElement;
      if (!html || html.getAttribute("lang")?.trim() || html.getAttribute("xml:lang")?.trim()) return;
      const detected = detectLanguage(ctx.doc.body?.textContent ?? "");
      const lang = detected ?? ctx.options.defaultLang ?? "en";
      const sure = !!detected || !!ctx.options.defaultLang;
      ctx.report({
        el: html,
        message: detected
          ? t(`The <html> element has no lang attribute. The text looks like "${detected}".`, `O elemento <html> não tem atributo lang. O texto parece estar em "${detected}".`)
          : t("The <html> element has no lang attribute.", "O elemento <html> não tem atributo lang."),
        fix: {
          summary: t(`Add lang="${lang}" (use the main language of the page).`, `Adicione lang="${lang}" (use o idioma principal da página).`),
          ops: [{ op: "set-attr", name: "lang", value: lang }],
          safe: sure,
        },
        data: { detected },
      });
    },
  },
  {
    id: "html-lang-valid",
    title: t("Page language code is invalid", "Código de idioma da página inválido"),
    explanation: t(
      "The lang attribute must be a language code like \"en\", \"pt-BR\" or \"es\". Values like \"english\" or \"pt_BR\" are not understood, so screen readers fall back to their default voice.",
      "O atributo lang deve ser um código de idioma como \"en\", \"pt-BR\" ou \"es\". Valores como \"portuguese\" ou \"pt_BR\" não são entendidos, e os leitores de tela voltam para a voz padrão.",
    ),
    affects: t("Screen reader and braille users.", "Usuários de leitores de tela e de braille."),
    severity: "serious",
    wcag: ["3.1.1"],
    level: "A",
    page: true,
    tags: ["language"],
    run(ctx) {
      const html = ctx.doc.documentElement;
      const value = html?.getAttribute("lang");
      if (!html || !value?.trim() || isValidLang(value)) return;
      const repaired = repairLang(value);
      ctx.report({
        el: html,
        message: t(`lang="${value}" is not a valid language code.`, `lang="${value}" não é um código de idioma válido.`),
        fix: {
          summary: repaired
            ? t(`Use lang="${repaired}".`, `Use lang="${repaired}".`)
            : t("Use a BCP 47 code such as en, en-US, pt-BR or es.", "Use um código BCP 47 como en, en-US, pt-BR ou es."),
          ops: [{ op: "set-attr", name: "lang", value: repaired ?? "en" }],
          safe: !!repaired,
        },
      });
    },
  },
  {
    id: "valid-lang",
    title: t("Invalid language on part of the page", "Idioma inválido em parte da página"),
    explanation: t(
      "Quotes or sections in another language should carry their own lang attribute so they are pronounced correctly. The code must be valid for that to work.",
      "Citações ou trechos em outro idioma devem ter o próprio atributo lang para serem pronunciados corretamente. O código precisa ser válido para isso funcionar.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "moderate",
    wcag: ["3.1.2"],
    level: "AA",
    tags: ["language"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el === ctx.doc.documentElement) continue;
        const value = el.getAttribute("lang");
        if (value === null || value.trim() === "" || isValidLang(value)) continue;
        const repaired = repairLang(value);
        ctx.report({
          el,
          message: t(`lang="${value}" is not a valid language code.`, `lang="${value}" não é um código de idioma válido.`),
          fix: {
            summary: repaired ? t(`Use lang="${repaired}".`, `Use lang="${repaired}".`) : t("Use a valid BCP 47 code.", "Use um código BCP 47 válido."),
            ops: [{ op: "set-attr", name: "lang", value: repaired ?? "en" }],
            safe: !!repaired,
          },
        });
      }
    },
  },
  {
    id: "document-title",
    title: t("Page has no title", "Página sem título"),
    explanation: t(
      "The <title> is the first thing a screen reader announces and the name shown in tabs, bookmarks and search results. Without it people cannot tell pages apart.",
      "O <title> é a primeira coisa que o leitor de tela anuncia e o nome que aparece nas abas, favoritos e resultados de busca. Sem ele as pessoas não distinguem as páginas.",
    ),
    affects: t("Screen reader users, people with many tabs open and people with memory difficulties.", "Usuários de leitores de tela, quem tem muitas abas abertas e pessoas com dificuldades de memória."),
    severity: "serious",
    wcag: ["2.4.2"],
    level: "A",
    page: true,
    tags: ["structure"],
    run(ctx) {
      const title = ctx.doc.querySelector("title");
      if (title && clean(title.textContent ?? "")) return;
      const h1 = ctx.doc.querySelector("h1");
      const text = h1 ? clean(h1.textContent ?? "") : "";
      const head = ctx.doc.head;
      if (!head) return;
      if (title) {
        ctx.report({
          el: title,
          message: t("The <title> element is empty.", "O elemento <title> está vazio."),
          fix: {
            summary: t("Write a title that says what the page is, then the site name.", "Escreva um título que diga o que é a página, seguido do nome do site."),
            ops: [{ op: "append", html: escapeText(text || "Page name") }],
            safe: !!text,
          },
        });
        return;
      }
      ctx.report({
        el: head,
        message: t("The page has no <title> element.", "A página não tem elemento <title>."),
        fix: {
          summary: text
            ? t(`Add a <title>. The main heading suggests "${text}".`, `Adicione um <title>. O título principal sugere "${text}".`)
            : t("Add a <title> that says what the page is.", "Adicione um <title> que diga o que é a página."),
          ops: [{ op: "prepend", html: `<title>${escapeText(text || "Page name")}</title>` }],
          safe: !!text,
        },
      });
    },
  },
  {
    id: "meta-viewport",
    title: t("Zoom is disabled", "Zoom desativado"),
    explanation: t(
      "user-scalable=no or a low maximum-scale in the viewport meta tag stops people from pinching to zoom on phones. People with low vision rely on zoom to read.",
      "user-scalable=no ou um maximum-scale baixo na meta tag viewport impedem que as pessoas usem o gesto de pinça para dar zoom no celular. Pessoas com baixa visão dependem do zoom para ler.",
    ),
    affects: t("People with low vision and older adults on phones and tablets.", "Pessoas com baixa visão e idosos em celulares e tablets."),
    severity: "critical",
    wcag: ["1.4.4"],
    level: "AA",
    tags: ["structure"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "meta" || el.getAttribute("name")?.toLowerCase() !== "viewport") continue;
        const content = el.getAttribute("content") ?? "";
        const repaired = repairViewport(content);
        if (repaired === content.split(/[,;]/).map((p) => p.trim()).filter(Boolean).join(", ")) continue;
        ctx.report({
          el,
          message: t(`The viewport "${content}" blocks pinch zoom.`, `O viewport "${content}" bloqueia o zoom por pinça.`),
          fix: {
            summary: t("Remove user-scalable=no and maximum-scale below 2.", "Remova user-scalable=no e maximum-scale abaixo de 2."),
            ops: [{ op: "set-attr", name: "content", value: repaired || "width=device-width, initial-scale=1" }],
            safe: true,
          },
        });
      }
    },
  },
  {
    id: "meta-refresh",
    title: t("Page refreshes or redirects on a timer", "Página atualiza ou redireciona com tempo"),
    explanation: t(
      "A meta refresh reloads or leaves the page after a delay. People who read slowly, or who are in the middle of a form, lose their place without warning.",
      "Um meta refresh recarrega ou sai da página depois de um tempo. Quem lê devagar, ou está no meio de um formulário, perde o lugar sem aviso.",
    ),
    affects: t("Screen reader users, people who read slowly and people with cognitive disabilities.", "Usuários de leitores de tela, quem lê devagar e pessoas com deficiências cognitivas."),
    severity: "critical",
    wcag: ["2.2.1"],
    level: "A",
    tags: ["structure"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "meta" || el.getAttribute("http-equiv")?.toLowerCase() !== "refresh") continue;
        const delay = parseFloat(el.getAttribute("content") ?? "");
        if (!(delay > 0) || delay > 72000) continue;
        ctx.report({
          el,
          message: t(`The page refreshes after ${delay} seconds.`, `A página atualiza depois de ${delay} segundos.`),
          fix: {
            summary: t("Remove the timed refresh. Redirect on the server, or let people choose when to reload.", "Remova a atualização com tempo. Redirecione no servidor, ou deixe as pessoas escolherem quando recarregar."),
            ops: [{ op: "remove" }],
            safe: false,
          },
        });
      }
    },
  },
];
