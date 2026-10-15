// Page chrome for the docs site, "the a11ymedic clinic": head (SEO, theme, fonts, Monsoon,
// Voodoo), the clinic sign header and the front desk footer.
import { icon } from "../art/clinic.mjs";

export const SITE = "https://kwy404.github.io/a11ymedic/";
export const REPO = "https://github.com/kwy404/a11ymedic";
export const VERSION = "0.2.0";
export const AUTHOR = {
  "@type": "Person",
  name: "Alexandre Kohler",
  url: "https://github.com/kwy404",
  sameAs: ["https://github.com/kwy404", "https://www.linkedin.com/in/alexandre-silva-173687256/"],
};

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escapes code for a raw <pre data-lang> block (highlighted later by highlight-docs.mjs). */
export const code = (lang, title, source, mini = false) =>
  `<pre ${mini ? 'data-mini="1" ' : ""}data-lang="${lang}" data-title="${esc(title)}"><code>${esc(source.replace(/^\n/, "").replace(/\s+$/, ""))}</code></pre>`;

const LINE = (d) =>
  `<svg class="cl-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
export const icons = {
  github: `<svg class="cl-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 1.6a10.4 10.4 0 0 0-3.3 20.3c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1.1a9.9 9.9 0 0 1 5.2 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.4.1 2.7.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.8-4.7 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.4 10.4 0 0 0 12 1.6Z"/></svg>`,
  menu: LINE('<path d="M4 7h16M4 12h16M4 17h11"/>'),
  arrow: LINE('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  play: LINE('<path d="M7 5v14l12-7z" fill="currentColor"/>'),
  check: LINE('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  copy: icon("copy", "ic ic-sm"),
  bandage: icon("bandage", "ic ic-sm"),
};

const themeIcon = (name, t) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-t="${t}"><use href="assets/art/icons.svg#${name}"/></svg>`;

const NAV = [
  ["./#checkup", "Check-up", "checkup", "stethoscope"],
  ["./#contrast", "Eye exam", "contrast", "low-vision"],
  ["wcag-cheat-sheet.html", "WCAG cheat sheet", "wcag", "clipboard-check"],
  ["./#rules", "Rules", "rules", "cabinet"],
  ["guides.html", "Guides", "guides", "book"],
  ["./#install", "Install", "install", "ambulance"],
];

export function header(active) {
  const link = ([href, label, key, ic]) =>
    `<a class="cl-nav-link" href="${href}"${key === active ? ' aria-current="page"' : ""}>${icon(ic, "ic ic-nav")}<span>${label}</span></a>`;
  return `<header class="cl-top">
  <div class="cl-wrap cl-top-row">
    <a class="cl-brand" href="./"><img src="favicon.svg" width="40" height="40" alt=""><span class="cl-brand-text"><span class="cl-brand-name">a11y<b>medic</b></span><span class="cl-brand-sub">accessibility clinic</span></span></a>
    <nav class="cl-nav" aria-label="Main">${NAV.map(link).join("")}</nav>
    <div class="cl-top-end">
      <a class="cl-ver" href="${REPO}/blob/main/CHANGELOG.md" aria-label="v${VERSION} changelog">v${VERSION}</a>
      <a class="cl-icon-btn" href="${REPO}" aria-label="a11ymedic on GitHub">${icons.github}</a>
      <button type="button" class="cl-icon-btn cl-theme" v-theme-toggle.cycle aria-label="Color theme: follow the system, light or dark" title="Color theme">${themeIcon("system", "system")}${themeIcon("sun", "light")}${themeIcon("moon", "dark")}</button>
      <button type="button" class="cl-icon-btn cl-menu-btn" aria-controls="cl-menu" aria-expanded="false" :aria-expanded="menu ? 'true' : 'false'" @click="menu = !menu" aria-label="Menu">${icons.menu}</button>
    </div>
  </div>
  <nav id="cl-menu" class="cl-mobile" aria-label="Mobile" style="display:none" v-show="menu" @click="menu = false">
    <div class="cl-wrap">${NAV.map(link).join("")}<a class="cl-nav-link" href="${REPO}">${icons.github}<span>GitHub</span></a><a class="cl-nav-link" href="https://www.npmjs.com/package/a11ymedic">${icon("pill", "ic ic-nav")}<span>npm</span></a></div>
  </nav>
</header>`;
}

const MORE = [
  ["Monsoon", "https://kwy404.github.io/monsoon/", "utility-first CSS with no build step"],
  ["Voodoo.js", "https://kwy404.github.io/Voodoo.js/", "JSX and reactivity in plain HTML"],
  ["breakhound", "https://kwy404.github.io/breakhound/", "find bugs automatically, no tests needed"],
  ["vueleap", "https://kwy404.github.io/vueleap/", "migrate Vue 2 to Vue 3"],
  ["graphemely", "https://kwy404.github.io/graphemely/", "emoji safe string length and truncation"],
  ["numberparrot", "https://kwy404.github.io/numberparrot/", "parse localized numbers"],
  ["edgegoat", "https://kwy404.github.io/edgegoat/", "edge case test inputs"],
  ["cookieowl", "https://kwy404.github.io/cookieowl/", "cookie consent for LGPD and GDPR"],
  ["installkite", "https://kwy404.github.io/installkite/", "make any website installable and offline"],
  ["fontsketch", "https://kwy404.github.io/fontsketch/", "turn your handwriting into a font"],
  ["kastor", "https://kwy404.github.io/kastor/", "TypeScript ORM for almost every database"],
];

export function footer() {
  return `<footer class="cl-foot">
  <div class="cl-wrap cl-foot-grid">
    <div class="cl-foot-desk">
      <img class="cl-foot-patch" src="assets/mascot-head.svg" data-season-src="assets/seasons/{id}/patch-head.svg" width="84" height="84" alt="">
      <div>
        <p class="cl-foot-hello">Front desk</p>
        <p class="cl-foot-name">a11y<b>medic</b></p>
        <p>An accessibility checker that explains every problem in plain language and writes the exact fix. Free and open source under the MIT license.</p>
        <p class="cl-made">Made by <strong>Alexandre Kohler</strong> (<a href="https://github.com/kwy404" rel="me noopener">GitHub</a> and <a href="https://www.linkedin.com/in/alexandre-silva-173687256/" rel="me noopener">LinkedIn</a>).</p>
        <p class="cl-made">Built with <a href="https://kwy404.github.io/monsoon/">Monsoon</a>. Interactive parts built with <a href="https://kwy404.github.io/Voodoo.js/">Voodoo.js</a>.</p>
      </div>
    </div>
    <nav aria-label="Clinic">
      <h2 class="cl-foot-h">${icon("first-aid", "ic ic-sm")}Clinic</h2>
      <ul>
        <li><a href="./#checkup">Live check-up</a></li>
        <li><a href="./#contrast">Contrast eye exam</a></li>
        <li><a href="./#rules">Medicine cabinet of rules</a></li>
        <li><a href="wcag-cheat-sheet.html">WCAG 2.2 cheat sheet</a></li>
        <li><a href="guides.html">All guides</a></li>
      </ul>
    </nav>
    <nav aria-label="Project">
      <h2 class="cl-foot-h">${icon("report", "ic ic-sm")}Project</h2>
      <ul>
        <li><a href="${REPO}">GitHub repository</a></li>
        <li><a href="https://www.npmjs.com/package/a11ymedic">npm package</a></li>
        <li><a href="${REPO}/blob/main/CHANGELOG.md">Changelog</a></li>
        <li><a href="${REPO}/blob/main/i18n/README.pt-BR.md" hreflang="pt-BR" lang="pt-BR">Leia em Português</a></li>
      </ul>
    </nav>
    <nav aria-label="More from kwy404">
      <h2 class="cl-foot-h">${icon("sparkle", "ic ic-sm")}More from kwy404</h2>
      <ul class="cl-more-list">${MORE.map(([name, url, what]) => `<li><a href="${url}">${name}</a> <span>${what}</span></li>`).join("")}</ul>
    </nav>
  </div>
  <div class="cl-wrap cl-foot-legal"><span>MIT license, copyright 2026 Alexandre Kohler.</span><span>a11ymedic diagnoses and suggests fixes. It does not replace testing with disabled people.</span></div>
</footer>`;
}

/**
 * A complete page. `path` is relative to the site root ("" for the home page).
 */
export function page({ title, description, path, body, jsonld, active = "", scripts = "", ogAlt }) {
  const url = SITE + path;
  const image = `${SITE}og.png`;
  const alt = ogAlt ?? "a11ymedic: the accessibility clinic for websites, with Patch the otter paramedic treating a sick browser window";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <script>(function(){try{var t=localStorage.getItem("voodoo:theme");if(t&&t.charAt(0)==='"')t=JSON.parse(t);var r=document.documentElement;if(t==="light"||t==="dark"){r.setAttribute("data-theme",t);r.style.colorScheme=t}}catch(e){}})();</script>
  <script src="seasons.js" data-sprite-href="assets/seasons/seasons.svg"></script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="author" content="Alexandre Kohler">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#fbf5ea" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#102a2f" media="(prefers-color-scheme: dark)">
  <meta property="og:type" content="${path ? "article" : "website"}">
  <meta property="og:site_name" content="a11ymedic">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${esc(alt)}">
  <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400;600&family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,600;0,700;1,400&family=Caveat:wght@600;700&family=Fredoka:wght@500;600;700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/monsooncss@0.2.0/dist/monsoon.min.css">
  <link rel="stylesheet" href="art.css">
  <link rel="stylesheet" href="site.css">
  <script src="https://cdn.jsdelivr.net/npm/voodoojs@1.0.0/dist/voodoo.full.min.js" data-manual defer></script>
${scripts}  <script type="module" src="site.js"></script>
</head>
<body class="bg-background text-foreground antialiased">
  <a class="skip-link" href="#main">Skip to content</a>
  ${header(active)}
  <main id="main">
${body}
  </main>
  ${footer()}
</body>
</html>
`;
}

export function breadcrumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + path })),
  };
}

export function faqLd(faq) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** A hand drawn divider: a wavy line that turns into a heartbeat in the middle. */
export const divider = `<div class="cl-divider" aria-hidden="true"><svg viewBox="0 0 1200 40" preserveAspectRatio="none" focusable="false"><path d="M0 22c40-8 80 8 120 0s80-8 120 0 80 8 120 0 80-8 120 0 60 6 80 0l14-16 16 30 14-24 10 10c20 4 60-6 100 0s80 8 120 0 80-8 120 0 80 8 120 0 80-8 120 0"/></svg></div>`;

/** People an accessibility barrier affects, with the icon from the clinic icon family. */
export const PEOPLE = {
  "screen-reader": ["Screen reader users", "Hear the page read aloud and move by headings, links and landmarks."],
  "low-vision": ["Low vision", "Zoom to 200 percent and beyond, and need strong contrast to read."],
  "color-blind": ["Color blindness", "Cannot tell some colors apart, so color alone says nothing."],
  "keyboard-only": ["Keyboard only", "Tab, Enter and arrows instead of a mouse, so focus must show."],
  cognitive: ["Cognitive and learning", "Need clear labels, steady layouts and time to read."],
  motor: ["Motor and dexterity", "Tremors or a switch device make tiny targets and drags hard."],
  deaf: ["Deaf and hard of hearing", "Rely on captions and transcripts for anything spoken."],
};
