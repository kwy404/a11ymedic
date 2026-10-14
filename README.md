<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-light.svg" width="860" alt="a11ymedic, the accessibility clinic for websites: Patch the otter paramedic treats a sick browser window on a stretcher, next to the words find accessibility problems, get the exact fix">
  </picture>
</p>

<h1 align="center">a11ymedic: the accessibility checker that explains every problem and gives the exact fix</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/v/a11ymedic?color=0f8b8d&label=npm" alt="a11ymedic npm version"></a>
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/dm/a11ymedic?color=0f8b8d" alt="a11ymedic npm downloads per month"></a>
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/dt/a11ymedic?color=0f8b8d" alt="a11ymedic total npm downloads"></a>
  <a href="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml"><img src="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml/badge.svg" alt="CI status of the a11ymedic accessibility checker"></a>
  <a href="https://github.com/kwy404/a11ymedic/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/a11ymedic?color=0f8b8d" alt="MIT license"></a>
  <a href="https://github.com/kwy404/a11ymedic/blob/main/scripts/size.mjs"><img src="https://img.shields.io/badge/browser%20build-68%20kB%20gzip-0f8b8d" alt="Browser build is about 68 kB gzipped"></a>
  <a href="https://kwy404.github.io/a11ymedic/#rules"><img src="https://img.shields.io/badge/WCAG%202.2%20rules-61-ff7a66" alt="61 WCAG 2.2 rules"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/a11ymedic/">Website and live check-up</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/#contrast">Contrast fixer</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html">WCAG 2.2 cheat sheet</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/guides.html">Guides</a> &middot;
  <a href="https://github.com/kwy404/a11ymedic/blob/main/i18n/README.pt-BR.md">Leia em Português (pt-BR)</a>
</p>

**a11ymedic is a free, open source website accessibility checker for WCAG 2.2.** It examines a page with 61 rules and, for every problem, tells you in plain language (English and Portuguese) what is wrong, why it matters, who is affected and which WCAG success criterion it breaks, then hands you the exact fix: the patched HTML with the missing `alt`, `aria-label` or `<label for>`, or the closest accessible color pair computed in OKLCH. Safe fixes apply to your files with one command and a diff preview.

Use it as a **browser overlay** (one script tag or a bookmarklet), a **CLI** for files, globs and URLs, a **CI gate** with GitHub Actions annotations, or a **test matcher** for Vitest and Jest. The rules engine is written from scratch and does not depend on other accessibility engines.

```sh
npx a11ymedic index.html
```

```text
  CRITICAL Image without alt text [image-alt] x1
           WCAG 1.1.1 Non-text Content (A)
           Screen readers cannot see images. Without an alt attribute they read the file
           name (for example "IMG_2041.jpg") or skip the image, so the information in it
           is lost. ...
           Affects: Blind people using screen readers, people who turn images off to save
                   data, and anyone when the image fails to load.

    * This image has no alt attribute, so its content is invisible to screen reader users.
      index.html:12:7  #menu > div:nth-of-type(2) > img
      Fix: Describe what the image shows or does in a few words. Starting point: "Team".
      - <img src="team.jpg">
      + <img src="team.jpg" alt="Team">
```

<table>
  <tr>
    <td width="33%" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/report.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/report.svg" width="32" alt="Clipboard icon: accessibility report in plain language"></picture><br><b>Plain language</b><br>What is wrong, why it matters and who it hurts, in English and Portuguese.</td>
    <td width="33%" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/bandage.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/bandage.svg" width="32" alt="Bandage icon: exact accessibility fix"></picture><br><b>The exact fix</b><br>Patched HTML for every finding, and safe auto fix with a diff preview.</td>
    <td width="33%" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/contrast.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/contrast.svg" width="32" alt="Half filled dial icon: color contrast checker"></picture><br><b>Real color contrast</b><br>Effective background with alpha, opacity and gradients; fixes that keep your hue.</td>
  </tr>
  <tr>
    <td width="33%" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/pin.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/pin.svg" width="32" alt="Map pin icon: accessibility overlay with numbered pins"></picture><br><b>Overlay and bookmarklet</b><br>Numbered pins on the page and a keyboard accessible side panel.</td>
    <td width="33%" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/terminal.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/terminal.svg" width="32" alt="Terminal icon: accessibility checker CLI"></picture><br><b>CLI for files and URLs</b><br>Globs, folders and live sites. Text, JSON, HTML and Markdown reports.</td>
    <td width="33%" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/pipeline.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/pipeline.svg" width="32" alt="Pipeline icon: accessibility testing in CI"></picture><br><b>CI and tests</b><br><code>--fail-on serious</code>, GitHub annotations and <code>toHaveNoViolations()</code>.</td>
  </tr>
</table>

Every finding names the people it hurts:

<table>
  <tr>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/screen-reader.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/screen-reader.svg" width="28" alt="Screen reader users icon"></picture><br><sub>Screen reader users</sub></td>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/low-vision.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/low-vision.svg" width="28" alt="Low vision icon"></picture><br><sub>Low vision</sub></td>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/color-blind.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/color-blind.svg" width="28" alt="Color blindness icon"></picture><br><sub>Color blindness</sub></td>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/keyboard-only.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/keyboard-only.svg" width="28" alt="Keyboard only icon"></picture><br><sub>Keyboard only</sub></td>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/cognitive.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/cognitive.svg" width="28" alt="Cognitive and learning icon"></picture><br><sub>Cognitive and learning</sub></td>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/motor.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/motor.svg" width="28" alt="Motor and dexterity icon"></picture><br><sub>Motor and dexterity</sub></td>
    <td align="center" valign="top"><picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/deaf.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/deaf.svg" width="28" alt="Deaf and hard of hearing icon"></picture><br><sub>Deaf and hard of hearing</sub></td>
  </tr>
</table>

## Table of contents

- [Quick start](#quick-start)
- [What it checks](#what-it-checks)
- [The browser overlay and bookmarklet](#the-browser-overlay-and-bookmarklet)
- [Command line](#command-line)
- [Auto fix](#auto-fix)
- [Accessibility testing in CI](#accessibility-testing-in-ci)
- [Tests with Vitest and Jest](#tests-with-vitest-and-jest)
- [Use with React, Vue, Angular, Next.js and plain HTML](#use-with-react-vue-angular-nextjs-and-plain-html)
- [API](#api)
- [How color contrast fixes work](#how-color-contrast-fixes-work)
- [Limits](#limits)
- [Comparison](#comparison)
- [FAQ](#faq)
- [Guides](#guides)
- [More from kwy404](#more-from-kwy404)
- [Author](#author)
- [License](#license)

## Quick start

**On any page, from a CDN.** Pin the version so the file never changes under you:

```html
<script src="https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js" data-overlay></script>
```

**From npm**, for the CLI, CI and tests (Node 18 or newer):

```sh
npm install --save-dev a11ymedic
npx a11ymedic "src/**/*.html"
```

**From code:**

```js
import { audit } from "a11ymedic";

const result = await audit('<button><svg class="icon-trash"></svg></button>');
result.findings[0].message.en; // 'This button only has an icon and no name. The icon suggests "Delete".'
result.findings[0].fix.after;  // '<button aria-label="Delete"><svg class="icon-trash"></svg></button>'
```

Try it without installing anything in the [live check-up room](https://kwy404.github.io/a11ymedic/#checkup).

## What it checks

61 rules, each mapped to WCAG 2.2 success criteria with a severity (critical, serious, moderate, minor). Every rule has a passing and a failing test fixture. The [full catalog](https://kwy404.github.io/a11ymedic/#rules) is on the website; `npx a11ymedic rules` prints it.

| Area | Rules |
| --- | --- |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/images.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/images.svg" width="20" alt="Images icon"></picture> Images | `image-alt` (decorative vs informative heuristics), `image-alt-quality` (file names, "image of", placeholders, repeated text), `input-image-alt`, `area-alt`, `role-img-alt`, `object-alt` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/names.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/names.svg" width="20" alt="Names icon"></picture> Names | `button-name` (guesses the label from icon classes), `link-name`, `link-text-generic` ("click here", "read more", also in Portuguese), `label-in-name`, `aria-dialog-name`, `aria-widget-name` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/forms.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/forms.svg" width="20" alt="Forms icon"></picture> Forms | `label` (placeholder only, title only), `autocomplete-valid`, `input-purpose`, `paste-blocked` (WCAG 2.2 accessible authentication), `radio-group` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/contrast.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/contrast.svg" width="20" alt="Color icon"></picture> Color | `color-contrast` (AA), `color-contrast-enhanced` (AAA) with the effective background, alpha, opacity, gradients and large text thresholds |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/language.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/language.svg" width="20" alt="Document icon"></picture> Document | `html-has-lang` (detects the language), `html-lang-valid`, `valid-lang`, `document-title`, `meta-viewport` (zoom disabled), `meta-refresh` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/structure.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/structure.svg" width="20" alt="Structure icon"></picture> Structure | `heading-order`, `page-has-heading-one`, `empty-heading`, `landmark-one-main`, `landmark-unique`, `region`, `bypass`, `skip-link`, `list`, `listitem`, `definition-list`, `duplicate-id` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/aria.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/aria.svg" width="20" alt="ARIA icon"></picture> ARIA | `aria-valid-role`, `aria-valid-attr` (typo suggestions), `aria-valid-attr-value`, `aria-required-attr`, `aria-hidden-focus`, `aria-hidden-body`, `aria-prohibited-label`, `aria-required-parent`, `presentation-role-conflict` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/keyboard.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/keyboard.svg" width="20" alt="Keyboard icon"></picture> Keyboard | `tabindex` (positive values), `focus-visible` (`outline: none` without a replacement, read from your stylesheets), `nested-interactive`, `keyboard-click-handler`, `link-as-button`, `target-size` (24 by 24 CSS pixels with the spacing exception) |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/media.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/media.svg" width="20" alt="Media and motion icon"></picture> Media and motion | `autoplay-media`, `video-caption`, `blink-marquee`, `motion-reduced` (large or endless animations without `prefers-reduced-motion`), `frame-title`, `frame-title-unique` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/dark/tables.svg"><img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/icons/light/tables.svg" width="20" alt="Tables icon"></picture> Tables | `table-headers`, `th-scope-valid`, `empty-table-header` |

**Every finding has:**

```ts
{
  rule: "color-contrast",
  severity: "serious",
  title:       { en: "Text with low color contrast", pt: "Texto com baixo contraste de cor" },
  message:     { en: "Contrast is 2.84:1 (#999999 on #ffffff). Normal text needs 4.5:1.", pt: "..." },
  explanation: { en: "Light gray text on white ...", pt: "..." },   // why it matters
  affects:     { en: "People with low vision, color blindness ...", pt: "..." },
  wcag: [{ id: "1.4.3", name: "Contrast (Minimum)", level: "AA", url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" }],
  selector: "#pricing > p:nth-of-type(2)",
  html: '<p class="muted">Cancel anytime</p>',
  line: 42, column: 7,
  fix: {
    summary: { en: "Change the text color to #767676 (4.54:1), the closest color with the same hue that passes ...", pt: "..." },
    before: '<p class="muted">Cancel anytime</p>',
    after:  '<p class="muted" style="color: #767676">Cancel anytime</p>',
    safe: false,
  },
  data: { ratio: 2.84, required: 4.5, foreground: "#999999", background: "#ffffff", large: false, suggestion: { ... } },
}
```

Checks it cannot decide (text over a background image, a small target with unknown surroundings) are returned as `incomplete`, never guessed.

## The browser overlay and bookmarklet

Add the script in development (or press the bookmarklet on any site). It audits the page with real computed styles and layout, puts a numbered pin on every problem and opens a side panel with the explanation, the WCAG link and before and after code with a copy button.

```html
<script src="https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js" data-overlay></script>
<!-- Portuguese panel: data-overlay="pt" -->
```

- The panel is keyboard accessible: pins are buttons, findings expand with Enter, <kbd>Escape</kbd> closes it and <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> toggles it.
- It lives in a shadow root, ignores itself and never changes the page for visitors.
- From the console: `a11ymedic.overlay({ lang: "pt", level: "AAA" })`.

**Bookmarklet:** create a bookmark with this URL (or drag it from the [website](https://kwy404.github.io/a11ymedic/#install)):

```text
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js';s.setAttribute('data-overlay','');document.body.appendChild(s)})()
```

## Command line

```sh
npx a11ymedic <files, globs, directories or URLs...> [options]
npx a11ymedic fix <files or globs...> [--write]
npx a11ymedic rules [--lang pt]
```

| Option | What it does |
| --- | --- |
| `-f, --format <text\|json\|html\|md\|github>` | Report format (default `text`). |
| `-o, --output <file>` | Write the report to a file. |
| `--fail-on <critical\|serious\|moderate\|minor\|none>` | Exit with 1 when a finding is at least this severe (default `minor`). |
| `--level <A\|AA\|AAA>` | Highest WCAG level to check (default `AA`). |
| `--lang <en\|pt>` | Report language. |
| `--rules <ids>`, `--disable <ids>` | Run only, or skip, some rules (comma separated). |
| `--exclude <selector>` | Ignore elements matching a CSS selector (repeatable). |
| `--browser`, `--no-browser` | Force or forbid a headless browser. |
| `--default-lang <code>` | Language used by the `lang` fix when it cannot be detected. |
| `--github`, `--no-github` | GitHub Actions annotations and job summary (on by default when `GITHUB_ACTIONS` is set). |
| `-q, --quiet`, `--no-color` | Only the summary line; plain output. |

**URLs** are checked in a headless browser when [Playwright](https://playwright.dev) or Puppeteer is installed (optional peer dependencies), which gives real layout for target size and contrast. Without one, a11ymedic fetches the HTML and its same origin stylesheets and runs a static check. **Local files** are parsed with jsdom; linked local stylesheets are read from disk and cascaded with specificity, `!important`, custom properties, inheritance and media queries. Use `-` to read HTML from stdin.

## Auto fix

```sh
npx a11ymedic fix "src/**/*.html"          # preview: a unified diff of the safe fixes
npx a11ymedic fix "src/**/*.html" --write  # apply them
```

Only fixes that need no human decision are applied, and only to the exact characters involved, so formatting, comments and attribute order stay as they were. Running it twice changes nothing.

| Safe fix | Example |
| --- | --- |
| Empty `alt` on decorative images | spacer GIFs, 1 by 1 pixels, images next to the same text |
| Clean alt text | `alt="image of a cat"` becomes `alt="A cat"` |
| Positive `tabindex` | `tabindex="3"` becomes `tabindex="0"` |
| Re-enable zoom | drops `user-scalable=no` and `maximum-scale=1` |
| Misspelled ARIA | `aria-labeledby` becomes `aria-labelledby`, invalid roles removed |
| Page title, language | `<title>` from the `h1`; `lang` when the language is detected or given with `--default-lang` |
| Autoplay | adds `muted` to media that plays sound on its own |
| Forms | valid `autocomplete` tokens (`e-mail` becomes `email`), removes paste blocking |
| Dialogs and tables | `aria-labelledby` to the dialog heading, `scope="column"` becomes `scope="col"` |

Everything else (alt text that describes a photo, label text, a new color) comes as a ready to paste suggestion in the report.

## Accessibility testing in CI

```yaml
# .github/workflows/accessibility.yml
name: Accessibility
on: [push, pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci && npm run build
      - run: npx a11ymedic "dist/**/*.html" --fail-on serious
```

On GitHub Actions a11ymedic prints `::error` and `::warning` annotations on the right file and line, and appends a table of results to the job summary. Add `--format html -o a11y-report.html` to keep a report as a build artifact.

## Tests with Vitest and Jest

```ts
// Vitest
import { audit } from "a11ymedic";
import "a11ymedic/vitest";

test("the signup form is accessible", async () => {
  document.body.innerHTML = renderSignup();
  expect(await audit(document.body)).toHaveNoViolations();
  // or only fail on serious and critical problems, and skip a rule:
  expect(await audit(document.body)).toHaveNoViolations({ severity: "serious", ignore: ["region"] });
});
```

```js
// Jest: jest.config.js
module.exports = { setupFilesAfterEnv: ["a11ymedic/jest"] };
```

A failing test prints every finding with its fix. HTML without `<html>`, `<head>` or `<body>` is treated as a component fragment, so page level rules (title, lang, landmarks) are skipped. Plain `import { toHaveNoViolations } from "a11ymedic/matchers"` works with any `expect.extend`.

## Use with React, Vue, Angular, Next.js and plain HTML

**React** (Testing Library):

```tsx
import { render } from "@testing-library/react";
import { audit } from "a11ymedic";
import "a11ymedic/vitest";

test("Toolbar", async () => {
  const { container } = render(<Toolbar />);
  expect(await audit(container)).toHaveNoViolations();
});
```

**Vue** (Vue Test Utils):

```ts
const wrapper = mount(Card, { props: { title: "Plans" }, attachTo: document.body });
expect(await audit(wrapper.element)).toHaveNoViolations();
```

**Angular**:

```ts
const fixture = TestBed.createComponent(CardComponent);
fixture.detectChanges();
expect((await audit(fixture.nativeElement)).findings).toEqual([]);
```

**Next.js**, the overlay in development only (`app/layout.tsx`):

```tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <Script src="https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js" data-overlay />
        )}
      </body>
    </html>
  );
}
```

**Plain HTML**: the script tag from the [quick start](#quick-start), or `npx a11ymedic "**/*.html"` on your build folder.

## API

```ts
import {
  audit, auditDocument, fixHtml, applyFix,
  contrastRatio, suggestColors, parseColor, toHex, toOklch, fromOklch, formatRatio,
  accessibleName, getRole, ruleList, RULES, CRITERIA,
  formatText, toJSON, toMarkdown, toHtml, githubAnnotations, githubSummary,
} from "a11ymedic";
```

| Function | Returns |
| --- | --- |
| `audit(input, options?)` | `Promise<AuditResult>`. `input` is an HTML string, a `Document` or an `Element`. Strings are parsed with `DOMParser` in browsers and jsdom on Node (with line numbers). |
| `auditDocument(root, options?)` | `AuditResult`, synchronously, for a live DOM. Uses computed styles and layout in real browsers. |
| `fixHtml(html, options?)` | `Promise<{ output, applied, remaining, changed }>`: safe fixes applied to the source text. |
| `applyFix(finding)` | Applies one finding's fix to the live DOM. Returns `false` when there is nothing to apply. |
| `contrastRatio(fg, bg)` | WCAG 2.x ratio from 1 to 21. Accepts any CSS color string or `{ r, g, b, a }`. |
| `suggestColors(fg, bg, { ratio? })` | The closest passing pair: `{ foreground, background, ratio, changed, foregroundOption, backgroundOption }`. |
| `parseColor(css)` | `{ r, g, b, a }` or `null`. Hex, names, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`. |
| `accessibleName(el)`, `getRole(el)` | The accessible name (accname for the common HTML and ARIA cases) and the role. |
| `ruleList()` | Metadata of every rule: id, title, explanation, who is affected, severity, WCAG, level, tags. |
| `formatText`, `toJSON`, `toMarkdown`, `toHtml` | Reports for one result or an array of results. `{ lang: "pt" }` for Portuguese. |
| `githubAnnotations`, `githubSummary` | Workflow commands and job summary Markdown. |

**Options** (`AuditOptions`): `level` (`"A" | "AA" | "AAA"`, default `"AA"`), `lang` (`"en" | "pt"`), `rules` and `disable` (rule ids), `exclude` (CSS selectors), `css` (extra stylesheets as strings), `styles` (`"auto" | "computed" | "static"`), `fragment` (skip page level rules), `defaultLang` (for the `lang` fix), `source` (echoed in reports). Elements with `data-a11ymedic-ignore` are skipped.

**Browser build only** (`window.a11ymedic`): `overlay(options?)` returns a controller with `refresh()`, `select(i)`, `setLang(lang)` and `close()`; `drawPins(document, findings, { lang, onSelect })`; `toggleOverlay()`.

## How color contrast fixes work

1. **The effective background.** a11ymedic walks from the text up to the page, painting every background color with its alpha and every ancestor `opacity` (premultiplied compositing), so `rgba(0,0,0,.5)` behind translucent text gives the color people actually see. Gradients are checked at every color stop and the worst one is reported; background images go to the human check list.
2. **The right threshold.** Text of 24px, or 18.66px and bold, is large text and needs 3:1; everything else needs 4.5:1 (7:1 and 4.5:1 at AAA). Ratios are never rounded up: 4.49 fails.
3. **The closest passing pair.** The text color is converted to OKLCH and only its lightness moves, darker or lighter, with a binary search until the pair passes after rounding to hex. Chroma is reduced only when the color would leave the sRGB gamut. The same is done for the background, and the smaller perceptual change (OKLab distance) wins. When neither color alone can reach the target, both move. `#999999` on white becomes `#767676`; a light blue stays blue.

## Limits

- **Static analysis has no layout.** On Node, without a headless browser, target size uses declared CSS sizes only and positioned overlays are not considered for contrast. Run with `--browser` (Playwright or Puppeteer) or use the overlay for layout aware checks.
- **Automated checks are not a full audit.** Whether alt text is accurate, captions are correct, a flow makes sense with a screen reader or focus order matches the visual order still needs people. See the [WCAG 2.2 cheat sheet](https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html) for what to check by hand.
- **JavaScript is not executed** when checking files statically; check the rendered DOM (tests, overlay, headless browser) for client side apps.
- The browser build is about 68 kB gzipped, mostly the explanations in two languages.

## Comparison

| | a11ymedic |
| --- | --- |
| Plain language explanation and who is affected, per finding | Yes, English and Portuguese |
| Patched HTML for every finding | Yes |
| Safe auto fix of source files, idempotent, with diff preview | Yes |
| Accessible color suggestions keeping the hue (OKLCH) | Yes |
| Browser overlay and bookmarklet | Yes |
| CLI for files, globs and URLs; JSON, HTML and Markdown reports | Yes |
| GitHub Actions annotations and job summary | Yes |
| Vitest and Jest matcher | Yes |
| Rule count | 61, WCAG 2.2 A, AA and two AAA |

## FAQ

<details>
<summary><b>What is a free website accessibility checker I can run locally?</b></summary>

`npx a11ymedic index.html` checks a file, `npx a11ymedic https://example.com` a live site and the script tag shows the problems on the page itself. It is MIT licensed and runs entirely on your machine.
</details>

<details>
<summary><b>How do I fix color contrast without changing my brand colors?</b></summary>

a11ymedic keeps the hue and chroma and only moves OKLCH lightness to the nearest passing value, so a brand blue becomes a darker blue, not black. Try two colors in the [contrast fixer](https://kwy404.github.io/a11ymedic/#contrast) or read [how to fix color contrast](https://kwy404.github.io/a11ymedic/how-to-fix-color-contrast.html).
</details>

<details>
<summary><b>How do I add accessibility testing to CI?</b></summary>

Run `npx a11ymedic "dist/**/*.html" --fail-on serious` after your build. On GitHub Actions you get annotations and a job summary automatically. In unit tests use `expect(await audit(html)).toHaveNoViolations()`.
</details>

<details>
<summary><b>What is the difference between aria-label and aria-labelledby?</b></summary>

`aria-label` holds the name as a string; `aria-labelledby` points to the ids of visible elements whose text becomes the name, and wins when both are present. a11ymedic computes the accessible name the way browsers do and flags missing targets and misspellings. Full guide: [aria-label vs aria-labelledby](https://kwy404.github.io/a11ymedic/aria-label-vs-aria-labelledby.html).
</details>

<details>
<summary><b>Is a11ymedic an accessibility overlay that fixes my site for users?</b></summary>

No. The overlay is a diagnosis tool for developers and designers and never changes the page for visitors. Fixes belong in your source code, and a11ymedic gives you the exact code. See [accessibility overlay vs real fixes](https://kwy404.github.io/a11ymedic/accessibility-overlay-vs-real-fixes.html).
</details>

<details>
<summary><b>Does it check WCAG 2.2?</b></summary>

Yes, including the 2.2 criteria that can be tested automatically: target size minimum (2.5.8) and accessible authentication (3.3.8, paste blocking). 4.1.1 Parsing is obsolete in 2.2, so duplicate ids are only reported when they break a label or ARIA reference (serious) or as a minor note.
</details>

<details>
<summary><b>Can I get the report in Portuguese?</b></summary>

Yes: `--lang pt` on the CLI, `{ lang: "pt" }` in the reports and `data-overlay="pt"` for the overlay. Every finding always carries both languages.
</details>

## Guides

- [Website accessibility checker: a free WCAG 2.2 audit](https://kwy404.github.io/a11ymedic/website-accessibility-checker.html)
- [How to fix color contrast](https://kwy404.github.io/a11ymedic/how-to-fix-color-contrast.html)
- [Alt text best practices](https://kwy404.github.io/a11ymedic/alt-text-best-practices.html)
- [Accessible form labels](https://kwy404.github.io/a11ymedic/accessible-form-labels.html)
- [WCAG 2.2 checklist](https://kwy404.github.io/a11ymedic/wcag-2-2-checklist.html)
- [Accessibility testing in CI](https://kwy404.github.io/a11ymedic/accessibility-testing-in-ci.html)
- [aria-label vs aria-labelledby](https://kwy404.github.io/a11ymedic/aria-label-vs-aria-labelledby.html)
- [Accessibility overlay vs real fixes](https://kwy404.github.io/a11ymedic/accessibility-overlay-vs-real-fixes.html)
- [WCAG 2.2 cheat sheet in plain language](https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html)

## More from kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): utility-first CSS with no build step.
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): JSX and reactivity in a plain HTML file.
- [breakhound](https://kwy404.github.io/breakhound/): find bugs in any JavaScript library automatically.
- [vueleap](https://kwy404.github.io/vueleap/): migrate Vue 2 to Vue 3 with one command.
- [graphemely](https://kwy404.github.io/graphemely/): truncate and count strings with emoji safely.
- [numberparrot](https://kwy404.github.io/numberparrot/): parse localized number and currency strings.
- [edgegoat](https://kwy404.github.io/edgegoat/): edge case test inputs for time zones, unicode and numbers.
- [cookieowl](https://kwy404.github.io/cookieowl/): cookie consent for LGPD and GDPR that really blocks trackers.
- [installkite](https://kwy404.github.io/installkite/): make any website installable and offline capable.
- [fontsketch](https://kwy404.github.io/fontsketch/): turn your handwriting into a font, free in your browser.
- [kastor](https://kwy404.github.io/kastor/): TypeScript ORM for PostgreSQL, MySQL, SQLite, SQL Server, Oracle, MongoDB and more.

## Contributing

Issues and pull requests are welcome. [CONTRIBUTING.md](https://github.com/kwy404/a11ymedic/blob/main/CONTRIBUTING.md) explains how a rule is built and tested; changes are listed in the [CHANGELOG](https://github.com/kwy404/a11ymedic/blob/main/CHANGELOG.md). Security reports: [SECURITY.md](https://github.com/kwy404/a11ymedic/blob/main/SECURITY.md).

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/assets/mascot-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/assets/mascot.svg" width="160" alt="Patch, the a11ymedic mascot: a kind otter paramedic with a medical bag marked with the accessibility symbol, holding a broken button covered by a bandage">
  </picture>
</p>

## Author

Created by **Alexandre Kohler** ([GitHub](https://github.com/kwy404) and [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

The [docs site](https://kwy404.github.io/a11ymedic/) is built with [Monsoon](https://kwy404.github.io/monsoon/), and its interactive parts are built with [Voodoo.js](https://kwy404.github.io/Voodoo.js/). Every illustration and icon (the clinic scene, nine spot illustrations and a family of 52 duotone icons, in light and dark) lives in [docs/assets/art](https://github.com/kwy404/a11ymedic/tree/main/docs/assets/art) and is drawn by [scripts/art/clinic.mjs](https://github.com/kwy404/a11ymedic/blob/main/scripts/art/clinic.mjs).

## License

[MIT](https://github.com/kwy404/a11ymedic/blob/main/LICENSE). Copyright 2026 Alexandre Kohler ([kwy404](https://github.com/kwy404)).
