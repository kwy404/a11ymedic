import { splitTopLevel } from "../css";
import { clean, escapeAttr, openTag, snippet } from "../dom";
import { t, type Rule } from "../engine";
import type { FixOp } from "../types";
import { cssLocation } from "./keyboard";

const MOVING = /^(transform|translate|rotate|scale|left|right|top|bottom|inset|margin.*|background-position|width|height|offset.*)$/;

function frameTitle(src: string): { en: string; pt: string } {
  if (/youtube\.com|youtu\.be/.test(src)) return { en: "YouTube video", pt: "Vídeo do YouTube" };
  if (/vimeo\.com/.test(src)) return { en: "Vimeo video", pt: "Vídeo do Vimeo" };
  if (/google\.[a-z.]+\/maps|maps\.google/.test(src)) return { en: "Map", pt: "Mapa" };
  if (/spotify\.com/.test(src)) return { en: "Spotify player", pt: "Player do Spotify" };
  if (/(twitter|x)\.com/.test(src)) return { en: "Post on X", pt: "Post no X" };
  const host = /^https?:\/\/([^/]+)/.exec(src)?.[1]?.replace(/^www\./, "");
  return host ? { en: `Embedded content from ${host}`, pt: `Conteúdo incorporado de ${host}` } : { en: "Describe the embedded content", pt: "Descreva o conteúdo incorporado" };
}

export const mediaRules: Rule[] = [
  {
    id: "autoplay-media",
    title: t("Media that plays sound on its own", "Mídia que toca som sozinha"),
    explanation: t(
      "Audio that starts by itself talks over the screen reader, so blind users cannot hear the page to find the stop button. Looping silent video also needs a way to pause it, because movement distracts people with attention disorders.",
      "Um áudio que começa sozinho fala por cima do leitor de tela, e pessoas cegas não conseguem ouvir a página para achar o botão de parar. Um vídeo mudo em loop também precisa de uma forma de pausar, porque o movimento distrai pessoas com transtornos de atenção.",
    ),
    affects: t("Screen reader users, people with attention or anxiety disorders, and people in quiet places.", "Usuários de leitores de tela, pessoas com transtornos de atenção ou ansiedade e quem está em um lugar silencioso."),
    severity: "serious",
    wcag: ["1.4.2", "2.2.2"],
    level: "A",
    tags: ["media"],
    run(ctx) {
      for (const el of ctx.elements) {
        if ((el.localName !== "video" && el.localName !== "audio") || !el.hasAttribute("autoplay")) continue;
        const controls = el.hasAttribute("controls");
        if (!el.hasAttribute("muted")) {
          ctx.report({
            el,
            severity: controls ? "moderate" : "serious",
            message: controls
              ? t("This media starts playing with sound as soon as the page loads.", "Esta mídia começa a tocar com som assim que a página carrega.")
              : t("This media plays sound automatically and has no controls to stop it.", "Esta mídia toca som automaticamente e não tem controles para pará-la."),
            fix: {
              summary: t("Mute it (muted), and show the controls so people can turn sound on when they want.", "Deixe-a muda (muted) e mostre os controles para que as pessoas liguem o som quando quiserem."),
              ops: [{ op: "set-attr", name: "muted", value: "" }],
              safe: true,
            },
          });
          continue;
        }
        if (el.localName === "video" && el.hasAttribute("loop") && !controls && !ctx.dom.isHidden(el)) {
          ctx.report({
            el,
            severity: "moderate",
            message: t("This video loops forever with no way to pause it.", "Este vídeo repete para sempre sem forma de pausar."),
            fix: { summary: t("Add controls (or your own pause button), or stop the loop after 5 seconds.", "Adicione controls (ou um botão de pausa próprio), ou pare o loop depois de 5 segundos."), ops: [{ op: "set-attr", name: "controls", value: "" }], safe: false },
          });
        }
      }
    },
  },
  {
    id: "video-caption",
    title: t("Video without captions", "Vídeo sem legendas"),
    explanation: t(
      "Captions turn speech and important sounds into text. Without a captions track, deaf and hard of hearing people miss everything that is said.",
      "Legendas transformam falas e sons importantes em texto. Sem uma faixa de legendas, pessoas surdas ou com deficiência auditiva perdem tudo o que é dito.",
    ),
    affects: t("Deaf and hard of hearing people, people who watch without sound, and non-native speakers.", "Pessoas surdas ou com deficiência auditiva, quem assiste sem som e quem não é falante nativo."),
    severity: "critical",
    wcag: ["1.2.2"],
    level: "A",
    tags: ["media"],
    run(ctx) {
      const lang = ctx.doc.documentElement?.getAttribute("lang") || "en";
      for (const el of ctx.elements) {
        if (el.localName !== "video" || el.hasAttribute("muted") || ctx.dom.isHiddenFromAT(el)) continue;
        if (el.querySelector("track[kind=captions], track[kind=subtitles], track[kind='captions'], track[kind='subtitles']")) continue;
        ctx.report({
          el,
          message: t("This video has no captions track.", "Este vídeo não tem faixa de legendas."),
          fix: {
            summary: t("Add a WebVTT captions file with a <track kind=\"captions\">.", "Adicione um arquivo de legendas WebVTT com <track kind=\"captions\">."),
            ops: [{ op: "append", html: `<track kind="captions" src="captions.${escapeAttr(lang.split("-")[0]!)}.vtt" srclang="${escapeAttr(lang)}" label="Captions" default>` }],
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "blink-marquee",
    title: t("Blinking or scrolling text", "Texto piscando ou rolando"),
    explanation: t(
      "<marquee> and <blink> move or flash text with no way to stop it. Moving text is hard to read and can make it impossible to focus on the rest of the page.",
      "<marquee> e <blink> movem ou piscam o texto sem forma de parar. Texto em movimento é difícil de ler e pode impedir a concentração no resto da página.",
    ),
    affects: t("People with low vision, dyslexia, attention disorders, and vestibular disorders.", "Pessoas com baixa visão, dislexia, transtornos de atenção e distúrbios vestibulares."),
    severity: "serious",
    wcag: ["2.2.2"],
    level: "A",
    tags: ["motion"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "marquee" && el.localName !== "blink") continue;
        ctx.report({
          el,
          message: t(`<${el.localName}> moves text with no pause control.`, `<${el.localName}> move o texto sem controle de pausa.`),
          fix: { summary: t("Show the text without motion.", "Mostre o texto sem movimento."), ops: [{ op: "rename-tag", tag: el.localName === "marquee" ? "p" : "strong" }], safe: false },
        });
      }
    },
  },
  {
    id: "motion-reduced",
    title: t("Large animation ignores reduced motion", "Animação grande ignora movimento reduzido"),
    explanation: t(
      "People with vestibular disorders can get dizzy or nauseous from motion on screen. Operating systems have a \"reduce motion\" setting, exposed to CSS as prefers-reduced-motion; large or endless animations should stop or calm down when it is on.",
      "Pessoas com distúrbios vestibulares podem sentir tontura ou náusea com movimento na tela. Os sistemas operacionais têm a opção \"reduzir movimento\", exposta no CSS como prefers-reduced-motion; animações grandes ou infinitas devem parar ou se acalmar quando ela está ativa.",
    ),
    affects: t("People with vestibular disorders, migraines, epilepsy or attention disorders.", "Pessoas com distúrbios vestibulares, enxaqueca, epilepsia ou transtornos de atenção."),
    severity: "moderate",
    wcag: ["2.3.3", "2.2.2"],
    level: "A",
    tags: ["motion"],
    run(ctx) {
      if (ctx.css.mediaQueries.some((q) => /prefers-reduced-motion\s*:\s*reduce/i.test(q))) return;
      const keyframes = new Map(ctx.css.keyframes.map((k) => [k.name, k]));
      const reported = new Set<string>();
      for (const rule of ctx.css.rules) {
        if (rule.media.some((m) => /prefers-reduced-motion\s*:\s*no-preference/i.test(m))) continue;
        let names: string[] = [];
        let infinite = false;
        let duration = 0;
        for (const d of rule.declarations) {
          if (d.property === "animation" || d.property === "animation-name") {
            for (const layer of splitTopLevel(d.value, ",")) {
              for (const tok of layer.trim().split(/\s+/)) {
                if (keyframes.has(tok)) names.push(tok);
                if (tok === "infinite") infinite = true;
                const ms = /^([\d.]+)(m?s)$/.exec(tok);
                if (ms) duration = Math.max(duration, parseFloat(ms[1]!) * (ms[2] === "s" ? 1000 : 1));
              }
            }
          }
          if (d.property === "animation-iteration-count" && /infinite/.test(d.value)) infinite = true;
          if (d.property === "animation-duration") {
            const ms = /([\d.]+)(m?s)/.exec(d.value);
            if (ms) duration = Math.max(duration, parseFloat(ms[1]!) * (ms[2] === "s" ? 1000 : 1));
          }
        }
        names = names.filter((n) => !reported.has(n));
        for (const name of names) {
          const kf = keyframes.get(name)!;
          const moves = kf.properties.some((p) => MOVING.test(p));
          if (!moves && !infinite) continue;
          if (!moves && duration < 5000 && !infinite) continue;
          reported.add(name);
          const where = cssLocation(ctx, rule.sheet, rule.offset);
          const sel = rule.selector.trim();
          ctx.report({
            el: ctx.cssSources[rule.sheet]?.owner ?? ctx.doc.documentElement,
            css: { selector: sel, text: rule.text.length > 200 ? rule.text.slice(0, 197) + "..." : rule.text, ...where },
            message: infinite
              ? t(`The animation "${name}" on "${sel}" runs forever and there is no prefers-reduced-motion rule.`, `A animação "${name}" em "${sel}" roda para sempre e não há regra prefers-reduced-motion.`)
              : t(`The animation "${name}" on "${sel}" moves content (${kf.properties.filter((p) => MOVING.test(p)).join(", ")}) and there is no prefers-reduced-motion rule.`, `A animação "${name}" em "${sel}" move conteúdo (${kf.properties.filter((p) => MOVING.test(p)).join(", ")}) e não há regra prefers-reduced-motion.`),
            fix: {
              summary: t("Turn the animation off (or replace it with a fade) when the user asks for reduced motion.", "Desligue a animação (ou troque por um esmaecimento) quando a pessoa pedir movimento reduzido."),
              after: `@media (prefers-reduced-motion: reduce) {\n  ${sel} {\n    animation: none;\n  }\n}`,
              safe: false,
            },
            data: { animation: name, infinite, duration },
          });
        }
      }
    },
  },
  {
    id: "frame-title",
    title: t("Frame without a title", "Frame sem título"),
    explanation: t(
      "Screen readers announce an iframe by its title, so people can decide whether to enter it. Without a title they hear \"frame\" or the raw address.",
      "Leitores de tela anunciam um iframe pelo título, para que as pessoas decidam se querem entrar nele. Sem título elas ouvem \"frame\" ou o endereço cru.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["media"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "iframe" && el.localName !== "frame") continue;
        if (ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        const title = frameTitle(el.getAttribute("src") ?? "");
        ctx.report({
          el,
          message: t("This frame has no title.", "Este frame não tem título."),
          fix: { summary: t(`Add a title that says what is inside ("${title.en}").`, `Adicione um title que diga o que há dentro ("${title.pt}").`), ops: [{ op: "set-attr", name: "title", value: title.en }], safe: false },
        });
      }
    },
  },
  {
    id: "frame-title-unique",
    title: t("Frames with the same title", "Frames com o mesmo título"),
    explanation: t(
      "When several frames share a title, screen reader users cannot tell which one is the map and which is the video.",
      "Quando vários frames têm o mesmo título, quem usa leitor de tela não sabe qual é o mapa e qual é o vídeo.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "minor",
    wcag: ["4.1.2"],
    level: "A",
    tags: ["media"],
    run(ctx) {
      const byTitle = new Map<string, Element[]>();
      for (const el of ctx.elements) {
        if (el.localName !== "iframe" || ctx.dom.isHiddenFromAT(el)) continue;
        const name = ctx.dom.name(el).toLowerCase();
        if (!name) continue;
        byTitle.set(name, [...(byTitle.get(name) ?? []), el]);
      }
      for (const [name, list] of byTitle) {
        const srcs = new Set(list.map((f) => f.getAttribute("src") ?? ""));
        if (list.length < 2 || srcs.size < 2) continue;
        list.slice(1).forEach((el, i) => {
          ctx.report({
            el,
            message: t(`${list.length} frames are titled "${name}" but show different content.`, `${list.length} frames têm o título "${name}" mas mostram conteúdos diferentes.`),
            fix: { summary: t("Give each frame a title that describes its own content.", "Dê a cada frame um título que descreva o próprio conteúdo."), ops: [{ op: "set-attr", name: "title", value: `${el.getAttribute("title") ?? name} ${i + 2}` }], safe: false },
          });
        });
      }
    },
  },
  {
    id: "table-headers",
    title: t("Data table without header cells", "Tabela de dados sem células de cabeçalho"),
    explanation: t(
      "Header cells (<th>) let screen readers say which column and row a value belongs to (\"Price, Basic plan: 9 dollars\"). Without them a table is just a stream of numbers.",
      "Células de cabeçalho (<th>) permitem que leitores de tela digam a que coluna e linha um valor pertence (\"Preço, Plano básico: 9 reais\"). Sem elas a tabela é só uma sequência de números.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "serious",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["tables"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "table") continue;
        const role = ctx.dom.explicitRole(el);
        if (role === "none" || role === "presentation" || ctx.dom.isHiddenFromAT(el)) continue;
        const rows = Array.from(el.querySelectorAll("tr")).filter((r) => r.closest("table") === el);
        if (rows.length < 2) continue;
        const width = Math.max(...rows.map((r) => r.children.length));
        if (width < 2) continue;
        if (el.querySelector("th, [role=columnheader], [role=rowheader], td[scope]")) continue;
        if (el.querySelector("table")) continue; // nested tables are almost always layout
        const first = rows[0]!;
        const cells = Array.from(first.children).map((c) => `<th scope="col">${clean(c.textContent ?? "") || "Header"}</th>`);
        ctx.report({
          el,
          message: t(`This table has ${rows.length} rows and ${width} columns but no header cells.`, `Esta tabela tem ${rows.length} linhas e ${width} colunas mas nenhuma célula de cabeçalho.`),
          fix: {
            summary: t("Turn the first row into <th scope=\"col\"> cells inside <thead> (and the first column into <th scope=\"row\"> if it labels rows). If the table is only for layout, add role=\"presentation\".", "Transforme a primeira linha em células <th scope=\"col\"> dentro de <thead> (e a primeira coluna em <th scope=\"row\"> se ela rotular as linhas). Se a tabela for só de layout, adicione role=\"presentation\"."),
            after: `${openTag(el)}\n  <thead>\n    <tr>${cells.join("")}</tr>\n  </thead>\n  <tbody>\n    ${rows.slice(1, 3).map((r) => snippet(r, 160)).join("\n    ")}\n    ...\n  </tbody>\n</table>`,
            safe: false,
          },
        });
      }
    },
  },
  {
    id: "th-scope-valid",
    title: t("Invalid scope on a header cell", "scope inválido em célula de cabeçalho"),
    explanation: t(
      "The scope attribute says whether a header cell labels a column or a row. Only col, row, colgroup and rowgroup are valid; anything else is ignored.",
      "O atributo scope diz se a célula de cabeçalho rotula uma coluna ou uma linha. Só col, row, colgroup e rowgroup são válidos; qualquer outro valor é ignorado.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "moderate",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["tables"],
    run(ctx) {
      const map: Record<string, string> = { column: "col", columns: "col", cols: "col", colum: "col", rows: "row", line: "row", linha: "row", coluna: "col" };
      for (const el of ctx.elements) {
        if (el.localName !== "th" && el.localName !== "td") continue;
        const scope = el.getAttribute("scope");
        if (scope === null) continue;
        const v = scope.trim().toLowerCase();
        if (/^(col|row|colgroup|rowgroup)$/.test(v)) continue;
        const repaired = map[v];
        const ops: FixOp[] = [{ op: "set-attr", name: "scope", value: repaired ?? "col" }];
        ctx.report({
          el,
          message: t(`scope="${scope}" is not valid.`, `scope="${scope}" não é válido.`),
          fix: { summary: repaired ? t(`Use scope="${repaired}".`, `Use scope="${repaired}".`) : t("Use scope=\"col\" or scope=\"row\".", "Use scope=\"col\" ou scope=\"row\"."), ops, safe: !!repaired },
        });
      }
    },
  },
  {
    id: "empty-table-header",
    title: t("Empty table header cell", "Célula de cabeçalho vazia"),
    explanation: t(
      "An empty <th> gives the cells under it no label, so screen readers read their values without context.",
      "Um <th> vazio não dá rótulo às células abaixo dele, e os leitores de tela leem os valores sem contexto.",
    ),
    affects: t("Screen reader users.", "Usuários de leitores de tela."),
    severity: "minor",
    wcag: ["1.3.1"],
    level: "A",
    tags: ["tables"],
    run(ctx) {
      for (const el of ctx.elements) {
        if (el.localName !== "th" || ctx.dom.isHiddenFromAT(el) || ctx.dom.name(el)) continue;
        ctx.report({
          el,
          message: t("This header cell is empty.", "Esta célula de cabeçalho está vazia."),
          fix: {
            summary: t("Add text that names the column or row (it can be visually hidden), or use <td> if the corner cell labels nothing.", "Adicione um texto que nomeie a coluna ou linha (pode ser visualmente oculto), ou use <td> se a célula do canto não rotula nada."),
            ops: [{ op: "rename-tag", tag: "td" }],
            safe: false,
          },
        });
      }
    },
  },
];
