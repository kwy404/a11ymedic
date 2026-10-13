import type { Dom } from "../dom";
import { clean } from "../dom";
import { t, type Rule } from "../engine";
import type { Text } from "../types";
import { hrefHint, humanize, iconHint } from "./helpers";

/** Why an image without alt looks decorative, or null when it probably carries information. */
export function decorativeReason(_dom: Dom, img: Element): Text | null {
  const w = parseFloat(img.getAttribute("width") ?? "");
  const h = parseFloat(img.getAttribute("height") ?? "");
  if (w <= 2 && h <= 2) return t("it is a 1 by 1 tracking pixel or spacer", "é um pixel de rastreamento ou espaçador de 1 por 1");
  const src = img.getAttribute("src") ?? "";
  const cls = img.getAttribute("class") ?? "";
  if (/(^|[/_.-])(spacer|blank|pixel|divider|separator|decor|decoration|ornament|flourish|shadow|swirl|pattern|texture|bg|background)([/_.-]|$)/i.test(src)) {
    return t("its file name says it is decoration", "o nome do arquivo indica que é decoração");
  }
  if (/\b(decor\w*|ornament\w*|divider|separator|bg|background)\b/i.test(cls)) {
    return t("its class says it is decoration", "a classe indica que é decoração");
  }
  const control = img.parentElement?.closest("a[href], button");
  if (control) {
    const clone = control.cloneNode(true) as Element;
    for (const i of Array.from(clone.querySelectorAll("img"))) i.remove();
    if (clean(clone.textContent ?? "").length > 1) {
      return t("the link or button already has text that says the same thing", "o link ou botão já tem um texto que diz a mesma coisa");
    }
  }
  return null;
}

/** A starting point for alt text, taken from the context of the image. */
function altSuggestion(img: Element): Text {
  const control = img.parentElement?.closest("a[href], button");
  if (control) {
    const hint = iconHint(img) ?? hrefHint(control.getAttribute("href"));
    if (hint) return hint;
  }
  const caption = img.closest("figure")?.querySelector("figcaption");
  if (caption && clean(caption.textContent ?? "")) {
    const c = clean(caption.textContent ?? "");
    return { en: c, pt: c };
  }
  const title = img.getAttribute("title");
  if (title && clean(title)) return { en: clean(title), pt: clean(title) };
  const name = humanize(img.getAttribute("src") ?? "");
  if (name) return { en: name, pt: name };
  return t("Describe what the image shows", "Descreva o que a imagem mostra");
}

export const imageRules: Rule[] = [
  {
    id: "image-alt",
    title: t("Image without alt text", "Imagem sem texto alternativo"),
    explanation: t(
      "Screen readers cannot see images. Without an alt attribute they read the file name (for example \"IMG_2041.jpg\") or skip the image, so the information in it is lost. Informative images need a short description; decorative images need an empty alt=\"\" so they are skipped.",
      "Leitores de tela não enxergam imagens. Sem o atributo alt eles leem o nome do arquivo (por exemplo \"IMG_2041.jpg\") ou pulam a imagem, e a informação se perde. Imagens informativas precisam de uma descrição curta; imagens decorativas precisam de alt=\"\" vazio para serem ignoradas.",
    ),
    affects: t(
      "Blind people using screen readers, people who turn images off to save data, and anyone when the image fails to load.",
      "Pessoas cegas que usam leitores de tela, quem desliga imagens para economizar dados e todos quando a imagem não carrega.",
    ),
    severity: "critical",
    wcag: ["1.1.1"],
    level: "A",
    tags: ["images"],
    run(ctx) {
      for (const img of ctx.elements) {
        if (img.localName !== "img" || img.hasAttribute("alt")) continue;
        if (ctx.dom.isHiddenFromAT(img)) continue;
        const role = ctx.dom.explicitRole(img);
        if (role === "none" || role === "presentation") continue;
        if (img.getAttribute("aria-label")?.trim() || ctx.dom.idrefs(img, "aria-labelledby").length) continue;
        const reason = decorativeReason(ctx.dom, img);
        if (reason) {
          ctx.report({
            el: img,
            message: t(`This image has no alt attribute. It looks decorative because ${reason.en}.`, `Esta imagem não tem atributo alt. Ela parece decorativa porque ${reason.pt}.`),
            fix: {
              summary: t("Add an empty alt so screen readers skip it.", "Adicione um alt vazio para que leitores de tela a ignorem."),
              ops: [{ op: "set-attr", name: "alt", value: "" }],
              safe: true,
            },
            data: { decorative: true },
          });
        } else {
          const suggestion = altSuggestion(img);
          ctx.report({
            el: img,
            message: t("This image has no alt attribute, so its content is invisible to screen reader users.", "Esta imagem não tem atributo alt, então o conteúdo dela é invisível para quem usa leitor de tela."),
            fix: {
              summary: t(
                `Describe what the image shows or does in a few words. Starting point: "${suggestion.en}". If it is only decoration, use alt="" instead.`,
                `Descreva em poucas palavras o que a imagem mostra ou faz. Ponto de partida: "${suggestion.pt}". Se for só decoração, use alt="".`,
              ),
              ops: [{ op: "set-attr", name: "alt", value: suggestion.en }],
              safe: false,
            },
            data: { decorative: false },
          });
        }
      }
    },
  },
  {
    id: "image-alt-quality",
    title: t("Alt text that does not help", "Texto alternativo que não ajuda"),
    explanation: t(
      "Alt text is read aloud instead of the image. A file name, a placeholder like \"image\", or a phrase like \"picture of\" wastes time and says nothing about what matters in the picture.",
      "O texto alternativo é lido no lugar da imagem. Um nome de arquivo, um texto genérico como \"imagem\" ou uma frase como \"foto de\" tomam tempo e não dizem o que importa na imagem.",
    ),
    affects: t("Screen reader users, who hear the alt text instead of seeing the image.", "Usuários de leitores de tela, que ouvem o texto alternativo em vez de ver a imagem."),
    severity: "moderate",
    wcag: ["1.1.1"],
    level: "A",
    tags: ["images"],
    run(ctx) {
      for (const img of ctx.elements) {
        if (img.localName !== "img" && !(img.localName === "input" && img.getAttribute("type")?.toLowerCase() === "image")) continue;
        const alt = img.getAttribute("alt");
        if (!alt || !alt.trim() || ctx.dom.isHiddenFromAT(img)) continue;
        const a = clean(alt);
        const src = (img.getAttribute("src") ?? "").split(/[?#]/)[0]!.split("/").pop() ?? "";
        if (/\.(jpe?g|png|gif|svg|webp|avif|bmp)$/i.test(a) || (src && a.toLowerCase() === src.toLowerCase()) || /^(img|dsc|image|photo)[-_]?\d+$/i.test(a)) {
          const suggestion = humanize(a) || "Describe the image";
          ctx.report({
            el: img,
            message: t(`The alt text "${a}" is a file name.`, `O texto alternativo "${a}" é um nome de arquivo.`),
            fix: {
              summary: t("Replace the file name with a description of what the image shows.", "Troque o nome do arquivo por uma descrição do que a imagem mostra."),
              ops: [{ op: "set-attr", name: "alt", value: suggestion }],
              safe: false,
            },
          });
          continue;
        }
        if (/^(image|img|photo|picture|pic|graphic|icon|logo|banner|spacer|untitled|alt|null|undefined|imagem|foto|figura|\u00edcone|\d+)$/i.test(a)) {
          ctx.report({
            el: img,
            message: t(`The alt text "${a}" is a placeholder that says nothing about the image.`, `O texto alternativo "${a}" é genérico e não diz nada sobre a imagem.`),
            fix: {
              summary: t("Write what the image shows, or use alt=\"\" if it is decoration.", "Escreva o que a imagem mostra, ou use alt=\"\" se for decoração."),
              ops: [{ op: "set-attr", name: "alt", value: "Describe the image" }],
              safe: false,
            },
          });
          continue;
        }
        const prefix = /^(an? )?(image|picture|photo|photograph|graphic|icon|imagem|foto|figura)( of| de| da| do|:)\s+/i.exec(a);
        if (prefix) {
          const rest = a.slice(prefix[0].length);
          const fixed = rest.charAt(0).toUpperCase() + rest.slice(1);
          ctx.report({
            el: img,
            severity: "minor",
            message: t(`The alt text starts with "${prefix[0].trim()}". Screen readers already announce that it is an image.`, `O texto alternativo começa com "${prefix[0].trim()}". Leitores de tela já anunciam que é uma imagem.`),
            fix: {
              summary: t("Remove the redundant prefix.", "Remova o prefixo redundante."),
              ops: [{ op: "set-attr", name: "alt", value: fixed }],
              safe: true,
            },
          });
          continue;
        }
        const control = img.parentElement?.closest("a[href], button");
        if (control) {
          const clone = control.cloneNode(true) as Element;
          for (const i of Array.from(clone.querySelectorAll("img"))) i.remove();
          const text = clean(clone.textContent ?? "");
          if (text && text.toLowerCase() === a.toLowerCase()) {
            ctx.report({
              el: img,
              severity: "minor",
              message: t(`The alt text repeats the text next to it ("${a}"), so it is read twice.`, `O texto alternativo repete o texto ao lado ("${a}"), então é lido duas vezes.`),
              fix: {
                summary: t("Use an empty alt: the text already names the link.", "Use alt vazio: o texto já dá nome ao link."),
                ops: [{ op: "set-attr", name: "alt", value: "" }],
                safe: true,
              },
            });
            continue;
          }
        }
        if (a.length > 150) {
          ctx.report({
            el: img,
            severity: "minor",
            message: t(`The alt text is ${a.length} characters long. Long alt text cannot be paused or navigated.`, `O texto alternativo tem ${a.length} caracteres. Textos longos não podem ser pausados nem navegados.`),
            fix: {
              summary: t("Keep alt short and put the long description in visible text or a figcaption linked with aria-describedby.", "Mantenha o alt curto e coloque a descrição longa em texto visível ou em uma figcaption ligada com aria-describedby."),
              ops: [{ op: "set-attr", name: "alt", value: a.slice(0, 100).replace(/\s+\S*$/, "") }],
              safe: false,
            },
          });
        }
      }
    },
  },
  {
    id: "input-image-alt",
    title: t("Image button without text", "Botão de imagem sem texto"),
    explanation: t(
      "An <input type=\"image\"> is a button drawn with a picture. Without alt text, screen readers announce only \"button\" and nobody knows what it does.",
      "Um <input type=\"image\"> é um botão desenhado com uma imagem. Sem texto alternativo, leitores de tela anunciam apenas \"botão\" e ninguém sabe o que ele faz.",
    ),
    affects: t("Screen reader and voice control users, who need the button name to find and press it.", "Usuários de leitores de tela e de controle por voz, que precisam do nome do botão para encontrá-lo e acioná-lo."),
    severity: "critical",
    wcag: ["1.1.1", "4.1.2"],
    level: "A",
    tags: ["images", "forms"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "input" || el.getAttribute("type")?.toLowerCase() !== "image") continue;
        if (ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        const hint = iconHint(el) ?? (el.closest("form")?.querySelector("input[type=search], [role=search]") ? t("Search", "Pesquisar") : t("Submit", "Enviar"));
        ctx.report({
          el,
          message: t("This image button has no alt text, so it has no name.", "Este botão de imagem não tem texto alternativo, então não tem nome."),
          fix: {
            summary: t(`Add alt text that says what the button does, for example "${hint.en}".`, `Adicione um alt que diga o que o botão faz, por exemplo "${hint.pt}".`),
            ops: [{ op: "set-attr", name: "alt", value: hint.en }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "area-alt",
    title: t("Image map area without text", "Área de mapa de imagem sem texto"),
    explanation: t(
      "Each clickable area of an image map is a link. Without alt text the link has no name and screen readers read the URL or nothing at all.",
      "Cada área clicável de um mapa de imagem é um link. Sem texto alternativo o link fica sem nome e leitores de tela leem a URL ou nada.",
    ),
    affects: t("Screen reader users, who hear links without names.", "Usuários de leitores de tela, que ouvem links sem nome."),
    severity: "critical",
    wcag: ["1.1.1", "2.4.4", "4.1.2"],
    level: "A",
    tags: ["images"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "area" || !el.hasAttribute("href")) continue;
        const map = el.closest("map");
        const name = map?.getAttribute("name");
        const used = name ? ctx.doc.querySelector(`img[usemap="#${CSS_escape(name)}"]`) : null;
        if (used && ctx.dom.isHiddenFromAT(used)) continue;
        if (clean(el.getAttribute("alt") ?? "") || el.getAttribute("aria-label")?.trim() || ctx.dom.idrefs(el, "aria-labelledby").length) continue;
        const hint = hrefHint(el.getAttribute("href")) ?? t("Describe the link destination", "Descreva o destino do link");
        ctx.report({
          el,
          message: t("This image map area is a link without a name.", "Esta área do mapa de imagem é um link sem nome."),
          fix: {
            summary: t(`Add alt text that says where the area leads, for example "${hint.en}".`, `Adicione um alt que diga para onde a área leva, por exemplo "${hint.pt}".`),
            ops: [{ op: "set-attr", name: "alt", value: hint.en }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "role-img-alt",
    title: t("Graphic without a name", "Gráfico sem nome"),
    explanation: t(
      "Elements with role=\"img\" (often inline SVG icons and charts) are announced as images. Without a name, screen readers say \"image\" and nothing else.",
      "Elementos com role=\"img\" (muitas vezes ícones SVG e gráficos) são anunciados como imagens. Sem nome, leitores de tela dizem apenas \"imagem\".",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["1.1.1"],
    level: "A",
    tags: ["images", "aria"],
    run(ctx) {
      for (const el of ctx.elements) {
        const role = ctx.dom.explicitRole(el);
        if (role !== "img" && role !== "image" && role !== "graphics-document" && role !== "graphics-symbol") continue;
        if (el.localName === "img" || ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        const hint = iconHint(el) ?? t("Describe the graphic", "Descreva o gráfico");
        ctx.report({
          el,
          message: t(`This element has role="${role}" but no accessible name.`, `Este elemento tem role="${role}" mas não tem nome acessível.`),
          fix: {
            summary: t(
              `Name it with aria-label (or a <title> inside the SVG). If it is decoration, use aria-hidden="true" instead. Suggestion: "${hint.en}".`,
              `Dê um nome com aria-label (ou um <title> dentro do SVG). Se for decoração, use aria-hidden="true". Sugestão: "${hint.pt}".`,
            ),
            ops: [{ op: "set-attr", name: "aria-label", value: hint.en }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "object-alt",
    title: t("Embedded object without a text alternative", "Objeto incorporado sem alternativa em texto"),
    explanation: t(
      "Content in <object> (PDFs, old plugins, SVG files) is often invisible to assistive technology. A name or fallback text tells people what it is.",
      "O conteúdo em <object> (PDFs, plugins antigos, arquivos SVG) costuma ser invisível para tecnologias assistivas. Um nome ou texto alternativo diz às pessoas o que é.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["1.1.1"],
    level: "A",
    tags: ["images", "media"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "object" || ctx.dom.isHiddenFromAT(el)) continue;
        if (ctx.dom.name(el) || clean(el.textContent ?? "")) continue;
        const data = el.getAttribute("data") ?? "";
        const guess = humanize(data) || "Describe the embedded content";
        ctx.report({
          el,
          message: t("This <object> has no name and no fallback text.", "Este <object> não tem nome nem texto alternativo."),
          fix: {
            summary: t("Add an aria-label, and fallback content inside the element (for example a download link).", "Adicione um aria-label e um conteúdo alternativo dentro do elemento (por exemplo, um link para download)."),
            ops: [{ op: "set-attr", name: "aria-label", value: guess }],
            safe: false,
          },
        });
      }
    },
  },
];

/** Minimal CSS.escape for attribute selectors (CSS.escape is missing in some runtimes). */
export function CSS_escape(s: string): string {
  return s.replace(/["\\]/g, "\\$&");
}
