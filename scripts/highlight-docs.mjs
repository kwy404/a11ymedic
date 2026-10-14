// Pre-renders syntax highlighting for every code example in docs/*.html with Shiki, using the
// VS Code themes light-plus and dark-plus as dual themes, and wraps each block in an editor
// frame: window dots, a file tab, a copy button driven by Voodoo.js, line numbers and a status
// bar. `data-mini` blocks get a compact frame without the status bar and line numbers.
//
//   node scripts/highlight-docs.mjs
//
// Idempotent: only raw <pre data-lang="..." data-title="..."><code> blocks written by
// scripts/build-docs.mjs are converted, so running it twice changes nothing.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Shiki is a dev dependency; fall back to the copy used by a sibling project when it is missing.
let shiki;
try {
  shiki = await import("shiki");
} catch {
  shiki = await import(pathToFileURL("C:/Users/Hadouken Game Center/own/graphemely/node_modules/shiki/dist/index.mjs").href);
}

const LANGS = { ts: "typescript", tsx: "tsx", js: "javascript", sh: "shellscript", html: "html", json: "json", css: "css", yaml: "yaml" };
const NAMES = { ts: "TypeScript", tsx: "TypeScript JSX", js: "JavaScript", sh: "Shell", html: "HTML", json: "JSON", css: "CSS", yaml: "YAML" };
const BADGES = { ts: "TS", tsx: "TSX", js: "JS", sh: "$_", html: "<>", json: "{}", css: "#", yaml: "YML" };
const RAW = /<pre (data-mini="1" )?data-lang="([a-z]+)" data-title="([^"]*)"><code>([\s\S]*?)<\/code><\/pre>/g;
const COPY_ICON = '<svg class="cl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const highlighter = await shiki.createHighlighter({ themes: ["light-plus", "dark-plus"], langs: Object.values(LANGS) });

let total = 0;
for (const file of readdirSync("docs").filter((f) => f.endsWith(".html"))) {
  const path = `docs/${file}`;
  const html = readFileSync(path, "utf8");
  const existing = html.match(/id="code-(\d+)"/g)?.length ?? 0;
  let n = existing;
  const out = html.replace(RAW, (_, mini, lang, title, body) => {
    n++;
    const id = `code-${n}`;
    const source = decode(body);
    const lines = source.split("\n").length;
    const pre = highlighter
      .codeToHtml(source, { lang: LANGS[lang] ?? "text", themes: { light: "light-plus", dark: "dark-plus" }, defaultColor: false })
      .replace(' tabindex="0"', ` tabindex="0" aria-label="${title} code example"`);
    const copy = `<button type="button" class="cl-code-copy" aria-label="Copy code from ${title}" @click="copy($el)">${COPY_ICON}<span v-text="copied === '${id}' ? 'Copied' : 'Copy'">Copy</span></button>`;
    const bar = `<div class="cl-code-bar"><span class="cl-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="cl-code-tab"><span class="cl-code-badge" aria-hidden="true">${escText(BADGES[lang] ?? lang)}</span>${title}</span>${copy}</div>`;
    const status = mini
      ? ""
      : `<div class="cl-code-status" aria-hidden="true"><span>a11ymedic</span><span>${NAMES[lang] ?? lang}</span><span>UTF-8</span><span>${lines} ${lines === 1 ? "line" : "lines"}</span></div>`;
    return `<figure class="cl-code${mini ? " cl-code-mini" : ""}" id="${id}" data-lang="${lang}">${bar}${pre}${status}</figure>`;
  });
  if (out !== html) {
    writeFileSync(path, out);
    total += n - existing;
    console.log(`highlighted ${n - existing} block(s) in ${path}`);
  }
}
console.log(total === 0 ? "Nothing to highlight: docs are already highlighted." : `Highlighted ${total} block(s).`);
highlighter.dispose();
