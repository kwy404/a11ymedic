import { defineConfig } from "tsup";

const external = ["jsdom", "vitest", "playwright", "puppeteer"];

export default defineConfig([
  {
    entry: { index: "src/index.ts", matchers: "src/matchers.ts", jest: "src/jest.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    target: "es2020",
    external,
  },
  {
    entry: { vitest: "src/vitest.ts", cli: "src/cli.ts" },
    format: ["esm"],
    dts: { entry: { vitest: "src/vitest.ts" } },
    sourcemap: true,
    target: "node18",
    platform: "node",
    external,
  },
  {
    // Browser global for <script> tags, bookmarklets and the docs site: window.a11ymedic
    entry: { a11ymedic: "src/browser.ts" },
    format: ["iife"],
    globalName: "a11ymedic",
    minify: true,
    sourcemap: true,
    target: "es2019",
    platform: "browser",
    external,
    outExtension: () => ({ js: ".js" }),
  },
]);
