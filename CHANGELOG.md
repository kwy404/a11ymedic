# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/kwy404/a11ymedic/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kwy404/a11ymedic/releases/tag/v0.1.0
