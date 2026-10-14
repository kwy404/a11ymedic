// The home page: "the clinic". A live check-up room, a contrast fixer, the rule catalog,
// install instructions, the API and the FAQ.
import { code, esc, icons, REPO, VERSION } from "./layout.mjs";

export const HOME_FAQ = [
  {
    q: "What is the best free website accessibility checker?",
    a: "Use one that finds problems and tells you how to fix them. a11ymedic is free and open source: it checks 61 WCAG 2.2 rules in the browser, on the command line and in CI, explains each problem in plain English or Portuguese and gives the patched HTML for every finding.",
  },
  {
    q: "How do I check a website for accessibility problems?",
    a: "Run npx a11ymedic https://your-site.com for a full report, or add the a11ymedic script tag (or the bookmarklet) to see numbered pins on the page itself. For your own code, run npx a11ymedic \"src/**/*.html\" and add --fail-on serious in CI.",
  },
  {
    q: "Can a11ymedic fix accessibility issues automatically?",
    a: "It fixes the safe ones: a11ymedic fix \"src/**/*.html\" shows a diff and --write applies it. Safe fixes are things like an empty alt on a spacer image, tabindex 0 instead of 5, re-enabling zoom or a misspelled ARIA attribute. Everything that needs a human decision (alt text that describes a photo, a label text) comes as a ready to paste suggestion instead.",
  },
  {
    q: "Does a11ymedic replace testing with real users?",
    a: "No. Automated checks catch a large share of common problems, but not all of them: whether alt text is accurate, whether a flow makes sense with a screen reader or whether captions are correct still need people. a11ymedic marks what it cannot decide as a human check.",
  },
  {
    q: "Does it work with React, Vue, Angular and Next.js?",
    a: "Yes. Test rendered components with expect(await audit(container)).toHaveNoViolations() in Vitest or Jest, check built HTML with the CLI, or load the overlay script in development.",
  },
  {
    q: "Is a11ymedic an accessibility overlay?",
    a: "No. Its overlay is a diagnosis tool for the people who build the site: it highlights problems and shows the fix. It never changes the page for visitors. Real fixes belong in your source code.",
  },
];

const SEV = [
  ["critical", "Critical"],
  ["serious", "Serious"],
  ["moderate", "Moderate"],
  ["minor", "Minor"],
];

function ruleRows(rules) {
  return rules
    .map((r) => {
      const hay = `${r.id} ${r.title.en} ${r.tags.join(" ")} ${r.wcag.join(" ")}`.toLowerCase().replace(/['"\\]/g, "");
      return `<tr v-show="ruleVisible('${esc(hay)}', '${r.severity}', rq, rsev)"><td><code>${r.id}</code></td><td>${esc(r.title.en)}</td><td>${r.wcag
        .map((w) => `<a href="https://www.w3.org/WAI/WCAG22/Understanding/${r.wcagSlugs[w]}.html">${w}</a>`)
        .join(", ")}</td><td>${r.level}</td><td><span class="cl-pill" data-sev="${r.severity}">${r.severity}</span></td><td>${r.autofix ? "Yes" : ""}</td></tr>`;
    })
    .join("\n");
}

const wayIcon = (name) =>
  `<picture class="cl-way-icon"><source srcset="assets/icons/dark/${name}.svg" media="(prefers-color-scheme: dark)"><img src="assets/icons/light/${name}.svg" width="28" height="28" alt=""></picture>`;

export function homeBody({ rules, samples, guides }) {
  const bookmarklet = `javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/a11ymedic@${VERSION}/dist/a11ymedic.js';s.setAttribute('data-overlay','');document.body.appendChild(s)})()`;
  return `
<section class="cl-hero" aria-labelledby="hero-title">
  <div class="cl-wrap cl-hero-grid">
    <div class="cl-hero-copy">
      <p class="cl-eyebrow">Free accessibility checker for WCAG 2.2</p>
      <h1 id="hero-title">The accessibility checker that <span>explains every problem</span> and writes the fix.</h1>
      <p class="cl-lead">a11ymedic examines your pages with 61 WCAG 2.2 rules, tells you in plain language what is wrong and who it hurts, and hands you the patched HTML. Run it as a page overlay, from the command line, in CI or inside your tests.</p>
      <div class="cl-hero-cta">
        <a class="btn btn-primary btn-lg" href="#checkup">Start a check-up ${icons.arrow}</a>
        <button type="button" class="cl-npx" @click="copyText('npx a11ymedic index.html', 'npx')"><code><span aria-hidden="true">$</span> npx a11ymedic index.html</code><span class="cl-npx-copy" v-text="copied === 'npx' ? 'Copied' : 'Copy'">Copy</span></button>
      </div>
      <ul class="cl-vitals" aria-label="At a glance">
        <li><strong>61</strong><span>WCAG 2.2 rules</span></li>
        <li><strong>EN + PT</strong><span>plain language</span></li>
        <li><strong>OKLCH</strong><span>color fixes</span></li>
        <li><strong>1 diff</strong><span>safe auto fix</span></li>
      </ul>
    </div>
    <div class="cl-hero-art">
      <svg class="cl-ekg" viewBox="0 0 600 120" aria-hidden="true" preserveAspectRatio="none"><path d="M0 70h170l18-40 22 80 20-62 14 22h356"/></svg>
      <picture>
        <source srcset="assets/mascot-dark.svg" media="(prefers-color-scheme: dark)">
        <img class="cl-mascot" src="assets/mascot.svg" width="360" height="360" alt="Patch, the a11ymedic otter paramedic, holding a broken button with a bandage on it">
      </picture>
    </div>
  </div>
</section>

<section id="checkup" class="cl-section cl-checkup" aria-labelledby="checkup-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">Live demo</p>
      <h2 id="checkup-title">The check-up room</h2>
      <p>Pick a patient or paste your own HTML, then run the medic. Numbered pins appear on the page, and the diagnosis chart explains each problem with the exact fix. Press <strong>Treat</strong> to apply a fix to the live page and watch it heal.</p>
    </div>
    <div class="cl-room">
      <div class="cl-intake card">
        <div class="card-body">
          <h3 class="cl-card-title">Patient intake</h3>
          <div class="segmented segmented-block" role="radiogroup" aria-label="Patient source">
            <label class="segmented-item"><input type="radio" name="src" value="samples" v-model="tab" checked> Sample patients</label>
            <label class="segmented-item"><input type="radio" name="src" value="paste" v-model="tab"> Paste HTML</label>
          </div>
          <fieldset class="cl-samples" v-show="tab === 'samples'">
            <legend class="sr-only">Sample patient</legend>
            ${samples
              .map(
                (s, i) =>
                  `<label class="cl-sample"><input type="radio" name="sample" value="${s.id}" v-model="sample"${i === 0 ? " checked" : ""}><span><strong>${esc(s.name)}</strong><small>${esc(s.blurb)}</small></span></label>`,
              )
              .join("\n            ")}
          </fieldset>
          <div class="cl-paste" v-show="tab === 'paste'" style="display:none">
            <label for="paste-html">Your HTML</label>
            <textarea id="paste-html" class="textarea" rows="9" spellcheck="false" v-model="paste" placeholder="&lt;img src=&quot;team.jpg&quot;&gt;"></textarea>
          </div>
          <div class="cl-options">
            <div>
              <label for="opt-level">WCAG level</label>
              <select id="opt-level" class="select select-sm" v-model="level"><option value="A">A</option><option value="AA" selected>AA</option><option value="AAA">AAA</option></select>
            </div>
            <div>
              <span id="lang-label" class="cl-label">Report language</span>
              <div class="segmented segmented-sm" role="radiogroup" aria-labelledby="lang-label">
                <label class="segmented-item"><input type="radio" name="lang" value="en" v-model="lang" checked> English</label>
                <label class="segmented-item" lang="pt-BR"><input type="radio" name="lang" value="pt" v-model="lang"> Português</label>
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-block cl-run" @click="run()">${icons.play} Run the medic</button>
          <button type="button" class="btn btn-ghost btn-sm btn-block" @click="selfCheck()">Check this docs page instead</button>
        </div>
      </div>

      <div class="cl-exam">
        <div class="cl-browser">
          <div class="cl-browser-bar" aria-hidden="true"><i></i><i></i><i></i><span v-text="patientName">Bakery landing page</span></div>
          <iframe id="patient" title="Patient page under examination" sandbox="allow-same-origin" loading="lazy"></iframe>
        </div>
        <p class="cl-note">The patient page runs in a sandboxed frame with no scripts. Pins are buttons: select one to open its diagnosis.</p>
      </div>

      <section class="cl-chart card" aria-labelledby="chart-title">
        <div class="card-body">
          <div class="cl-chart-head">
            <h3 id="chart-title" class="cl-card-title" v-text="t.chart">Diagnosis chart</h3>
            <span class="cl-chart-meta" v-text="ran ? (total + ' ' + t.problems) : t.notYet">Not examined yet</span>
          </div>
          <ul class="cl-sev-row" aria-label="Problems by severity">
            ${SEV.map(([k]) => `<li data-sev="${k}"><strong v-text="counts.${k}">0</strong><span v-text="t.${k}">${k}</span></li>`).join("")}
          </ul>
          <div class="cl-treat-all" v-show="ran && total > 0" style="display:none">
            <button type="button" class="btn btn-sm btn-outline" @click="treatAll(true)" :disabled="safeCount === 0">${icons.bandage}<span v-text="t.treatSafe + ' (' + safeCount + ')'">Treat safe fixes</span></button>
            <button type="button" class="btn btn-sm btn-ghost" @click="treatAll(false)" v-text="t.treatAll">Treat everything</button>
            <button type="button" class="btn btn-sm btn-ghost" @click="run()" v-text="t.reset">Start over</button>
          </div>
          <p class="cl-healthy" v-show="ran && total === 0" style="display:none"><img src="assets/mascot-head.svg" width="48" height="48" alt=""><span v-text="t.healthy">Healthy.</span></p>
          <p class="cl-healed" role="status" v-text="status"></p>
          <ol class="cl-findings" aria-label="Findings">
            <li v-for="f in items" :key="f.key" class="cl-finding" :data-sev="f.severity" :class="{ 'is-open': open === f.i }" :id="'finding-' + f.i">
              <button type="button" class="cl-finding-head" @click="toggle(f.i)" :aria-expanded="open === f.i ? 'true' : 'false'" :aria-controls="'fbody-' + f.i">
                <span class="cl-num" :data-sev="f.severity" v-text="f.n" aria-hidden="true"></span>
                <span class="cl-finding-titles"><span class="cl-sev" v-text="f.sevLabel">severity</span><strong v-text="f.title">Finding</strong><span class="cl-msg" v-text="f.message"></span></span>
              </button>
              <div class="cl-finding-body" :id="'fbody-' + f.i" v-show="open === f.i">
                <h4 v-text="t.why">Why it matters</h4><p v-text="f.explanation"></p>
                <h4 v-text="t.who">Who is affected</h4><p v-text="f.affects"></p>
                <h4>WCAG</h4><p><a :href="f.wcagUrl" target="_blank" rel="noopener" v-text="f.wcagLabel"></a></p>
                <h4 v-text="t.fix">The fix</h4><p v-text="f.summary"></p>
                <div class="cl-rx">
                  <div><span class="cl-rx-label" v-text="t.before"></span><div class="cl-rx-code is-before" v-text="f.before"></div></div>
                  <div><span class="cl-rx-label" v-text="t.after"></span><div class="cl-rx-code is-after" v-text="f.after"></div></div>
                </div>
                <div class="cl-rx-actions">
                  <button type="button" class="btn btn-sm btn-primary" @click="treat(f.i)" v-show="f.treatable">${icons.bandage}<span v-text="t.treat">Treat on the page</span></button>
                  <button type="button" class="btn btn-sm btn-outline" @click="copyText(f.after, 'fix-' + f.i)" v-text="copied === 'fix-' + f.i ? t.copied : t.copy">Copy fix</button>
                  <span class="cl-safe" v-show="f.safe" v-text="t.safe"></span>
                </div>
                <p class="cl-selector"><code v-text="f.selector"></code></p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  </div>
</section>

<section id="contrast" class="cl-section cl-contrast" aria-labelledby="contrast-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">Contrast fixer</p>
      <h2 id="contrast-title">Find the closest accessible color pair</h2>
      <p>Pick a text color and a background. a11ymedic keeps the hue and moves only the OKLCH lightness until the pair passes, so your brand still looks like your brand. The same math powers the color-contrast fix in every report.</p>
    </div>
    <div class="cl-cf">
      <div class="card cl-cf-inputs"><div class="card-body">
        <div class="cl-cf-field">
          <label for="fg-text">Text color</label>
          <div class="cl-color-row"><input type="color" aria-label="Pick the text color" :value="hexOf(fg)" @input="fg = $event.target.value"><input id="fg-text" class="input" v-model="fg" spellcheck="false" autocomplete="off"></div>
        </div>
        <div class="cl-cf-field">
          <label for="bg-text">Background color</label>
          <div class="cl-color-row"><input type="color" aria-label="Pick the background color" :value="hexOf(bg)" @input="bg = $event.target.value"><input id="bg-text" class="input" v-model="bg" spellcheck="false" autocomplete="off"></div>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" @click="swap()">Swap colors</button>
        <div class="cl-cf-field">
          <label for="cf-target">Target</label>
          <select id="cf-target" class="select" v-model="target">
            <option value="4.5">AA, normal text (4.5:1)</option>
            <option value="3">AA, large text (3:1)</option>
            <option value="7">AAA, normal text (7:1)</option>
          </select>
        </div>
      </div></div>
      <div class="cl-cf-result">
        <div class="cl-cf-preview" data-a11ymedic-ignore :style="{ color: fg, background: bg }">
          <p class="cl-cf-big">Large text, 24px</p>
          <p>Normal body text at 16px. The quick brown otter jumps over the lazy bug.</p>
        </div>
        <div class="cl-cf-score" aria-live="polite">
          <p class="cl-ratio"><strong v-text="valid ? ratioText : '?'">4.5</strong><span>:1 contrast</span></p>
          <ul class="cl-checks">
            <li :data-ok="aaNormal ? 'yes' : 'no'"><span v-text="aaNormal ? 'Pass' : 'Fail'"></span> AA normal text</li>
            <li :data-ok="aaLarge ? 'yes' : 'no'"><span v-text="aaLarge ? 'Pass' : 'Fail'"></span> AA large text</li>
            <li :data-ok="aaaNormal ? 'yes' : 'no'"><span v-text="aaaNormal ? 'Pass' : 'Fail'"></span> AAA normal text</li>
          </ul>
          <p class="cl-cf-error" v-show="!valid">Type a CSS color: #0f8b8d, rgb(), hsl(), oklch() or a name.</p>
        </div>
        <div class="cl-cf-options" v-show="valid">
          <div class="cl-cf-option" v-show="optFg">
            <h3>Change the text</h3>
            <div class="cl-cf-swatch" :style="{ color: optFg ? optFg.foreground : '', background: optFg ? optFg.background : '' }">Aa</div>
            <p><code v-text="optFg ? optFg.foreground : ''"></code> on <code v-text="optFg ? optFg.background : ''"></code>, <strong v-text="optFg ? optFg.ratio : ''"></strong>:1</p>
            <button type="button" class="btn btn-sm btn-outline" @click="fg = optFg.foreground">Use this text color</button>
          </div>
          <div class="cl-cf-option" v-show="optBg">
            <h3>Change the background</h3>
            <div class="cl-cf-swatch" :style="{ color: optBg ? optBg.foreground : '', background: optBg ? optBg.background : '' }">Aa</div>
            <p><code v-text="optBg ? optBg.foreground : ''"></code> on <code v-text="optBg ? optBg.background : ''"></code>, <strong v-text="optBg ? optBg.ratio : ''"></strong>:1</p>
            <button type="button" class="btn btn-sm btn-outline" @click="bg = optBg.background">Use this background</button>
          </div>
          <div class="cl-cf-option" v-show="optBoth">
            <h3>Change both</h3>
            <div class="cl-cf-swatch" :style="{ color: optBoth ? optBoth.foreground : '', background: optBoth ? optBoth.background : '' }">Aa</div>
            <p><code v-text="optBoth ? optBoth.foreground : ''"></code> on <code v-text="optBoth ? optBoth.background : ''"></code>, <strong v-text="optBoth ? optBoth.ratio : ''"></strong>:1</p>
            <button type="button" class="btn btn-sm btn-outline" @click="fg = optBoth.foreground; bg = optBoth.background">Use this pair</button>
          </div>
          <p class="cl-cf-pass" v-show="passes">This pair already passes the target. Nothing to fix.</p>
        </div>
      </div>
    </div>
    <p class="cl-more">Read the guide: <a href="how-to-fix-color-contrast.html">How to fix color contrast</a>.</p>
  </div>
</section>

<section id="how" class="cl-section" aria-labelledby="how-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">How it works</p>
      <h2 id="how-title">Exam, diagnosis, treatment</h2>
    </div>
    <ol class="cl-steps">
      <li><picture><source srcset="assets/icons/dark/stethoscope.svg" media="(prefers-color-scheme: dark)"><img src="assets/icons/light/stethoscope.svg" width="40" height="40" alt=""></picture><h3>1. Exam</h3><p>An engine written from scratch runs 61 rules on a real DOM. In the browser it reads computed styles and real boxes. On Node it parses HTML with jsdom, cascades your CSS itself (specificity, variables, inheritance) and keeps line numbers.</p></li>
      <li><picture><source srcset="assets/icons/dark/report.svg" media="(prefers-color-scheme: dark)"><img src="assets/icons/light/report.svg" width="40" height="40" alt=""></picture><h3>2. Diagnosis</h3><p>Every finding says what is wrong with this exact element, why it matters, who is affected and which WCAG 2.2 criterion it breaks, in English and Portuguese, with the selector and the HTML snippet.</p></li>
      <li><picture><source srcset="assets/icons/dark/fix.svg" media="(prefers-color-scheme: dark)"><img src="assets/icons/light/fix.svg" width="40" height="40" alt=""></picture><h3>3. Treatment</h3><p>Each finding comes with patched code: the missing alt, aria-label or label for, a contrast safe color picked in OKLCH. Safe fixes apply in one command with a diff preview, and they are idempotent.</p></li>
    </ol>
  </div>
</section>

<section id="install" class="cl-section" aria-labelledby="install-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">Quick start</p>
      <h2 id="install-title">Four ways to call the medic</h2>
    </div>
    <div class="cl-ways">
      <article class="card"><div class="card-body">
        <h3>${wayIcon("overlay-pin")} On any page: script tag or bookmarklet</h3>
        <p>Add one script tag in development. Numbered pins mark each problem and a keyboard accessible side panel explains it. <kbd class="kbd kbd-sm">Alt</kbd> + <kbd class="kbd kbd-sm">Shift</kbd> + <kbd class="kbd kbd-sm">A</kbd> toggles it.</p>
        ${code("html", "index.html", `<script src="https://cdn.jsdelivr.net/npm/a11ymedic@${VERSION}/dist/a11ymedic.js" data-overlay></script>\n<!-- Portuguese: data-overlay="pt" -->`)}
        <p>Or drag this bookmarklet to your bookmarks bar and press it on any site: <a class="cl-bookmarklet" data-a11ymedic-ignore href="${esc(bookmarklet)}">a11ymedic check-up</a></p>
      </div></article>
      <article class="card"><div class="card-body">
        <h3>${wayIcon("cli")} Command line: files, globs and URLs</h3>
        <p>Check built HTML, a folder or a live URL. With Playwright or Puppeteer installed, URLs are checked in a headless browser; without them the HTML is fetched and checked statically.</p>
        ${code("sh", "Terminal", `npx a11ymedic "dist/**/*.html"\nnpx a11ymedic https://example.com --format html -o report.html\nnpx a11ymedic fix "src/**/*.html"          # preview safe fixes as a diff\nnpx a11ymedic fix "src/**/*.html" --write  # apply them`)}
      </div></article>
      <article class="card"><div class="card-body">
        <h3>${wayIcon("ci")} CI: fail the build on serious problems</h3>
        <p>On GitHub Actions a11ymedic prints annotations on the changed lines and writes a job summary on its own.</p>
        ${code("yaml", ".github/workflows/a11y.yml", `name: Accessibility\non: [push, pull_request]\njobs:\n  a11y:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm ci && npm run build\n      - run: npx a11ymedic "dist/**/*.html" --fail-on serious`)}
      </div></article>
      <article class="card"><div class="card-body">
        <h3>${wayIcon("report")} Tests: Vitest and Jest</h3>
        <p>Audit rendered components and get a readable failure with the fix for each problem.</p>
        ${code("ts", "button.test.ts", `import { audit } from "a11ymedic";\nimport "a11ymedic/vitest"; // Jest: setupFilesAfterEnv: ["a11ymedic/jest"]\n\ntest("the toolbar is accessible", async () => {\n  document.body.innerHTML = renderToolbar();\n  expect(await audit(document.body)).toHaveNoViolations();\n});`)}
      </div></article>
    </div>
    <h3 class="cl-subhead">Install from npm</h3>
    ${code("sh", "Terminal", `npm install --save-dev a11ymedic`, true)}
    <h3 class="cl-subhead">With your framework</h3>
    <div class="cl-fw">
      ${code("tsx", "React: Toolbar.test.tsx", `import { render } from "@testing-library/react";\nimport { audit } from "a11ymedic";\nimport "a11ymedic/vitest";\n\ntest("Toolbar", async () => {\n  const { container } = render(<Toolbar />);\n  expect(await audit(container)).toHaveNoViolations({ severity: "serious" });\n});`)}
      ${code("ts", "Vue: Card.spec.ts", `import { mount } from "@vue/test-utils";\nimport { audit } from "a11ymedic";\nimport "a11ymedic/vitest";\n\nit("Card", async () => {\n  const wrapper = mount(Card, { props: { title: "Plans" }, attachTo: document.body });\n  expect(await audit(wrapper.element)).toHaveNoViolations();\n});`)}
      ${code("ts", "Angular: card.component.spec.ts", `import { audit } from "a11ymedic";\n\nit("is accessible", async () => {\n  const fixture = TestBed.createComponent(CardComponent);\n  fixture.detectChanges();\n  const result = await audit(fixture.nativeElement);\n  expect(result.findings).toEqual([]);\n});`)}
      ${code("tsx", "Next.js: app/layout.tsx (development only)", `import Script from "next/script";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        {process.env.NODE_ENV === "development" && (\n          <Script src="https://cdn.jsdelivr.net/npm/a11ymedic@${VERSION}/dist/a11ymedic.js" data-overlay />\n        )}\n      </body>\n    </html>\n  );\n}`)}
    </div>
  </div>
</section>

<section id="rules" class="cl-section" aria-labelledby="rules-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">Rule catalog</p>
      <h2 id="rules-title">61 rules mapped to WCAG 2.2</h2>
      <p>Every rule has a passing and a failing test fixture. The ones marked auto fix can be applied by <code>a11ymedic fix --write</code>; the others come with a suggested patch to review.</p>
    </div>
    <div class="cl-rule-tools">
      <div><label for="rq">Filter rules</label><input id="rq" class="input" type="search" v-model="rq" placeholder="contrast, aria, 1.4.3, forms" autocomplete="off"></div>
      <div><label for="rsev">Severity</label><select id="rsev" class="select" v-model="rsev"><option value="all">All</option>${SEV.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div>
    </div>
    <div class="cl-table-wrap" tabindex="0" role="region" aria-label="Rule catalog table">
      <table class="table cl-rules">
        <caption class="sr-only">a11ymedic rules with WCAG criterion, level, severity and auto fix support</caption>
        <thead><tr><th scope="col">Rule</th><th scope="col">What it finds</th><th scope="col">WCAG</th><th scope="col">Level</th><th scope="col">Severity</th><th scope="col">Auto fix</th></tr></thead>
        <tbody>
${ruleRows(rules)}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section id="api" class="cl-section" aria-labelledby="api-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">API</p>
      <h2 id="api-title">A small API for scripts and tests</h2>
    </div>
    <div class="cl-api">
      ${code("ts", "audit.ts", `import { audit, fixHtml, suggestColors, formatText } from "a11ymedic";\n\nconst result = await audit('<img src="team.jpg">', { level: "AA", lang: "en" });\nconst [finding] = result.findings;\nfinding.rule;         // "image-alt"\nfinding.severity;     // "critical"\nfinding.message.pt;   // plain language, English and Portuguese\nfinding.wcag[0].url;  // https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html\nfinding.fix.after;    // '<img src="team.jpg" alt="Team">'\n\nconsole.log(formatText(result));\n\nconst { output, applied } = await fixHtml(html);   // safe fixes only\nsuggestColors("#999999", "#ffffff").foreground;     // "#767676"`)}
      <table class="table cl-api-table">
        <caption class="sr-only">Main functions</caption>
        <thead><tr><th scope="col">Function</th><th scope="col">What it does</th></tr></thead>
        <tbody>
          <tr><td><code>audit(html | document | element, options?)</code></td><td>Runs the rules. Returns findings (most severe first), human checks and counts.</td></tr>
          <tr><td><code>auditDocument(root, options?)</code></td><td>The same, synchronous, for a live DOM.</td></tr>
          <tr><td><code>fixHtml(html, options?)</code></td><td>Applies safe fixes to source text and keeps formatting. Idempotent.</td></tr>
          <tr><td><code>applyFix(finding)</code></td><td>Applies one fix to the live DOM.</td></tr>
          <tr><td><code>contrastRatio(fg, bg)</code>, <code>suggestColors(fg, bg, { ratio })</code></td><td>WCAG contrast and the closest passing pair in OKLCH.</td></tr>
          <tr><td><code>accessibleName(el)</code>, <code>getRole(el)</code></td><td>Accessible name and role, as assistive technology sees them.</td></tr>
          <tr><td><code>formatText</code>, <code>toJSON</code>, <code>toMarkdown</code>, <code>toHtml</code>, <code>githubAnnotations</code>, <code>githubSummary</code></td><td>Reports.</td></tr>
          <tr><td><code>overlay(options?)</code>, <code>drawPins(doc, findings)</code></td><td>Browser build only: the pins and panel.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="cl-more">Full reference with every option: <a href="${REPO}#api">README on GitHub</a>.</p>
  </div>
</section>

<section id="guides" class="cl-section" aria-labelledby="guides-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-eyebrow">Guides</p>
      <h2 id="guides-title">Accessibility, explained by the medic</h2>
    </div>
    <ul class="cl-guides">
      ${guides.map((g) => `<li><a href="${g.slug}.html"><strong>${esc(g.h1)}</strong><span>${esc(g.description)}</span></a></li>`).join("\n      ")}
      <li><a href="wcag-cheat-sheet.html"><strong>WCAG 2.2 cheat sheet in plain language</strong><span>Every A and AA success criterion in one or two sentences, with the a11ymedic rules that check it.</span></a></li>
    </ul>
  </div>
</section>

<section id="faq" class="cl-section" aria-labelledby="faq-title">
  <div class="cl-wrap cl-narrow">
    <div class="cl-section-head">
      <p class="cl-eyebrow">FAQ</p>
      <h2 id="faq-title">Questions people ask the medic</h2>
    </div>
    ${HOME_FAQ.map((f) => `<details class="cl-faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n    ")}
  </div>
</section>
`;
}
