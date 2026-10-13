import type { Dom } from "../dom";
import { clean } from "../dom";
import type { Text } from "../types";

/** "first_name", "firstName", "team-photo_2024.jpg" become "First name", "First name", "Team photo 2024". */
export function humanize(raw: string): string {
  let s = raw.replace(/\?.*$/, "").replace(/#.*$/, "");
  s = s.split("/").filter(Boolean).pop() ?? s;
  s = s.replace(/\.(jpe?g|png|gif|svg|webp|avif|bmp|ico|html?|php|aspx?)$/i, "");
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_.+]+/g, " ");
  s = s.replace(/\b(img|image|pic|photo|icon|ic|btn|final|copy|v\d+|@\dx|\dx)\b/gi, " ");
  s = clean(s.replace(/\b[0-9a-f]{8,}\b/gi, " "));
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const ICONS: Array<[RegExp, string, string]> = [
  [/\b(close|times|x-?mark|dismiss|cross)\b/, "Close", "Fechar"],
  [/\b(search|magnif\w*|find|lupa)\b/, "Search", "Pesquisar"],
  [/\b(menu|hamburger|bars|navicon)\b/, "Open menu", "Abrir menu"],
  [/\b(trash|delete|remove|bin|lixeira)\b/, "Delete", "Excluir"],
  [/\b(edit|pencil|pen)\b/, "Edit", "Editar"],
  [/\b(plus|add|new)\b/, "Add", "Adicionar"],
  [/\b(heart|like|favou?rite)\b/, "Add to favorites", "Adicionar aos favoritos"],
  [/\b(share)\b/, "Share", "Compartilhar"],
  [/\b(cart|basket|bag|shopping)\b/, "Cart", "Carrinho"],
  [/\b(user|account|profile|person|avatar)\b/, "Account", "Conta"],
  [/\b(home|house)\b/, "Home", "Início"],
  [/\b(play)\b/, "Play", "Reproduzir"],
  [/\b(pause)\b/, "Pause", "Pausar"],
  [/\b(next|arrow-?right|chevron-?right|forward)\b/, "Next", "Próximo"],
  [/\b(prev|previous|arrow-?left|chevron-?left|back)\b/, "Previous", "Anterior"],
  [/\b(settings|cog|gear|config)\b/, "Settings", "Configurações"],
  [/\b(download)\b/, "Download", "Baixar"],
  [/\b(upload)\b/, "Upload", "Enviar arquivo"],
  [/\b(mail|envelope|email)\b/, "Email", "E-mail"],
  [/\b(phone|call)\b/, "Call", "Ligar"],
  [/\b(bell|notification)\b/, "Notifications", "Notificações"],
  [/\b(info|information)\b/, "More information", "Mais informações"],
  [/\b(help|question)\b/, "Help", "Ajuda"],
  [/\b(filter|funnel)\b/, "Filter", "Filtrar"],
  [/\b(sort)\b/, "Sort", "Ordenar"],
  [/\b(print|printer)\b/, "Print", "Imprimir"],
  [/\b(copy|clipboard)\b/, "Copy", "Copiar"],
  [/\b(expand|chevron-?down|caret-?down)\b/, "Expand", "Expandir"],
  [/\b(collapse|chevron-?up|caret-?up)\b/, "Collapse", "Recolher"],
  [/\b(logout|sign-?out|log-?out)\b/, "Sign out", "Sair"],
  [/\b(login|sign-?in|log-?in)\b/, "Sign in", "Entrar"],
  [/\b(github)\b/, "GitHub", "GitHub"],
  [/\b(twitter|x-twitter)\b/, "X (Twitter)", "X (Twitter)"],
  [/\b(facebook)\b/, "Facebook", "Facebook"],
  [/\b(linkedin)\b/, "LinkedIn", "LinkedIn"],
  [/\b(instagram)\b/, "Instagram", "Instagram"],
  [/\b(youtube)\b/, "YouTube", "YouTube"],
];

const SITES: Array<[RegExp, string]> = [
  [/github\.com/, "GitHub"],
  [/(twitter|x)\.com/, "X (Twitter)"],
  [/facebook\.com/, "Facebook"],
  [/linkedin\.com/, "LinkedIn"],
  [/instagram\.com/, "Instagram"],
  [/youtube\.com|youtu\.be/, "YouTube"],
  [/tiktok\.com/, "TikTok"],
  [/discord\.(gg|com)/, "Discord"],
  [/mastodon|bsky\.app/, "Social profile"],
];

function iconFrom(text: string): Text | null {
  const s = text.toLowerCase().replace(/_/g, "-");
  for (const [re, en, pt] of ICONS) if (re.test(s)) return { en, pt };
  return null;
}

/** Guesses a label for an icon only control from class names, icon font text, SVG symbols or image names. */
export function iconHint(el: Element): Text | null {
  const sources: string[] = [];
  for (const n of [el, ...Array.from(el.querySelectorAll("*"))]) {
    sources.push(n.getAttribute("class") ?? "", n.getAttribute("data-icon") ?? "", n.getAttribute("name") ?? "");
    if (n.localName === "use") sources.push(n.getAttribute("href") ?? n.getAttribute("xlink:href") ?? "");
    if (n.localName === "img") sources.push(n.getAttribute("src") ?? "");
    if (/material|icon|symbol/i.test(n.getAttribute("class") ?? "")) sources.push(n.textContent ?? "");
  }
  return iconFrom(sources.join(" "));
}

/** A label for a link guessed from its destination. */
export function hrefHint(href: string | null): Text | null {
  if (!href) return null;
  const h = href.trim();
  if (h.startsWith("mailto:")) return { en: `Email ${h.slice(7).split("?")[0]}`, pt: `Enviar e-mail para ${h.slice(7).split("?")[0]}` };
  if (h.startsWith("tel:")) return { en: `Call ${h.slice(4)}`, pt: `Ligar para ${h.slice(4)}` };
  for (const [re, name] of SITES) if (re.test(h)) return { en: `${name} profile`, pt: `Perfil no ${name}` };
  if (h === "/" || h === "./" || /^https?:\/\/[^/]+\/?$/.test(h)) return { en: "Home", pt: "Início" };
  const icon = iconFrom(h);
  if (icon && !/^https?:/.test(h)) return icon;
  const name = humanize(h);
  return name ? { en: name, pt: name } : null;
}

const GENERIC_LINKS = new Set(
  [
    "click here",
    "click",
    "here",
    "read more",
    "more",
    "learn more",
    "more info",
    "more information",
    "details",
    "link",
    "this link",
    "this",
    "go",
    "continue",
    "see more",
    "view more",
    "find out more",
    "clique aqui",
    "clique",
    "aqui",
    "saiba mais",
    "leia mais",
    "mais",
    "ver mais",
    "veja mais",
    "detalhes",
    "este link",
    "acesse",
    "confira",
  ].map((s) => s),
);

export function isGenericLinkText(name: string): boolean {
  const n = clean(name.toLowerCase().replace(/[.!:>»›→]+/g, " "));
  return GENERIC_LINKS.has(n);
}

/** Text of the closest heading before the element (inside the same section when there is one). */
export function nearestHeading(dom: Dom, el: Element): string {
  const all = Array.from(dom.doc.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']"));
  let best: Element | null = null;
  for (const h of all) {
    if (h.compareDocumentPosition(el) & 4 /* FOLLOWING */) best = h;
  }
  const container = el.closest("article, section, li, [class*='card']");
  const inside = container?.querySelector("h1, h2, h3, h4, h5, h6, [role='heading']");
  const pick = inside ?? best;
  return pick ? clean(pick.textContent ?? "") : "";
}

// ISO 639-1 primary language subtags, plus the most common three letter ones.
const LANGS = new Set(
  `aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et
  eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km
  kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om
  or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr
  ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu fil haw yue cmn gsw ast ckb sco nds hsb dsb mul und zxx`
    .split(/\s+/)
    .filter(Boolean),
);

/** Validates a BCP 47 language tag well enough to catch real mistakes ("english", "en_US", "e"). */
export function isValidLang(value: string): boolean {
  const v = value.trim();
  if (!/^[a-z]{2,3}(-[a-z0-9]{1,8})*$/i.test(v)) return false;
  return LANGS.has(v.split("-")[0]!.toLowerCase());
}

const LANG_NAMES: Record<string, string> = {
  english: "en",
  portuguese: "pt",
  "português": "pt",
  portugues: "pt",
  spanish: "es",
  "español": "es",
  espanol: "es",
  french: "fr",
  "français": "fr",
  francais: "fr",
  german: "de",
  deutsch: "de",
  italian: "it",
  italiano: "it",
  dutch: "nl",
  japanese: "ja",
  chinese: "zh",
  russian: "ru",
  korean: "ko",
  arabic: "ar",
  hindi: "hi",
  br: "pt-BR",
  us: "en-US",
  uk: "en-GB",
  jp: "ja",
  cn: "zh",
  kr: "ko",
  se: "sv",
  dk: "da",
};

/** Maps a common invalid lang value to a valid tag ("en_US" to "en-US", "english" to "en"), or null. */
export function repairLang(value: string): string | null {
  const v = value.trim();
  const named = LANG_NAMES[v.toLowerCase()];
  if (named) return named;
  const swapped = v.replace(/_/g, "-");
  if (swapped !== v && isValidLang(swapped)) {
    const [p, ...rest] = swapped.split("-");
    return [p!.toLowerCase(), ...rest.map((r) => (r.length === 2 ? r.toUpperCase() : r))].join("-");
  }
  return null;
}

const STOPWORDS: Record<string, string[]> = {
  en: "the and of to is in that for with you this are was have not but from they will your can".split(" "),
  pt: "de que não para com uma os do da em você são mais como mas foi pelo pela isso está seu sua".split(" "),
  es: "el los las del que para con una por es está pero como más este son también usted y".split(" "),
  fr: "le les des est pour une avec vous et dans pas sur qui sont nous mais tout cette".split(" "),
  de: "der die und das ist nicht mit für ein eine sie ich auf auch sich dem den wird".split(" "),
  it: "il della che per con una sono non gli del alla questo anche come più nel".split(" "),
};

/** Guesses the page language from common words. Returns null when the text is too short or ambiguous. */
export function detectLanguage(text: string): string | null {
  const words = text.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  if (words.length < 20) return null;
  const scores = Object.entries(STOPWORDS).map(([lang, list]) => {
    const set = new Set(list);
    return [lang, words.filter((w) => set.has(w)).length] as const;
  });
  scores.sort((a, b) => b[1] - a[1]);
  const [first, second] = scores as [readonly [string, number], readonly [string, number]];
  if (first[1] < 5 || first[1] < second[1] * 2) return null;
  return first[0];
}

/** A safe id derived from text: "Email address" becomes "email-address". */
export function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "field"
  );
}

const generated = new WeakMap<Dom, Set<string>>();

/** A fresh id that is not used in the document yet (nor by an earlier suggestion in the same audit). */
export function freshId(dom: Dom, base: string): string {
  let used = generated.get(dom);
  if (!used) generated.set(dom, (used = new Set()));
  let id = slug(base);
  if (!/^[a-z]/.test(id)) id = `field-${id}`;
  let n = 1;
  let candidate = id;
  while (used.has(candidate) || dom.idFrequency(candidate) > 0) candidate = `${id}-${++n}`;
  used.add(candidate);
  return candidate;
}
