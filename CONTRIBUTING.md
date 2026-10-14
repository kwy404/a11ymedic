# Contributing to a11ymedic

Thanks for helping make the web easier to use for everyone.

## Setup

```sh
npm install
npm run build
npm test
```

Node 18 or newer is required (ESLint runs on Node 20 or newer).

## Project layout

- `src/engine.ts` runs rules and builds findings. `src/dom.ts` holds roles, accessible names, visibility and selectors. `src/style.ts` reads styles (computed in browsers, a static cascade on Node) and `src/css.ts` parses CSS.
- `src/rules/*.ts` holds the rules, grouped by topic. `src/fix.ts` turns fix operations into text edits on the source.
- `src/cli.ts`, `src/report.ts`, `src/overlay.ts` and `src/matchers.ts` are the delivery layers.
- `scripts/build-docs.mjs` and `scripts/site/*.mjs` generate the site in `docs/`.

## Adding or changing a rule

1. Write the rule in the right file in `src/rules/`. Give it a clear `title`, an `explanation` and an `affects` text in English and Portuguese, a severity and the WCAG criteria it maps to.
2. Every report needs a `message` about the specific element and a `fix` with a summary and either `ops` (machine readable edits) or an explicit `after` snippet. Mark `safe: true` only when the fix needs no human decision and does not change how the page looks.
3. Add a failing and a passing fixture to `test/fixtures/rules.ts`. The test suite checks that every rule has both, that fixes are idempotent and that they keep the HTML valid.
4. Run `npm run lint`, `npm run typecheck` and `npm test`.

## Writing style

Plain, friendly sentences that a developer new to accessibility understands. Say who is affected. Avoid jargon unless you explain it. No emoji and no em or en dash characters (`npm run lint:chars` checks this).

## Docs site

```sh
npm run docs        # build, generate pages and highlight code
npm run docs:check  # the site must pass its own checker
```

## Commits and pull requests

Keep pull requests focused, describe the user facing change and add a line to `CHANGELOG.md` under Unreleased.
