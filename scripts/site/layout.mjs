// Page chrome for the docs site: head (SEO, theme, fonts, Monsoon, Voodoo), header and footer.

export const SITE = "https://kwy404.github.io/a11ymedic/";
export const REPO = "https://github.com/kwy404/a11ymedic";
export const VERSION = "0.1.0";
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

const ICON = (d, extra = "") => `<svg class="cl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
export const icons = {
  github: `<svg class="cl-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.6a10.4 10.4 0 0 0-3.3 20.3c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1.1a9.9 9.9 0 0 1 5.2 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.4.1 2.7.7.8 1.1 1.7 1.1 2.8 0 4-2.4 4.8-4.7 5.1.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.4 10.4 0 0 0 12 1.6Z"/></svg>`,
  system: ICON('<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>', ' data-t="system"'),
  sun: ICON('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>', ' data-t="light"'),
  moon: ICON('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>', ' data-t="dark"'),
  menu: ICON('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  copy: ICON('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
  check: ICON('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  arrow: ICON('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  play: ICON('<path d="M7 5v14l12-7z"/>'),
  plus: ICON('<path d="M12 5v14M5 12h14"/>'),
  bandage: ICON('<rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M10.5 10.5h.01M13.5 13.5h.01M13.5 10.5h.01M10.5 13.5h.01"/>'),
};

const NAV = [
  ["./#checkup", "Check-up", "checkup"],
  ["./#contrast", "Contrast fixer", "contrast"],
  ["wcag-cheat-sheet.html", "WCAG cheat sheet", "wcag"],
  ["./#rules", "Rules", "rules"],
  ["guides.html", "Guides", "guides"],
  ["./#install", "Install", "install"],
];

export function header(active) {
  const links = NAV.map(([href, label, key]) => `<a class="cl-nav-link" href="${href}"${key === active ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<header class="cl-top">
  <div class="cl-wrap cl-top-row">
    <a class="cl-brand" href="./" aria-label="a11ymedic home"><img src="favicon.svg" width="32" height="32" alt=""><span>a11y<b>medic</b></span></a>
    <a class="badge badge-sm badge-outline cl-ver" href="${REPO}/blob/main/CHANGELOG.md" aria-label="v${VERSION} changelog">v${VERSION}</a>
    <nav class="cl-nav" aria-label="Main">${links}</nav>
    <div class="cl-top-end">
      <a class="cl-icon-btn" href="${REPO}" aria-label="a11ymedic on GitHub">${icons.github}</a>
      <button type="button" class="cl-icon-btn cl-theme" v-theme-toggle.cycle aria-label="Color theme: follow the system, light or dark" title="Color theme">${icons.system}${icons.sun}${icons.moon}</button>
      <button type="button" class="cl-icon-btn cl-menu-btn" aria-controls="cl-menu" aria-expanded="false" :aria-expanded="menu ? 'true' : 'false'" @click="menu = !menu" aria-label="Menu">${icons.menu}</button>
    </div>
  </div>
  <nav id="cl-menu" class="cl-mobile" aria-label="Mobile" style="display:none" v-show="menu" @click="menu = false">
    <div class="cl-wrap">${NAV.map(([href, label]) => `<a class="cl-nav-link" href="${href}">${label}</a>`).join("")}<a class="cl-nav-link" href="${REPO}">GitHub</a><a class="cl-nav-link" href="https://www.npmjs.com/package/a11ymedic">npm</a></div>
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
];

export function footer() {
  return `<footer class="cl-foot">
  <div class="cl-wrap cl-foot-grid">
    <div class="cl-foot-brand">
      <a class="cl-brand" href="./"><img src="favicon.svg" width="28" height="28" alt=""><span>a11y<b>medic</b></span></a>
      <p>An accessibility checker that explains every problem in plain language and writes the exact fix. Free and open source under the MIT license.</p>
      <p class="cl-made">Made by <strong>Alexandre Kohler</strong> (<a href="https://github.com/kwy404" rel="me noopener">GitHub</a> and <a href="https://www.linkedin.com/in/alexandre-silva-173687256/" rel="me noopener">LinkedIn</a>).</p>
      <p class="cl-made">Built with <a href="https://kwy404.github.io/monsoon/">Monsoon</a>. Interactive parts built with <a href="https://kwy404.github.io/Voodoo.js/">Voodoo.js</a>.</p>
    </div>
    <nav aria-label="Project">
      <h2 class="cl-foot-h">Project</h2>
      <ul>
        <li><a href="${REPO}">GitHub repository</a></li>
        <li><a href="https://www.npmjs.com/package/a11ymedic">npm package</a></li>
        <li><a href="${REPO}/blob/main/CHANGELOG.md">Changelog</a></li>
        <li><a href="${REPO}/blob/main/i18n/README.pt-BR.md">Leia em Português</a></li>
        <li><a href="wcag-cheat-sheet.html">WCAG 2.2 cheat sheet</a></li>
        <li><a href="guides.html">All guides</a></li>
      </ul>
    </nav>
    <nav aria-label="More from kwy404">
      <h2 class="cl-foot-h">More from kwy404</h2>
      <ul>${MORE.map(([name, url, what]) => `<li><a href="${url}">${name}</a> <span>${what}</span></li>`).join("")}</ul>
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
  const alt = ogAlt ?? "a11ymedic: an accessibility checker with plain language explanations and exact fixes, with Patch the otter medic";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <script>(function(){try{var t=localStorage.getItem("voodoo:theme");if(t&&t.charAt(0)==='"')t=JSON.parse(t);var r=document.documentElement;if(t==="light"||t==="dark"){r.setAttribute("data-theme",t);r.style.colorScheme=t}}catch(e){}})();</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="author" content="Alexandre Kohler">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#f3faf9" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0b1f24" media="(prefers-color-scheme: dark)">
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/monsooncss@0.2.0/dist/monsoon.min.css">
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
