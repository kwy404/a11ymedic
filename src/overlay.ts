import { runAudit } from "./engine";
import { RULES } from "./rules";
import type { AuditOptions, AuditResult, Finding, Lang, Severity } from "./types";

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SEV_COLOR: Record<Severity, string> = { critical: "#a3165f", serious: "#c2321f", moderate: "#8a5a00", minor: "#0a5c7a" };
const SEV_PT: Record<Severity, string> = { critical: "crítico", serious: "grave", moderate: "moderado", minor: "leve" };

const UI = {
  en: {
    title: "a11ymedic check-up",
    problems: (n: number) => (n === 1 ? "1 problem" : `${n} problems`),
    healthy: "Healthy: no problems found.",
    close: "Close a11ymedic",
    rerun: "Run again",
    lang: "Português",
    why: "Why it matters",
    who: "Who is affected",
    fix: "Fix",
    before: "Before",
    after: "After",
    copy: "Copy fix",
    copied: "Copied",
    auto: "auto fixable",
    review: "Needs a human check",
    pin: (n: number, title: string, more: number) => `Problem ${n}: ${title}${more ? ` and ${more} more` : ""}`,
    noPin: "Not visible on the page",
  },
  pt: {
    title: "Consulta a11ymedic",
    problems: (n: number) => (n === 1 ? "1 problema" : `${n} problemas`),
    healthy: "Saudável: nenhum problema encontrado.",
    close: "Fechar a11ymedic",
    rerun: "Rodar de novo",
    lang: "English",
    why: "Por que importa",
    who: "Quem é afetado",
    fix: "Correção",
    before: "Antes",
    after: "Depois",
    copy: "Copiar correção",
    copied: "Copiado",
    auto: "corrigível automaticamente",
    review: "Precisa de verificação humana",
    pin: (n: number, title: string, more: number) => `Problema ${n}: ${title}${more ? ` e mais ${more}` : ""}`,
    noPin: "Não visível na página",
  },
};

const PIN_CSS = `
:host{all:initial}
.pin{position:absolute;min-width:26px;height:26px;padding:0 6px;border-radius:13px 13px 13px 3px;border:2px solid #fff;color:#fff;font:700 12px/22px system-ui,"Segoe UI",sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;transform:translate(-30%,-80%);z-index:2}
.pin:hover,.pin.on{transform:translate(-30%,-80%) scale(1.15);z-index:3}
.pin:focus-visible{outline:3px solid #ffbf47;outline-offset:2px}
.box{position:absolute;border:3px solid #ff7a66;border-radius:4px;box-shadow:0 0 0 4px rgba(255,122,102,.25);pointer-events:none;display:none}
@media (prefers-reduced-motion:no-preference){.pin{transition:transform .12s}.box{transition:all .15s}}
`;

export interface PinsController {
  /** Reposition pins after layout changes. */
  update(): void;
  /** Outline the element of a finding and mark its pin. */
  highlight(index: number | null): void;
  remove(): void;
}

/**
 * Draws numbered pins over the elements of the findings, inside the given document.
 * Pins are buttons: clicking one calls `onSelect` with the finding index.
 */
export function drawPins(doc: Document, findings: Finding[], options: { lang?: Lang; onSelect?: (index: number) => void } = {}): PinsController {
  const lang = options.lang ?? "en";
  doc.getElementById("a11ymedic-pins")?.remove();
  const host = doc.createElement("div");
  host.id = "a11ymedic-pins";
  host.setAttribute("data-a11ymedic-ignore", "");
  host.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;z-index:2147483646;";
  const root = host.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = PIN_CSS;
  root.appendChild(style);
  const box = doc.createElement("div");
  box.className = "box";
  root.appendChild(box);
  (doc.body ?? doc.documentElement).appendChild(host);

  // One pin per element, numbered in reading order of the findings.
  const groups: Array<{ el: Element; indexes: number[] }> = [];
  findings.forEach((f, i) => {
    const el = f.element;
    if (!el || f.kind === "css" || /^(html|head|body|title|meta|style|link)$/.test(el.localName)) return;
    const g = groups.find((x) => x.el === el);
    if (g) g.indexes.push(i);
    else groups.push({ el, indexes: [i] });
  });
  const pins = groups.map((g, n) => {
    const f = findings[g.indexes[0]!]!;
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "pin";
    b.textContent = String(n + 1);
    b.style.background = SEV_COLOR[f.severity];
    b.setAttribute("aria-label", UI[lang].pin(g.indexes[0]! + 1, f.title[lang], g.indexes.length - 1));
    b.addEventListener("click", () => options.onSelect?.(g.indexes[0]!));
    root.appendChild(b);
    return { b, g };
  });
  const win = doc.defaultView!;
  let current: number | null = null;
  const place = (): void => {
    for (const { b, g } of pins) {
      const r = g.el.getBoundingClientRect();
      const visible = r.width > 0 || r.height > 0;
      b.hidden = !visible;
      b.style.left = `${r.left + win.scrollX}px`;
      b.style.top = `${r.top + win.scrollY}px`;
    }
    if (current !== null) highlight(current);
  };
  const highlight = (index: number | null): void => {
    current = index;
    for (const { b, g } of pins) b.classList.toggle("on", index !== null && g.indexes.includes(index));
    const el = index === null ? null : findings[index]?.element;
    if (!el) {
      box.style.display = "none";
      return;
    }
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) {
      box.style.display = "none";
      return;
    }
    box.style.display = "block";
    box.style.left = `${r.left + win.scrollX - 4}px`;
    box.style.top = `${r.top + win.scrollY - 4}px`;
    box.style.width = `${r.width + 8}px`;
    box.style.height = `${r.height + 8}px`;
  };
  let raf = 0;
  const onResize = (): void => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(place);
  };
  win.addEventListener("resize", onResize);
  place();
  return {
    update: place,
    highlight,
    remove() {
      win.removeEventListener("resize", onResize);
      host.remove();
    },
  };
}

const PANEL_CSS = `
:host{all:initial}
*{box-sizing:border-box}
.panel{--bg:#ffffff;--soft:#f1faf9;--text:#12343b;--muted:#46666c;--line:#bfe6e1;--teal:#0a6b6d;--coral:#b4402f;--code:#eef7f6;
position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);background:var(--bg);color:var(--text);border-left:1px solid var(--line);
box-shadow:-8px 0 24px rgba(0,0,0,.18);font:14px/1.5 system-ui,"Segoe UI",Helvetica,Arial,sans-serif;display:flex;flex-direction:column;z-index:2147483647}
@media (prefers-color-scheme:dark){.panel{--bg:#0b1f24;--soft:#10323a;--text:#e8f6f5;--muted:#9fc9c6;--line:#1f5660;--teal:#5fd6cb;--coral:#ff9a8a;--code:#081a1e}}
@media (max-width:520px){.panel{top:auto;height:62vh;width:100vw;border-left:0;border-top:1px solid var(--line);border-radius:16px 16px 0 0}}
header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);background:var(--soft)}
h2{margin:0;font-size:16px;flex:1}h2:focus{outline:none}
.tools{display:flex;gap:6px}
button{font:inherit;color:inherit;cursor:pointer}
.tool{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:4px 10px;min-height:32px;min-width:32px}
.tool:hover{border-color:var(--teal)}
button:focus-visible,a:focus-visible{outline:3px solid var(--teal);outline-offset:2px}
.counts{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;margin:0;list-style:none;border-bottom:1px solid var(--line)}
.counts li{border:1px solid var(--line);border-radius:999px;padding:1px 10px;font-size:12px}
.list{list-style:none;margin:0;padding:6px 8px 24px;overflow:auto;flex:1}
.item{border:1px solid var(--line);border-radius:10px;margin:8px 4px;background:var(--bg)}
.item.on{border-color:var(--coral);box-shadow:0 0 0 2px var(--coral)}
.head{display:flex;gap:10px;width:100%;text-align:left;background:none;border:0;padding:10px;border-radius:10px;align-items:flex-start}
.num{flex:none;min-width:24px;height:24px;border-radius:12px 12px 12px 3px;color:#fff;font-weight:700;font-size:12px;display:grid;place-items:center}
.t{display:block;font-weight:600}.m{display:block;color:var(--muted);font-size:13px}
.sev{font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.body{padding:0 12px 12px 44px}
.body h3{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:10px 0 2px}
.body p{margin:0 0 6px}
pre{margin:2px 0 6px;background:var(--code);border:1px solid var(--line);border-radius:8px;padding:8px;white-space:pre-wrap;word-break:break-word;font:12px/1.5 ui-monospace,Consolas,monospace}
.after{border-color:var(--teal)}
a{color:var(--teal)}
.copy{background:var(--teal);color:var(--bg);border:0;border-radius:8px;padding:6px 12px;font-weight:600;min-height:32px}
.safe{display:inline-block;font-size:11px;border:1px solid var(--teal);color:var(--teal);border-radius:6px;padding:0 6px;margin-left:6px}
.empty{padding:24px;text-align:center;color:var(--teal);font-weight:600}
.review{padding:8px 14px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
`;

export interface OverlayOptions extends AuditOptions {
  /** Start with the side panel open. Default true. */
  open?: boolean;
}

export interface OverlayController {
  result: AuditResult;
  /** Audit the page again and redraw. */
  refresh(): AuditResult;
  /** Select a finding: expands it in the panel and outlines its element. */
  select(index: number): void;
  setLang(lang: Lang): void;
  close(): void;
}

let active: OverlayController | null = null;

/**
 * Audits the current page and shows numbered pins on the problems plus a keyboard accessible side
 * panel with the explanation and the exact fix for each one. Alt+Shift+A toggles it, Escape closes it.
 */
export function overlay(options: OverlayOptions = {}): OverlayController {
  active?.close();
  const doc = document;
  let lang: Lang = options.lang ?? (/^pt/i.test(doc.documentElement.lang || navigator.language || "") ? "pt" : "en");
  const host = doc.createElement("div");
  host.id = "a11ymedic-overlay";
  host.setAttribute("data-a11ymedic-ignore", "");
  const root = host.attachShadow({ mode: "open" });
  doc.body.appendChild(host);
  const previousFocus = doc.activeElement as HTMLElement | null;
  let result = runAudit(RULES, doc, options);
  let pins: PinsController | null = null;
  let selected: number | null = null;

  const render = (): void => {
    const ui = UI[lang];
    const f = result.findings;
    const counts = (["critical", "serious", "moderate", "minor"] as Severity[])
      .filter((s) => result.counts[s])
      .map((s) => `<li style="border-color:${SEV_COLOR[s]}">${result.counts[s]} ${lang === "pt" ? SEV_PT[s] : s}</li>`)
      .join("");
    const items = f
      .map((x, i) => {
        const open = selected === i;
        const crit = x.wcag.map((w) => `<a href="${w.url}" target="_blank" rel="noopener">${w.id} ${esc(lang === "pt" ? w.namePt : w.name)} (${w.level})</a>`).join(", ");
        return `<li class="item${open ? " on" : ""}" data-i="${i}">
<button type="button" class="head" aria-expanded="${open}" aria-controls="b${i}" data-i="${i}"><span class="num" style="background:${SEV_COLOR[x.severity]}" aria-hidden="true">${i + 1}</span>
<span><span class="sev" style="color:${SEV_COLOR[x.severity]}">${lang === "pt" ? SEV_PT[x.severity] : x.severity}</span><span class="t">${esc(x.title[lang])}</span><span class="m">${esc(x.message[lang])}</span></span></button>
<div class="body" id="b${i}"${open ? "" : " hidden"}>
<h3>${ui.why}</h3><p>${esc(x.explanation[lang])}</p>
<h3>${ui.who}</h3><p>${esc(x.affects[lang])}</p>
<h3>WCAG</h3><p>${crit}</p>
<h3>${ui.fix}${x.fix.safe ? `<span class="safe">${ui.auto}</span>` : ""}</h3><p>${esc(x.fix.summary[lang])}</p>
<h3>${ui.before}</h3><pre>${esc(x.fix.before)}</pre>
<h3>${ui.after}</h3><pre class="after">${esc(x.fix.after)}</pre>
<button type="button" class="copy" data-copy="${i}">${ui.copy}</button>
<p class="m">${esc(x.selector)}</p>
</div></li>`;
      })
      .join("");
    root.innerHTML = `<style>${PANEL_CSS}</style>
<aside class="panel" aria-labelledby="a11ymedic-title"${options.open === false ? " hidden" : ""}>
<header><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#0f8b8d"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>
<h2 id="a11ymedic-title" tabindex="-1">${ui.title}: ${ui.problems(f.length)}</h2>
<div class="tools"><button type="button" class="tool" data-act="lang" lang="${lang === "pt" ? "en" : "pt-BR"}">${ui.lang}</button>
<button type="button" class="tool" data-act="rerun">${ui.rerun}</button>
<button type="button" class="tool" data-act="close" aria-label="${ui.close}">&times;</button></div></header>
${counts ? `<ul class="counts">${counts}</ul>` : ""}
${f.length ? `<ol class="list">${items}</ol>` : `<p class="empty">${ui.healthy}</p>`}
${result.incomplete.length ? `<p class="review">${ui.review}: ${result.incomplete.length}</p>` : ""}
<p class="sr" role="status">${ui.problems(f.length)}</p>
</aside>`;
  };

  const select = (i: number): void => {
    selected = selected === i ? null : i;
    render();
    pins?.highlight(selected);
    if (selected !== null) {
      const el = result.findings[selected]?.element;
      el?.scrollIntoView?.({ block: "center", behavior: typeof matchMedia === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
      const head = root.querySelector<HTMLElement>(`.head[data-i="${selected}"]`);
      head?.focus();
      head?.scrollIntoView?.({ block: "nearest" });
    }
  };

  const draw = (): void => {
    pins?.remove();
    pins = drawPins(doc, result.findings, { lang, onSelect: select });
  };

  root.addEventListener("click", (e) => {
    const target = (e.target as Element).closest("button");
    if (!target) return;
    const act = target.getAttribute("data-act");
    if (act === "close") return controller.close();
    if (act === "rerun") {
      controller.refresh();
      (root.querySelector("h2") as HTMLElement | null)?.focus();
      return;
    }
    if (act === "lang") return controller.setLang(lang === "pt" ? "en" : "pt");
    const copy = target.getAttribute("data-copy");
    if (copy !== null) {
      const text = result.findings[Number(copy)]?.fix.after ?? "";
      void navigator.clipboard?.writeText(text).then(() => {
        target.textContent = UI[lang].copied;
      });
      return;
    }
    const i = target.getAttribute("data-i");
    if (i !== null) select(Number(i));
  });

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && e.composedPath().includes(host)) controller.close();
  };
  doc.addEventListener("keydown", onKey);

  const controller: OverlayController = {
    get result() {
      return result;
    },
    refresh() {
      result = runAudit(RULES, doc, options);
      selected = null;
      render();
      draw();
      return result;
    },
    select,
    setLang(l) {
      lang = l;
      render();
      draw();
      (root.querySelector("[data-act=lang]") as HTMLElement | null)?.focus();
    },
    close() {
      pins?.remove();
      host.remove();
      doc.removeEventListener("keydown", onKey);
      if (active === controller) active = null;
      previousFocus?.focus?.();
    },
  };
  render();
  draw();
  (root.querySelector("h2") as HTMLElement | null)?.focus();
  active = controller;
  return controller;
}

/** Toggles the overlay. Bound to Alt+Shift+A once the browser build loads. */
export function toggleOverlay(options: OverlayOptions = {}): OverlayController | null {
  if (active) {
    active.close();
    return null;
  }
  return overlay(options);
}
