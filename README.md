<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/a11ymedic@main/docs/assets/art/banner-light.svg" width="860" alt="a11ymedic: Patch the otter paramedic treats a sick browser window on a stretcher">
  </picture>
</p>

<h1 align="center">a11ymedic</h1>

<p align="center">An accessibility checker that explains each problem in plain language and gives you the exact fix.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/a11ymedic"><img src="https://img.shields.io/npm/v/a11ymedic?color=0f8b8d&label=npm" alt="npm version"></a>
  <a href="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml"><img src="https://github.com/kwy404/a11ymedic/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/kwy404/a11ymedic/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/a11ymedic?color=0f8b8d" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/a11ymedic/">Website and live check-up</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html">WCAG 2.2 cheat sheet</a> &middot;
  <a href="https://kwy404.github.io/a11ymedic/guides.html">Guides</a> &middot;
  <a href="https://github.com/kwy404/a11ymedic/blob/main/i18n/README.pt-BR.md">Leia em Português</a>
</p>

a11ymedic checks a page with 61 WCAG 2.2 rules. For every problem it says what is wrong, why it matters and who it affects, in English or Portuguese, and hands you the patched HTML: the missing `alt`, `aria-label` or `<label>`, or the closest color pair that passes. Each page also gets a health score from 0 to 100.

It runs as a browser overlay or bookmarklet, a command line tool, a CI gate and a test matcher for Vitest and Jest. The rules engine is written from scratch.

The quickest way to try it is the [live check-up](https://kwy404.github.io/a11ymedic/): paste some HTML or a URL and press **Check it**.

## Quick start

```sh
npx a11ymedic index.html
```

```text
  CRITICAL Image without alt text [image-alt] x1
           WCAG 1.1.1 Non-text Content (A)
           Screen readers cannot see images. Without an alt attribute they read the file
           name (for example "IMG_2041.jpg") or skip the image ...

    * This image has no alt attribute, so its content is invisible to screen reader users.
      index.html:12:7  #menu > div:nth-of-type(2) > img
      Fix: Describe what the image shows or does in a few words. Starting point: "Team".
      - <img src="team.jpg">
      + <img src="team.jpg" alt="Team">
```

Install it in a project (Node 18 or newer):

```sh
npm install --save-dev a11ymedic
```

Or call it from code:

```js
import { audit } from "a11ymedic";

const result = await audit('<button><svg class="icon-trash"></svg></button>');
result.score;                 // 0 to 100
result.findings[0].fix.after; // '<button aria-label="Delete"><svg class="icon-trash"></svg></button>'
```

## Check any page in the browser

**Bookmarklet.** Drag it from the [website](https://kwy404.github.io/a11ymedic/#install) to your bookmarks bar, or print it with `npx a11ymedic bookmarklet`, then press it on any site. Pressing it again closes the panel.

**Script tag**, for development builds:

```html
<script src="https://cdn.jsdelivr.net/npm/a11ymedic@0.1.0/dist/a11ymedic.js" data-overlay></script>
<!-- data-overlay="pt" for Portuguese, or data-button for a floating "Check this page" button -->
```

The overlay puts a numbered pin on every problem and opens a side panel with the explanation, the WCAG link and the fix. Pins are buttons, <kbd>Escape</kbd> closes the panel and <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> toggles it. The panel shows the health score and how it changed since your last check of the same page (kept in `localStorage`, it never leaves the browser), and **Print report** opens a print friendly report you can save as PDF. The overlay is a tool for the people who build the site; it never changes the page for visitors.

## Command line

```sh
npx a11ymedic <files, globs, folders or URLs...> [options]
npx a11ymedic fix <files or globs...> [--write]
npx a11ymedic rules [--lang pt]
npx a11ymedic bookmarklet [--lang pt]
```

| Option | What it does |
| --- | --- |
| `-f, --format <text\|json\|html\|md\|github>` | Report format. The HTML report has the score and a print layout. |
| `-o, --output <file>` | Write the report to a file. |
| `--fail-on <severity\|none>` | Exit with 1 when a finding is at least this severe (default `minor`). |
| `--min-score <0-100>` | Exit with 1 when a document scores below this. |
| `--history <file>` | Keep the score of each document in a JSON file and show the change. |
| `--level <A\|AA\|AAA>` | Highest WCAG level to check (default `AA`). |
| `--lang <en\|pt>` | Report language. |
| `--rules <ids>`, `--disable <ids>` | Run only, or skip, some rules. |
| `--exclude <selector>` | Ignore elements that match a CSS selector. |
| `--browser`, `--no-browser` | Force or forbid a headless browser. |

Run `npx a11ymedic --help` for the full list. URLs are checked in a headless browser when Playwright or Puppeteer is installed; without one, the HTML and its stylesheets are fetched and checked statically. Local files are parsed with jsdom and your linked CSS is applied.

### Auto fix

```sh
npx a11ymedic fix "src/**/*.html"          # preview the safe fixes as a diff
npx a11ymedic fix "src/**/*.html" --write  # apply them
```

Only fixes that need no human decision are applied: an empty `alt` on spacer images, `tabindex="0"` instead of a positive value, zoom turned back on, misspelled ARIA attributes, a page title from the `h1`, `muted` on autoplaying media, valid `autocomplete` tokens and more. Formatting stays as it was, and running it twice changes nothing. Everything else, such as alt text for a photo or a label text, comes as a suggestion in the report.

## CI

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

On GitHub Actions a11ymedic adds annotations on the right file and line and writes a job summary. Use `--min-score 90` to gate on the score instead, and `--format html -o a11y-report.html` to keep a report as a build artifact.

## Tests with Vitest and Jest

```ts
import { audit } from "a11ymedic";
import "a11ymedic/vitest"; // Jest: setupFilesAfterEnv: ["a11ymedic/jest"]

test("the signup form is accessible", async () => {
  document.body.innerHTML = renderSignup();
  expect(await audit(document.body)).toHaveNoViolations();
  // only fail on serious and critical problems, and skip a rule:
  expect(await audit(document.body)).toHaveNoViolations({ severity: "serious", ignore: ["region"] });
});
```

This works the same with components rendered by React Testing Library, Vue Test Utils or Angular's TestBed. HTML without `<html>`, `<head>` or `<body>` is treated as a fragment, so page level rules (title, lang, landmarks) are skipped.

## What it checks

61 rules, each mapped to WCAG 2.2 success criteria with a severity (critical, serious, moderate or minor), in twelve groups: images, names, forms, color contrast, keyboard, zoom and touch targets, structure, language, media, motion and timing, tables and ARIA. The [rule list](https://kwy404.github.io/a11ymedic/#rules) is on the website, and `npx a11ymedic rules` prints it. Checks it cannot decide, such as text over a background image, are listed as human checks instead of guessed.

**The health score** starts at 100. Each failing rule takes points by severity (critical 12, serious 7, moderate 3, minor 1), up to double when it repeats on many elements. 90 and up is healthy, but a page with any critical or serious problem is never graded healthy.

**Color contrast fixes** keep your brand. a11ymedic works out the color people actually see behind the text (alpha, opacity and gradient stops included), converts the text color to OKLCH and moves only its lightness until the pair passes. It does the same for the background and suggests the smaller change: `#999999` on white becomes `#767676`, and a light blue stays blue.

## API

| Function | What it does |
| --- | --- |
| `audit(input, options?)` | Checks an HTML string, a `Document` or an `Element`. Returns findings (most severe first), human checks, counts and the score. |
| `auditDocument(root, options?)` | The same, synchronously, for a live DOM. |
| `fixHtml(html, options?)` | Applies the safe fixes to source text. |
| `applyFix(finding)` | Applies one fix to the live DOM. |
| `score(result)` | The 0 to 100 score with its grade and the rules that took points. |
| `recordScore(key, result)`, `readHistory(key)` | Keep and read a score history (in `localStorage` by default). |
| `contrastRatio(fg, bg)`, `suggestColors(fg, bg, { ratio })` | WCAG contrast and the closest passing pair. |
| `accessibleName(el)`, `getRole(el)` | The accessible name and role. |
| `formatText`, `toJSON`, `toMarkdown`, `toHtml` | Reports. The `toHtml` report is ready to print or save as PDF. |
| `bookmarklet({ lang })` | The `javascript:` URL of the bookmarklet. |
| `overlay(options?)`, `printReport(result)` | Browser build only: the pins and panel, and the print friendly report. |

Common options: `level` (`"A"`, `"AA"` or `"AAA"`), `lang` (`"en"` or `"pt"`), `rules`, `disable`, `exclude` and `fragment`. Elements with `data-a11ymedic-ignore` are skipped.

## Limits

- Automated checks are not a full audit. Whether alt text is accurate, captions are correct or a flow makes sense with a screen reader still needs people. The [WCAG 2.2 cheat sheet](https://kwy404.github.io/a11ymedic/wcag-cheat-sheet.html) says what to check by hand.
- Without a browser there is no layout: on Node, target size uses declared CSS sizes only. Use `--browser` or the overlay for layout aware checks.
- JavaScript does not run when files are checked statically. Check the rendered DOM (tests, overlay or a headless browser) for client side apps.
- The live check-up on the website can only read URLs from sites that allow it (CORS). For other sites, use the CLI or the bookmarklet.

## Guides

- [Fixing color contrast](https://kwy404.github.io/a11ymedic/how-to-fix-color-contrast.html)
- [Writing alt text](https://kwy404.github.io/a11ymedic/alt-text-best-practices.html)
- [Labeling form fields](https://kwy404.github.io/a11ymedic/accessible-form-labels.html)
- [Running accessibility checks in CI](https://kwy404.github.io/a11ymedic/accessibility-testing-in-ci.html)

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

Issues and pull requests are welcome. [CONTRIBUTING.md](https://github.com/kwy404/a11ymedic/blob/main/CONTRIBUTING.md) explains how a rule is built and tested, and changes are listed in the [CHANGELOG](https://github.com/kwy404/a11ymedic/blob/main/CHANGELOG.md). Security reports: [SECURITY.md](https://github.com/kwy404/a11ymedic/blob/main/SECURITY.md).

## Author

Created by **Alexandre Kohler** ([GitHub](https://github.com/kwy404) and [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

The [website](https://kwy404.github.io/a11ymedic/) is built with [Monsoon](https://kwy404.github.io/monsoon/), and its interactive parts are built with [Voodoo.js](https://kwy404.github.io/Voodoo.js/). Every illustration and icon is drawn by [scripts/art/clinic.mjs](https://github.com/kwy404/a11ymedic/blob/main/scripts/art/clinic.mjs).

## License

[MIT](https://github.com/kwy404/a11ymedic/blob/main/LICENSE). Copyright 2026 Alexandre Kohler.
