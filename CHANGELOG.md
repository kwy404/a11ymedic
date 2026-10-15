# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-10-15

### Added

- A 0 to 100 health score on every result (`result.score`) and `score()` with the breakdown per rule and a grade: healthy, needs care, unwell or needs urgent care. Each failing rule takes points by severity, up to double when it repeats. A page with a critical or serious problem is never graded healthy.
- A local score history: `recordScore()`, `readHistory()` and `clearHistory()` keep each page's scores in localStorage (nothing leaves the browser). The overlay shows the score ring, how it changed since the last check and a small history line.
- A printable HTML report: score gauge, date, a table of documents, a "Print or save as PDF" button and a print layout that keeps each fix together. The overlay has a "Print report" button that opens it for the current page (`printReport()`), and saves it as a file when the browser blocks the new tab.
- A floating "Check this page" button: `<script src=".../a11ymedic.js" data-button>` or `launcher()`.
- `bookmarklet()` builds the bookmarklet URL. Pressing the bookmark again closes the panel instead of loading the script twice.
- CLI: `--min-score <0-100>` fails when a document scores below it, `--history <file>` keeps the scores in a JSON file and prints the change since the last run, and `a11ymedic bookmarklet` prints the bookmarklet.
- Text, Markdown and GitHub job summary reports show the score.

### Changed

- The overlay panel slides in, its score ring fills and the pins pop in, all only when the reader has not asked for reduced motion. The tools now sit on their own row under the title.
- Loading the browser build twice no longer binds Alt+Shift+A twice or opens two panels.

- Documentation site redesigned as an illustrated clinic: a hero scene of Patch the otter paramedic treating a sick browser window, a family of 52 duotone icons, nine spot illustrations, a medicine cabinet of rules, a contrast eye exam, a health gauge with a discharge stamp in the live check-up, and a WCAG cheat sheet that names the people each criterion helps. All art is SVG with light and dark variants in `docs/assets/art/`, drawn by `scripts/art/clinic.mjs`.
- The README banner and icons use the new art.

## [0.1.0] - 2026-10-13

### Added

- Rules engine written from scratch with 61 rules mapped to WCAG 2.2 success criteria and four severities.
- Plain language explanation, who is affected, WCAG link, selector, HTML snippet, source line and an exact fix for every finding, in English and Portuguese.
- Color contrast with the effective background (alpha, opacity, gradients), large text thresholds and accessible color suggestions that keep the hue (OKLCH).
- Accessible name and role computation for the common HTML and ARIA cases.
- Static CSS cascade for Node (specificity, `!important`, custom properties, inheritance, media queries, nesting) and computed styles with real layout in browsers.
- `fixHtml` and `a11ymedic fix` with a diff preview and `--write`: safe fixes only, idempotent, formatting preserved.
- Browser overlay with numbered pins and a keyboard accessible side panel, a bookmarklet and `applyFix` for the live DOM.
- CLI for files, globs, directories, stdin and URLs (headless browser when Playwright or Puppeteer is installed), with text, JSON, HTML, Markdown and GitHub reports, `--fail-on`, annotations and a job summary.
- `toHaveNoViolations` matcher for Vitest (`a11ymedic/vitest`) and Jest (`a11ymedic/jest`).
- Documentation site with a live check-up, a contrast fixer, a WCAG 2.2 cheat sheet and eight guides.

[Unreleased]: https://github.com/kwy404/a11ymedic/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/kwy404/a11ymedic/releases/tag/v0.2.0
[0.1.0]: https://github.com/kwy404/a11ymedic/releases/tag/v0.1.0
