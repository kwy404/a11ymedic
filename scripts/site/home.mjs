// The home page: "the clinic". The waiting room (hero), the people every diagnosis names,
// the live check-up room, the contrast eye exam, the patient journey, four ways to call the
// medic, the medicine cabinet of rules, the API, the reading room and the FAQ.
import { icon, inline } from "../art/clinic.mjs";
import { code, divider, esc, icons, PEOPLE, REPO, VERSION } from "./layout.mjs";

export const HOME_FAQ = [
  {
    q: "Is a11ymedic free?",
    a: "Yes. It is open source under the MIT license. The checks run in your browser, on your machine or in your CI; there is no a11ymedic server and nothing to sign up for.",
  },
  {
    q: "How do I check a page that is already online?",
    a: "Type its address in the box at the top of this page. If the site does not let other pages read it, run npx a11ymedic https://your-site.com in a terminal, or press the bookmarklet on the page to see numbered pins on it.",
  },
  {
    q: "Can it fix problems automatically?",
    a: "It fixes the safe ones: a11ymedic fix \"src/**/*.html\" shows a diff and --write applies it. Safe fixes are things like an empty alt on a spacer image, tabindex 0 instead of 5, re-enabling zoom or a misspelled ARIA attribute. Anything that needs a human decision, such as alt text for a photo or a label text, comes as a suggestion to review.",
  },
  {
    q: "Does it replace testing with real people?",
    a: "No. Automated checks catch many common problems, but not all of them: whether alt text is accurate, whether a flow makes sense with a screen reader or whether captions are correct still need people. a11ymedic lists what it cannot decide as a human check.",
  },
  {
    q: "Does it work with React, Vue, Angular and Next.js?",
    a: "Yes. Test rendered components with expect(await audit(container)).toHaveNoViolations() in Vitest or Jest, check built HTML with the CLI, or load the overlay script in development.",
  },
  {
    q: "Does the overlay change my site for visitors?",
    a: "No. The overlay is a diagnosis tool for the people who build the site: it highlights problems and shows the fix. Real fixes belong in your source code.",
  },
];

const SEV = [
  ["critical", "Critical", "Treat now"],
  ["serious", "Serious", "Treat today"],
  ["moderate", "Moderate", "Book a visit"],
  ["minor", "Minor", "Keep an eye on"],
];

/** The medicine cabinet: twelve drawers, one per kind of problem. */
export const DRAWERS = [
  ["images", "Images", "images", "Alt text for pictures, icons, image maps and embedded objects.", ["image-alt", "image-alt-quality", "input-image-alt", "area-alt", "role-img-alt", "object-alt"]],
  ["names", "Names", "names", "Every button, link, dialog, widget and frame needs a name people can hear.", ["button-name", "link-name", "link-text-generic", "label-in-name", "aria-dialog-name", "aria-widget-name", "frame-title", "frame-title-unique"]],
  ["forms", "Forms", "forms", "Labels, autocomplete, grouped radios and paste that works.", ["label", "autocomplete-valid", "input-purpose", "paste-blocked", "radio-group"]],
  ["contrast", "Contrast", "contrast", "Text that is bright enough against its real background.", ["color-contrast", "color-contrast-enhanced"]],
  ["keyboard", "Keyboard", "keyboard", "Focus you can see, a sensible tab order and no mouse only controls.", ["tabindex", "focus-visible", "nested-interactive", "keyboard-click-handler", "link-as-button", "bypass", "skip-link"]],
  ["zoom", "Zoom and touch", "zoom", "Pinch zoom stays on and targets are big enough to hit.", ["meta-viewport", "target-size"]],
  ["structure", "Structure", "structure", "Titles, headings, landmarks and lists that screen readers can navigate.", ["document-title", "heading-order", "page-has-heading-one", "empty-heading", "landmark-one-main", "landmark-unique", "region", "list", "listitem", "definition-list", "duplicate-id"]],
  ["language", "Language", "language", "The right lang so words are read with the right voice.", ["html-has-lang", "html-lang-valid", "valid-lang"]],
  ["media", "Media", "media", "Captions for video and no sound that starts on its own.", ["video-caption", "autoplay-media"]],
  ["motion", "Motion and timing", "motion", "No blinking, no surprise refreshes, and motion that respects the setting.", ["blink-marquee", "motion-reduced", "meta-refresh"]],
  ["tables", "Tables", "tables", "Header cells that tie every data cell to its meaning.", ["table-headers", "th-scope-valid", "empty-table-header"]],
  ["aria", "ARIA", "aria", "Valid roles, attributes and values, and no hidden focusable content.", ["aria-valid-role", "aria-valid-attr", "aria-valid-attr-value", "aria-required-attr", "aria-hidden-focus", "aria-hidden-body", "aria-prohibited-label", "aria-required-parent", "presentation-role-conflict"]],
];

function cabinet(rules) {
  const byId = Object.fromEntries(rules.map((r) => [r.id, r]));
  const placed = new Set(DRAWERS.flatMap((d) => d[4]));
  const missing = rules.filter((r) => !placed.has(r.id)).map((r) => r.id);
  if (missing.length) throw new Error(`rules missing from the medicine cabinet: ${missing.join(", ")}`);
  const data = [];
  const drawers = DRAWERS.map(([key, label, ic, blurb, ids]) => {
    const items = ids.map((id) => {
      const r = byId[id];
      if (!r) throw new Error(`unknown rule ${id}`);
      const hay = `${r.id} ${r.title.en} ${r.tags.join(" ")} ${r.wcag.join(" ")} ${key} ${label}`.toLowerCase().replace(/['"\\]/g, "");
      data.push({ id: r.id, d: key, s: r.severity, h: hay });
      return `<li class="cl-rule" v-show="ruleVisible('${r.id}', rq, rsev)">
            <span class="cl-rule-head"><code class="cl-rule-id">${r.id}</code><span class="cl-triage" data-sev="${r.severity}">${r.severity}</span></span>
            <span class="cl-rule-title">${esc(r.title.en)}</span>
            <span class="cl-rule-meta">WCAG ${r.wcag.map((w) => `<a href="https://www.w3.org/WAI/WCAG22/Understanding/${r.wcagSlugs[w]}.html">${w}</a>`).join(", ")} <span aria-hidden="true">/</span> Level ${r.level}${r.autofix ? ` <span class="cl-autofix">${icon("bandage", "ic ic-xs")}auto fix</span>` : ""}</span>
          </li>`;
    });
    return `<details class="cl-drawer" data-drawer="${key}" v-show="drawerCount('${key}', rq, rsev) > 0">
        <summary>
          <span class="cl-drawer-plate">${icon(ic, "ic ic-lg")}<span class="cl-drawer-name">${label}</span></span>
          <span class="cl-drawer-blurb">${esc(blurb)}</span>
          <span class="cl-drawer-count" v-text="drawerCount('${key}', rq, rsev) + (drawerCount('${key}', rq, rsev) === 1 ? ' rule' : ' rules')">${ids.length} ${ids.length === 1 ? "rule" : "rules"}</span>
          <span class="cl-knob" aria-hidden="true"></span>
        </summary>
        <ul class="cl-rule-list">
          ${items.join("\n          ")}
        </ul>
      </details>`;
  });
  return { html: drawers.join("\n      "), data };
}

const triageCounts = SEV.map(
  ([k, label]) => `<li class="cl-tag" data-sev="${k}"><span class="cl-tag-hole" aria-hidden="true"></span><strong v-text="counts.${k}">0</strong><span v-text="t.${k}">${label.toLowerCase()}</span></li>`,
).join("");

const gauge = `<svg class="cl-gauge" viewBox="0 0 200 116" aria-hidden="true" focusable="false">
  <g fill="none" stroke-width="16"><path class="g-red" d="M20 100A80 80 0 0 1 75.28 23.92"/><path class="g-orange" d="M75.28 23.92A80 80 0 0 1 136.32 28.72"/><path class="g-yellow" d="M136.32 28.72A80 80 0 0 1 176.08 75.28"/><path class="g-green" d="M176.08 75.28A80 80 0 0 1 180 100"/></g>
  <path class="g-rim" d="M12 100A88 88 0 0 1 188 100M28 100A72 72 0 0 1 172 100" fill="none" stroke-width="2.5"/>
  <g class="cl-needle" :style="{ transform: 'rotate(' + (score * 1.8 - 90) + 'deg)' }"><path d="M100 100 97 98 100 30 103 98Z"/></g>
  <circle class="g-hub" cx="100" cy="100" r="8"/>
</svg>`;

/** What to do when the browser may not read a URL (CORS). Shown where the check started. */
function corsHelp(where) {
  return `<div class="cl-cors" role="alert" v-show="corsUrl && corsWhere === '${where}'" style="display:none">
          <p class="cl-cors-title">${icon("ambulance", "ic ic-sm")}<span>Your browser could not read <strong v-text="corsHost">that site</strong>.</span></p>
          <p>Most sites do not let other pages download them (a browser safety rule called CORS), so the check cannot start from here. Your site is not broken. These always work:</p>
          <ol>
            <li>In a terminal: <button type="button" class="cl-rx-slip cl-rx-slip-sm" @click="copyText('npx a11ymedic ' + corsUrl, 'cors-${where}')"><code v-text="'npx a11ymedic ' + corsUrl">npx a11ymedic</code><span class="cl-rx-copy">${icons.copy}<span v-text="copied === 'cors-${where}' ? 'Copied' : 'Copy'">Copy</span></span></button></li>
            <li>Open the page and press the <a href="#install">a11ymedic bookmarklet</a>: numbered pins appear on the page itself.</li>
            <li>Open the page, press <kbd class="kbd kbd-sm">Ctrl</kbd> + <kbd class="kbd kbd-sm">U</kbd> to see its source, then copy and paste it here.</li>
          </ol>
        </div>`;
}

export function homeBody({ rules, samples, guides, bookmarkletHref }) {
  const bookmarklet = bookmarkletHref ?? `javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/a11ymedic@${VERSION}/dist/a11ymedic.js';s.setAttribute('data-overlay','');document.body.appendChild(s)})()`;
  const cab = cabinet(rules);
  return `
<section class="cl-hero" aria-labelledby="hero-title">
  <div class="cl-wrap cl-hero-grid">
    <div class="cl-hero-copy">
      <p class="cl-nametag">${icon("stethoscope", "ic")}<span>Free accessibility checker for WCAG 2.2</span></p>
      <h1 id="hero-title">Paste your page. <span class="cl-hl">See what is wrong</span> and <span class="cl-hl cl-hl-coral">get the fix.</span></h1>
      <p class="cl-lead">a11ymedic checks 61 WCAG 2.2 rules, says in plain words what is wrong and who it hurts, and hands you the patched HTML. It runs in your browser: nothing is uploaded.</p>
      <form class="cl-quick" @submit.prevent="quickCheck()" novalidate>
        <label class="cl-quick-label" for="quick-input">Your HTML or a web address</label>
        <div class="cl-quick-box">
          <textarea id="quick-input" class="textarea cl-quick-input" rows="3" spellcheck="false" autocomplete="off" v-model="quick" @keydown.ctrl.enter.prevent="quickCheck()" @keydown.meta.enter.prevent="quickCheck()" aria-describedby="quick-hint" placeholder="&lt;img src=&quot;team.jpg&quot;&gt;  or  https://your-site.com"></textarea>
          <button type="submit" class="btn btn-primary btn-lg cl-btn cl-quick-go" :disabled="busy">${icon("stethoscope", "ic")}<span v-text="busy ? 'Checking' : 'Check it'">Check it</span></button>
        </div>
        <p id="quick-hint" class="cl-quick-hint">One tag or a whole page both work. <kbd class="kbd kbd-sm">Ctrl</kbd> + <kbd class="kbd kbd-sm">Enter</kbd> also checks it.</p>
        <p class="cl-quick-try"><span>Or try</span>
          <button type="button" class="cl-chip" @click="trySample('bakery')">a bakery page</button>
          <button type="button" class="cl-chip" @click="trySample('signup')">a sign-up form</button>
          <button type="button" class="cl-chip" @click="tryUrl('guides.html')">a URL from this site</button>
        </p>
        <p class="cl-quick-msg" role="status" v-text="quickMsg"></p>
        ${corsHelp("hero")}
      </form>
      <div class="cl-hero-alt">
        <span>Prefer the terminal?</span>
        <button type="button" class="cl-rx-slip" @click="copyText('npx a11ymedic index.html', 'npx')"><span class="cl-rx-mark" aria-hidden="true">Rx</span><code>npx a11ymedic index.html</code><span class="cl-rx-copy">${icons.copy}<span v-text="copied === 'npx' ? 'Copied' : 'Copy'">Copy</span></span></button>
      </div>
    </div>
    <figure class="cl-hero-art">
      ${inline.scene()}
      <figcaption class="cl-handnote"><span>Before: <code>&lt;img src="team.jpg"&gt;</code></span> <span class="cl-handnote-after">After: <code>&lt;img src="team.jpg" <ins>alt="Our team"</ins>&gt;</code></span></figcaption>
    </figure>
  </div>
</section>

<section id="checkup" class="cl-section cl-checkup" aria-labelledby="checkup-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-kicker">${icon("stethoscope", "ic ic-sm")}Live demo</p>
      <h2 id="checkup-title" tabindex="-1">The check-up room</h2>
      <p>Numbered pins mark each problem on the page. Open one in the chart to read the fix, then press <strong>Treat</strong> to apply it and watch the health score climb.</p>
    </div>
    <div class="cl-room">
      <div class="cl-intake cl-clipboard">
        <span class="cl-clip" aria-hidden="true"></span>
        <div class="cl-paper">
          <h3 class="cl-card-title">${icon("report", "ic")}Patient intake</h3>
          <div class="segmented segmented-block" role="radiogroup" aria-label="Patient source">
            <label class="segmented-item"><input type="radio" name="src" value="samples" v-model="tab" checked> Sample patients</label>
            <label class="segmented-item"><input type="radio" name="src" value="paste" v-model="tab"> HTML or URL</label>
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
            <label for="paste-html">Your HTML or a URL</label>
            <textarea id="paste-html" class="textarea" rows="9" spellcheck="false" v-model="paste" placeholder="&lt;img src=&quot;team.jpg&quot;&gt;"></textarea>
          </div>
          ${corsHelp("room")}
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
          <button type="button" class="btn btn-primary btn-block cl-btn cl-run" @click="run()">${icons.play} Run the medic</button>
          <button type="button" class="btn btn-ghost btn-sm btn-block" @click="selfCheck()">Check this docs page instead</button>
        </div>
      </div>

      <div class="cl-exam" :class="{ 'is-healing': healing }">
        <div class="cl-bedside">
          <div class="cl-browser">
            <div class="cl-browser-bar" aria-hidden="true"><i></i><i></i><i></i><span v-text="patientName">Bakery landing page</span></div>
            <iframe id="patient" title="Patient page under examination" sandbox="allow-same-origin" loading="lazy"></iframe>
          </div>
          <div class="cl-sparkles" aria-hidden="true">${icon("sparkle", "ic")}${icon("sparkle", "ic")}${icon("bandage", "ic")}${icon("sparkle", "ic")}</div>
        </div>
        <div class="cl-monitor">
          <div class="cl-monitor-gauge">
            ${gauge}
            <p class="cl-score"><strong v-text="shownScore">0</strong><span>health</span></p>
            <p class="cl-delta" v-show="delta > 0" style="display:none" v-text="'+' + delta + ' ' + t.since">+0</p>
          </div>
          <div class="cl-monitor-read">
            <div class="cl-moods" :data-mood="mood">
              <span class="cl-mood" data-m="sick">${inline.patient("sick")}</span>
              <span class="cl-mood" data-m="ok">${inline.patient("ok")}</span>
              <span class="cl-mood" data-m="happy">${inline.patient("happy")}</span>
            </div>
            <p class="cl-condition"><span class="cl-condition-label">Condition</span><strong v-text="conditionText">Waiting</strong></p>
            <svg class="cl-trace" :data-mood="mood" viewBox="0 0 220 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 22H40L48 8 58 34 66 4 74 28 80 22H130L138 8 148 34 156 4 164 28 170 22H220"/></svg>
          </div>
        </div>
        <p class="cl-note">The patient page runs in a sandboxed frame with no scripts. Pins are buttons: select one to open its diagnosis.</p>
      </div>

      <section class="cl-chart cl-clipboard" aria-labelledby="chart-title">
        <span class="cl-clip" aria-hidden="true"></span>
        <div class="cl-paper cl-paper-lined">
          <div class="cl-chart-head">
            <h3 id="chart-title" class="cl-card-title">${icon("chart", "ic")}<span v-text="t.chart">Diagnosis chart</span></h3>
            <span class="cl-chart-meta" v-text="ran ? (total + ' ' + t.problems) : t.notYet">Not examined yet</span>
          </div>
          <ul class="cl-tags" aria-label="Problems by severity">${triageCounts}</ul>
          <div class="cl-treat-all" v-show="ran && total > 0" style="display:none">
            <button type="button" class="btn btn-sm btn-primary cl-btn" @click="treatAll(true)" :disabled="safeCount === 0">${icons.bandage}<span v-text="t.treatSafe + ' (' + safeCount + ')'">Treat safe fixes</span></button>
            <button type="button" class="btn btn-sm btn-outline" @click="treatAll(false)" v-text="t.treatAll">Treat everything</button>
            <button type="button" class="btn btn-sm btn-ghost" @click="run()" v-text="t.reset">Start over</button>
            <button type="button" class="btn btn-sm btn-ghost" v-show="canPrint" style="display:none" @click="printChart()" v-text="t.print">Print report</button>
          </div>
          <div class="cl-discharged" v-show="ran && total === 0" style="display:none">
            ${inline.stamp()}
            <p v-text="t.healthy">Healthy: no problems found. Patch signs the discharge papers.</p>
            <button type="button" class="btn btn-sm btn-ghost" @click="run()" v-text="t.reset">Start over</button>
          </div>
          <p class="cl-healed" role="status" v-text="status"></p>
          <ol class="cl-findings" aria-label="Findings" :class="{ 'is-fresh': fresh }">
            <li v-for="f in items" :key="f.key" class="cl-finding" :data-sev="f.severity" :class="{ 'is-open': open === f.i }" :id="'finding-' + f.i">
              <button type="button" class="cl-finding-head" @click="toggle(f.i)" :aria-expanded="open === f.i ? 'true' : 'false'" :aria-controls="'fbody-' + f.i">
                <span class="cl-num" :data-sev="f.severity" v-text="f.n" aria-hidden="true"></span>
                <span class="cl-finding-titles"><span class="cl-sev" v-text="f.sevLabel">severity</span><strong v-text="f.title">Finding</strong><span class="cl-msg" v-text="f.message"></span></span>
              </button>
              <div class="cl-finding-body" :id="'fbody-' + f.i" v-show="open === f.i">
                <h4 v-text="t.why">Why it matters</h4><p v-text="f.explanation"></p>
                <h4 v-text="t.who">Who is affected</h4><p v-text="f.affects"></p>
                <h4>WCAG</h4><p><a :href="f.wcagUrl" target="_blank" rel="noopener" v-text="f.wcagLabel"></a></p>
                <div class="cl-rx">
                  <p class="cl-rx-head"><span class="cl-rx-mark" aria-hidden="true">Rx</span><span v-text="t.fix">The fix</span></p>
                  <p class="cl-rx-summary" v-text="f.summary"></p>
                  <div class="cl-rx-pair">
                    <div><span class="cl-rx-label" v-text="t.before"></span><div class="cl-rx-code is-before" v-text="f.before"></div></div>
                    <div><span class="cl-rx-label" v-text="t.after"></span><div class="cl-rx-code is-after" v-text="f.after"></div></div>
                  </div>
                  <div class="cl-rx-actions">
                    <button type="button" class="btn btn-sm btn-primary cl-btn" @click="treat(f.i)" v-show="f.treatable">${icons.bandage}<span v-text="t.treat">Treat on the page</span></button>
                    <button type="button" class="btn btn-sm btn-outline" @click="copyText(f.after, 'fix-' + f.i)" v-text="copied === 'fix-' + f.i ? t.copied : t.copy">Copy fix</button>
                    <span class="cl-safe" v-show="f.safe" v-text="t.safe"></span>
                  </div>
                  <p class="cl-rx-sign" aria-hidden="true">Dr. Patch</p>
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

<section id="how" class="cl-section cl-how" aria-labelledby="how-title">
  <div class="cl-wrap">
    <div class="cl-section-head cl-center">
      <p class="cl-kicker">${icon("ambulance", "ic ic-sm")}How it works</p>
      <h2 id="how-title">Exam, diagnosis, treatment</h2>
      <p>Three steps, the same everywhere: in this page, on any site, in the terminal, in CI and in your tests.</p>
    </div>
    <ol class="cl-journey" data-reveal>
      <li style="--step: 0">
        <span class="cl-station">${icon("stethoscope", "ic")}</span>
        <h3><span>1</span> Exam</h3>
        <div class="cl-mini" aria-hidden="true"><code class="cl-mini-code">&lt;button&gt;<b class="cl-mini-svg">&lt;svg&gt;</b>&lt;/button&gt;</code><span class="cl-mini-scan"></span></div>
        <p>61 rules run on a real page. In the browser a11ymedic reads the real colors and sizes; on Node it parses your HTML and applies your CSS itself.</p>
      </li>
      <li style="--step: 1">
        <span class="cl-station">${icon("chart", "ic")}</span>
        <h3><span>2</span> Diagnosis</h3>
        <div class="cl-mini" aria-hidden="true"><span class="cl-mini-finding"><span class="cl-num" data-sev="critical">1</span><span><strong>Button has no name</strong><small>Screen readers say only "button".</small></span></span></div>
        <p>Each problem says what is wrong with this exact element, why it matters, who it hurts and which WCAG 2.2 rule it breaks, in English and Portuguese.</p>
      </li>
      <li style="--step: 2">
        <span class="cl-station">${icon("bandage", "ic")}</span>
        <h3><span>3</span> Treatment</h3>
        <div class="cl-mini" aria-hidden="true"><code class="cl-mini-code">&lt;button <ins>aria-label="Search"</ins>&gt;&lt;svg&gt;&lt;/button&gt;</code></div>
        <p>Every finding comes with the patched code. Safe fixes apply in one command with a diff preview; the rest come ready to paste and review.</p>
      </li>
    </ol>
  </div>
</section>
${divider}
<section id="patients" class="cl-section cl-people-sec" aria-labelledby="people-title">
  <div class="cl-wrap">
    <div class="cl-section-head cl-center">
      <p class="cl-kicker">${icon("heart-pulse", "ic ic-sm")}Who it is for</p>
      <h2 id="people-title">Every diagnosis names who it hurts</h2>
      <p>A finding is not a lint warning. Each one says which people hit the barrier, so you know why the fix matters before you write it.</p>
    </div>
    <ul class="cl-people" data-reveal>
      ${Object.entries(PEOPLE).map(([key, [label, line]]) => `<li class="cl-person">${icon(key, "ic ic-xl")}<strong>${label}</strong><span>${line}</span></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="contrast" class="cl-section cl-eye-sec" aria-labelledby="contrast-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-kicker">${icon("low-vision", "ic ic-sm")}Contrast eye exam</p>
      <h2 id="contrast-title">Find the closest accessible color pair</h2>
      <p>Pick a text color and a background and read the chart. a11ymedic keeps the hue and moves only the OKLCH lightness until the pair passes, so your brand still looks like your brand. The same math writes the color-contrast fix in every report.</p>
    </div>
    <div class="cl-eye">
      <div class="cl-eye-controls cl-card">
        <div class="cl-cf-field">
          <label for="fg-text">Text color</label>
          <div class="cl-color-row"><input type="color" aria-label="Pick the text color" :value="hexOf(fg)" @input="fg = $event.target.value"><input id="fg-text" class="input" v-model="fg" spellcheck="false" autocomplete="off"></div>
        </div>
        <div class="cl-cf-field">
          <label for="bg-text">Background color</label>
          <div class="cl-color-row"><input type="color" aria-label="Pick the background color" :value="hexOf(bg)" @input="bg = $event.target.value"><input id="bg-text" class="input" v-model="bg" spellcheck="false" autocomplete="off"></div>
        </div>
        <button type="button" class="btn btn-sm btn-outline" @click="swap()">Swap colors</button>
        <div class="cl-cf-field">
          <label for="cf-target">Target</label>
          <select id="cf-target" class="select" v-model="target">
            <option value="4.5">AA, normal text (4.5:1)</option>
            <option value="3">AA, large text (3:1)</option>
            <option value="7">AAA, normal text (7:1)</option>
          </select>
        </div>
      </div>
      <div class="cl-eye-chart" :class="{ 'is-focusing': focusing }">
        <div class="cl-eye-card" data-a11ymedic-ignore :style="{ color: fg, background: bg }">
          <p class="cl-eye-e" aria-hidden="true">E</p>
          <p class="cl-eye-r2" aria-hidden="true">A 1 1 Y</p>
          <p class="cl-cf-big">Large text, 24px</p>
          <p class="cl-eye-small">Normal body text at 16px. The quick brown otter jumps over the lazy bug.</p>
        </div>
        <div class="cl-eye-reading" aria-live="polite">
          <p class="cl-ratio"><strong v-text="valid ? ratioText : '?'">4.5</strong><span>:1 contrast</span></p>
          <ul class="cl-checks">
            <li :data-ok="aaNormal ? 'yes' : 'no'"><span v-text="aaNormal ? 'Pass' : 'Fail'"></span> AA normal text</li>
            <li :data-ok="aaLarge ? 'yes' : 'no'"><span v-text="aaLarge ? 'Pass' : 'Fail'"></span> AA large text</li>
            <li :data-ok="aaaNormal ? 'yes' : 'no'"><span v-text="aaaNormal ? 'Pass' : 'Fail'"></span> AAA normal text</li>
          </ul>
          <p class="cl-cf-error" v-show="!valid">Type a CSS color: #0f8b8d, rgb(), hsl(), oklch() or a name.</p>
        </div>
      </div>
      <div class="cl-lenses" v-show="valid">
        <p class="cl-lenses-title">${icon("prescription", "ic")}Prescription lenses</p>
        <div class="cl-lens" v-show="optFg">
          <h3>Change the text</h3>
          <div class="cl-lens-glass" :style="{ color: optFg ? optFg.foreground : '', background: optFg ? optFg.background : '' }">Aa</div>
          <p><code v-text="optFg ? optFg.foreground : ''"></code> on <code v-text="optFg ? optFg.background : ''"></code>, <strong v-text="optFg ? optFg.ratio : ''"></strong>:1</p>
          <button type="button" class="btn btn-sm btn-outline" @click="useLens(optFg)">Use this text color</button>
        </div>
        <div class="cl-lens" v-show="optBg">
          <h3>Change the background</h3>
          <div class="cl-lens-glass" :style="{ color: optBg ? optBg.foreground : '', background: optBg ? optBg.background : '' }">Aa</div>
          <p><code v-text="optBg ? optBg.foreground : ''"></code> on <code v-text="optBg ? optBg.background : ''"></code>, <strong v-text="optBg ? optBg.ratio : ''"></strong>:1</p>
          <button type="button" class="btn btn-sm btn-outline" @click="useLens(optBg)">Use this background</button>
        </div>
        <div class="cl-lens" v-show="optBoth">
          <h3>Change both</h3>
          <div class="cl-lens-glass" :style="{ color: optBoth ? optBoth.foreground : '', background: optBoth ? optBoth.background : '' }">Aa</div>
          <p><code v-text="optBoth ? optBoth.foreground : ''"></code> on <code v-text="optBoth ? optBoth.background : ''"></code>, <strong v-text="optBoth ? optBoth.ratio : ''"></strong>:1</p>
          <button type="button" class="btn btn-sm btn-outline" @click="useLens(optBoth)">Use this pair</button>
        </div>
        <p class="cl-cf-pass" v-show="passes">${icon("sparkle", "ic ic-sm")}Perfect vision: this pair already passes the target.</p>
      </div>
    </div>
    <p class="cl-more">Read the guide: <a href="how-to-fix-color-contrast.html">How to fix color contrast without losing your brand</a>.</p>
  </div>
</section>
${divider}
<section id="install" class="cl-section cl-install" aria-labelledby="install-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-kicker">${icon("ambulance", "ic ic-sm")}Quick start</p>
      <h2 id="install-title">Four ways to call the medic</h2>
      <p>Same rules, same explanations and the same fixes wherever you run it.</p>
    </div>
    <div class="cl-folders" data-reveal>
      <article class="cl-folder" data-tone="coral"><p class="cl-folder-tab">${icon("pin", "ic ic-sm")}House call</p><div class="cl-folder-body">
        <h3>On any page: script tag or bookmarklet</h3>
        <p>Add one script tag in development. Numbered pins mark each problem and a keyboard accessible side panel explains it, with the health score, how it changed since your last check and a print friendly report. <kbd class="kbd kbd-sm">Alt</kbd> + <kbd class="kbd kbd-sm">Shift</kbd> + <kbd class="kbd kbd-sm">A</kbd> toggles it.</p>
        ${code("html", "index.html", `<script src="https://cdn.jsdelivr.net/npm/a11ymedic@${VERSION}/dist/a11ymedic.js" data-overlay></script>\n<!-- Portuguese: data-overlay="pt". A floating "Check this page" button: data-button -->`)}
        <p>Or drag this bookmarklet to your bookmarks bar and press it on any site: <a class="cl-bookmarklet" data-a11ymedic-ignore href="${esc(bookmarklet)}">${icon("first-aid", "ic ic-sm")}a11ymedic check-up</a></p>
      </div></article>
      <article class="cl-folder" data-tone="teal"><p class="cl-folder-tab">${icon("terminal", "ic ic-sm")}Walk-in clinic</p><div class="cl-folder-body">
        <h3>Command line: files, globs and URLs</h3>
        <p>Check built HTML, a folder or a live URL. With Playwright or Puppeteer installed, URLs are checked in a headless browser; without them the HTML is fetched and checked statically.</p>
        ${code("sh", "Terminal", `npx a11ymedic "dist/**/*.html"\nnpx a11ymedic https://example.com --format html -o report.html\nnpx a11ymedic fix "src/**/*.html"          # preview safe fixes as a diff\nnpx a11ymedic fix "src/**/*.html" --write  # apply them`)}
      </div></article>
      <article class="cl-folder" data-tone="yellow"><p class="cl-folder-tab">${icon("pipeline", "ic ic-sm")}Daily rounds</p><div class="cl-folder-body">
        <h3>CI: fail the build on serious problems</h3>
        <p>On GitHub Actions a11ymedic prints annotations on the changed lines and writes a job summary on its own.</p>
        ${code("yaml", ".github/workflows/a11y.yml", `name: Accessibility\non: [push, pull_request]\njobs:\n  a11y:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm ci && npm run build\n      - run: npx a11ymedic "dist/**/*.html" --fail-on serious`)}
      </div></article>
      <article class="cl-folder" data-tone="green"><p class="cl-folder-tab">${icon("test-tube", "ic ic-sm")}Lab tests</p><div class="cl-folder-body">
        <h3>Tests: Vitest and Jest</h3>
        <p>Audit rendered components and get a readable failure with the fix for each problem.</p>
        ${code("ts", "button.test.ts", `import { audit } from "a11ymedic";\nimport "a11ymedic/vitest"; // Jest: setupFilesAfterEnv: ["a11ymedic/jest"]\n\ntest("the toolbar is accessible", async () => {\n  document.body.innerHTML = renderToolbar();\n  expect(await audit(document.body)).toHaveNoViolations();\n});`)}
      </div></article>
    </div>
    <h3 class="cl-subhead">${icon("pill", "ic")}Install from npm</h3>
    ${code("sh", "Terminal", `npm install --save-dev a11ymedic`, true)}
    <h3 class="cl-subhead">${icon("test-tube", "ic")}With your framework</h3>
    <div class="cl-fw">
      ${code("tsx", "React: Toolbar.test.tsx", `import { render } from "@testing-library/react";\nimport { audit } from "a11ymedic";\nimport "a11ymedic/vitest";\n\ntest("Toolbar", async () => {\n  const { container } = render(<Toolbar />);\n  expect(await audit(container)).toHaveNoViolations({ severity: "serious" });\n});`)}
      ${code("ts", "Vue: Card.spec.ts", `import { mount } from "@vue/test-utils";\nimport { audit } from "a11ymedic";\nimport "a11ymedic/vitest";\n\nit("Card", async () => {\n  const wrapper = mount(Card, { props: { title: "Plans" }, attachTo: document.body });\n  expect(await audit(wrapper.element)).toHaveNoViolations();\n});`)}
      ${code("ts", "Angular: card.component.spec.ts", `import { audit } from "a11ymedic";\n\nit("is accessible", async () => {\n  const fixture = TestBed.createComponent(CardComponent);\n  fixture.detectChanges();\n  const result = await audit(fixture.nativeElement);\n  expect(result.findings).toEqual([]);\n});`)}
      ${code("tsx", "Next.js: app/layout.tsx (development only)", `import Script from "next/script";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        {process.env.NODE_ENV === "development" && (\n          <Script src="https://cdn.jsdelivr.net/npm/a11ymedic@${VERSION}/dist/a11ymedic.js" data-overlay />\n        )}\n      </body>\n    </html>\n  );\n}`)}
    </div>
  </div>
</section>
${divider}
<section id="rules" class="cl-section cl-cabinet-sec" aria-labelledby="rules-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-kicker">${icon("cabinet", "ic ic-sm")}Rule catalog</p>
      <h2 id="rules-title">61 rules mapped to WCAG 2.2</h2>
      <p>The medicine cabinet, sorted into twelve drawers. Every rule has a passing and a failing test fixture. The ones with a bandage are applied by <code>a11ymedic fix --write</code>; the others come with a suggested patch to review.</p>
    </div>
    <div class="cl-cabinet">
      <div class="cl-cabinet-sign"><span class="cl-cross" aria-hidden="true"></span><span>Medicine cabinet</span></div>
      <div class="cl-rule-tools">
        <div><label for="rq">Search the cabinet</label><input id="rq" class="input" type="search" v-model="rq" placeholder="contrast, aria, 1.4.3, forms" autocomplete="off"></div>
        <div><label for="rsev">Triage</label><select id="rsev" class="select" v-model="rsev"><option value="all">All severities</option>${SEV.map(([k, l, hint]) => `<option value="${k}">${l}: ${hint.toLowerCase()}</option>`).join("")}</select></div>
        <p class="cl-rule-total" aria-live="polite"><strong v-text="drawerTotal(rq, rsev)">61</strong> of 61 rules</p>
      </div>
      <div class="cl-drawers">
      ${cab.html}
      </div>
      <p class="cl-empty" v-show="drawerTotal(rq, rsev) === 0" style="display:none">${icon("magnifier", "ic")}Nothing in the cabinet matches. Try a WCAG number like 1.4.3 or a word like label.</p>
      <script type="application/json" id="rule-data">${JSON.stringify(cab.data)}</script>
    </div>
    <ul class="cl-triage-key" aria-label="Severity key">
      ${SEV.map(([k, l, hint]) => `<li><span class="cl-triage" data-sev="${k}">${l}</span> ${hint}</li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section id="api" class="cl-section" aria-labelledby="api-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-kicker">${icon("terminal", "ic ic-sm")}API</p>
      <h2 id="api-title">A small API for scripts and tests</h2>
    </div>
    <div class="cl-api">
      ${code("ts", "audit.ts", `import { audit, fixHtml, suggestColors, formatText } from "a11ymedic";\n\nconst result = await audit('<img src="team.jpg">', { level: "AA", lang: "en" });\nconst [finding] = result.findings;\nfinding.rule;         // "image-alt"\nfinding.severity;     // "critical"\nfinding.message.pt;   // plain language, English and Portuguese\nfinding.wcag[0].url;  // https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html\nfinding.fix.after;    // '<img src="team.jpg" alt="Team">'\n\nconsole.log(formatText(result));\n\nconst { output, applied } = await fixHtml(html);   // safe fixes only\nsuggestColors("#999999", "#ffffff").foreground;     // "#767676"`)}
      <div class="cl-table-wrap cl-card" tabindex="0" role="region" aria-label="Main functions">
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
            <tr><td><code>score(result)</code>, <code>recordScore(key, result)</code></td><td>The 0 to 100 health score, and a score history kept in localStorage.</td></tr>
            <tr><td><code>bookmarklet({ lang })</code></td><td>The bookmarklet URL.</td></tr>
            <tr><td><code>overlay(options?)</code>, <code>printReport(result)</code></td><td>Browser build only: the pins and panel, and the print friendly report.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="cl-more">Full reference with every option: <a href="${REPO}#api">README on GitHub</a>.</p>
  </div>
</section>
${divider}
<section id="guides" class="cl-section" aria-labelledby="guides-title">
  <div class="cl-wrap">
    <div class="cl-section-head">
      <p class="cl-kicker">${icon("book", "ic ic-sm")}The reading room</p>
      <h2 id="guides-title">Accessibility, explained by the medic</h2>
      <p>Short guides with the code to copy. Pick a pamphlet from the rack.</p>
    </div>
    ${pamphlets(guides)}
  </div>
</section>

<section id="faq" class="cl-section" aria-labelledby="faq-title">
  <div class="cl-wrap cl-narrow">
    <div class="cl-section-head cl-center">
      <p class="cl-kicker">${icon("heart-pulse", "ic ic-sm")}FAQ</p>
      <h2 id="faq-title">Questions people ask the medic</h2>
    </div>
    ${HOME_FAQ.map((f) => `<details class="cl-faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n    ")}
  </div>
</section>
`;
}

/** The guide rack: one pamphlet per guide with its spot illustration, plus the cheat sheet. */
export function pamphlets(guides, heading = "h3") {
  const cheat = `<li><a class="cl-pamphlet" href="wcag-cheat-sheet.html"><span class="cl-pamphlet-art cl-pour-art">${["eye", "hand", "lightbulb", "blocks"].map((n) => icon(n, "ic")).join("")}</span><span class="cl-pamphlet-kicker">${icon("clipboard-check", "ic ic-xs")}Cheat sheet</span><${heading} class="cl-pamphlet-title">WCAG 2.2 cheat sheet in plain language</${heading}><span class="cl-pamphlet-text">Every A and AA success criterion in one or two sentences, with the a11ymedic rules that check it.</span></a></li>`;
  return `<ul class="cl-pamphlets" data-reveal>
      ${guides.map((g) => `<li><a class="cl-pamphlet" href="${g.slug}.html"><span class="cl-pamphlet-art">${inline.spot(g.slug)}</span><span class="cl-pamphlet-kicker">${icon("book", "ic ic-xs")}Guide</span><${heading} class="cl-pamphlet-title">${esc(g.h1)}</${heading}><span class="cl-pamphlet-text">${esc(g.description)}</span></a></li>`).join("\n      ")}
      ${cheat}
    </ul>`;
}
