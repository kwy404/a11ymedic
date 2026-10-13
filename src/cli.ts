#!/usr/bin/env node
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runAudit } from "./engine";
import { fixHtml } from "./fix";
import { expandGlobs } from "./node/glob";
import { unifiedDiff } from "./node/diff";
import { parseHtml } from "./parse";
import { formatText, githubAnnotations, githubSummary, toHtml, toJSON, toMarkdown } from "./report";
import { RULES } from "./rules";
import { SEVERITIES, severityRank, type AuditOptions, type AuditResult, type Lang, type Level, type Severity } from "./types";

const VERSION = "0.1.0";

export interface CliIO {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  cwd: string;
  env: Record<string, string | undefined>;
  isTTY: boolean;
  stdin?: () => Promise<string>;
}

interface Flags {
  format: "text" | "json" | "html" | "md" | "github";
  output?: string | undefined;
  failOn: Severity | "none";
  level: Level;
  lang: Lang;
  rules?: string[];
  disable?: string[];
  exclude: string[];
  browser: "auto" | "always" | "never";
  write: boolean;
  github: boolean | undefined;
  color: boolean;
  quiet: boolean;
  defaultLang?: string | undefined;
}

const HELP = `a11ymedic ${VERSION}: find accessibility problems and get the exact fix.

Usage
  a11ymedic <files, globs, directories or URLs...> [options]
  a11ymedic fix <files or globs...> [--write]
  a11ymedic rules [--lang pt]

Examples
  npx a11ymedic index.html
  npx a11ymedic "src/**/*.html" --fail-on serious
  npx a11ymedic https://example.com --format html -o report.html
  npx a11ymedic fix "src/**/*.html"            preview the safe fixes as a diff
  npx a11ymedic fix "src/**/*.html" --write    apply them

Options
  -f, --format <text|json|html|md|github>  Report format (default: text)
  -o, --output <file>                     Write the report to a file
      --fail-on <severity|none>           Exit with 1 when a finding is at least this severe
                                          (critical, serious, moderate, minor; default: minor)
      --level <A|AA|AAA>                  Highest WCAG level to check (default: AA)
      --lang <en|pt>                      Language of the report (default: en)
      --rules <ids>                       Only run these rules (comma separated)
      --disable <ids>                     Skip these rules (comma separated)
      --exclude <selector>                Ignore elements matching a CSS selector (repeatable)
      --browser / --no-browser            Force or forbid a headless browser for URLs and files
                                          (default: use Playwright or Puppeteer for URLs when installed)
      --default-lang <code>               Language for the lang fix when it cannot be detected
      --github / --no-github              GitHub Actions annotations and job summary
                                          (default: on when GITHUB_ACTIONS is set)
      --no-color                          Plain output
  -q, --quiet                             Only print the summary line
  -w, --write                             (fix) write the changes to disk
  -v, --version                           Print the version
  -h, --help                              Print this help`;

function parseArgs(argv: string[]): { command: string; targets: string[]; flags: Flags; error?: string } {
  const flags: Flags = { format: "text", failOn: "minor", level: "AA", lang: "en", exclude: [], browser: "auto", write: false, github: undefined, color: true, quiet: false };
  const targets: string[] = [];
  let command = "check";
  const list = (v: string | undefined): string[] => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const [name, inline] = arg.startsWith("--") && arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
    const value = (): string | undefined => inline ?? argv[++i];
    switch (name) {
      case "-h":
      case "--help":
        return { command: "help", targets, flags };
      case "-v":
      case "--version":
        return { command: "version", targets, flags };
      case "-f":
      case "--format": {
        const v = value() as Flags["format"] | "markdown";
        if (!["text", "json", "html", "md", "markdown", "github"].includes(v ?? "")) return { command, targets, flags, error: `Unknown format "${v}".` };
        flags.format = v === "markdown" ? "md" : (v as Flags["format"]);
        break;
      }
      case "-o":
      case "--output":
        flags.output = value();
        break;
      case "--fail-on": {
        const v = (value() ?? "").toLowerCase();
        if (v !== "none" && !SEVERITIES.includes(v as Severity)) return { command, targets, flags, error: `--fail-on must be one of ${SEVERITIES.join(", ")} or none.` };
        flags.failOn = v as Severity | "none";
        break;
      }
      case "--level": {
        const v = (value() ?? "").toUpperCase();
        if (!["A", "AA", "AAA"].includes(v)) return { command, targets, flags, error: "--level must be A, AA or AAA." };
        flags.level = v as Level;
        break;
      }
      case "--lang": {
        const v = (value() ?? "").toLowerCase();
        flags.lang = v.startsWith("pt") ? "pt" : "en";
        break;
      }
      case "--rules":
        flags.rules = list(value());
        break;
      case "--disable":
        flags.disable = list(value());
        break;
      case "--exclude":
        flags.exclude.push(value() ?? "");
        break;
      case "--browser":
        flags.browser = "always";
        break;
      case "--no-browser":
        flags.browser = "never";
        break;
      case "--default-lang":
        flags.defaultLang = value();
        break;
      case "--github":
        flags.github = true;
        break;
      case "--no-github":
        flags.github = false;
        break;
      case "--no-color":
        flags.color = false;
        break;
      case "-q":
      case "--quiet":
        flags.quiet = true;
        break;
      case "-w":
      case "--write":
        flags.write = true;
        break;
      default:
        if (arg.startsWith("-") && arg !== "-") return { command, targets, flags, error: `Unknown option ${arg}.` };
        if (targets.length === 0 && command === "check" && (arg === "fix" || arg === "rules" || arg === "check")) command = arg;
        else targets.push(arg);
    }
  }
  return { command, targets, flags };
}

const isUrl = (s: string): boolean => /^https?:\/\//i.test(s);

/** Reads local stylesheets linked from an HTML file so the static cascade sees them. */
function linkedCss(html: string, file: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag)) continue;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || /^(https?:)?\/\//i.test(href) || href.startsWith("data:")) continue;
    const path = resolve(dirname(file), href.split(/[?#]/)[0]!);
    if (existsSync(path)) out.push(readFileSync(path, "utf8"));
  }
  return out;
}

async function remoteCss(html: string, base: string): Promise<string[]> {
  const out: string[] = [];
  const origin = new URL(base).origin;
  for (const m of [...html.matchAll(/<link\b[^>]*>/gi)].slice(0, 10)) {
    if (!/rel\s*=\s*["']?[^"'>]*stylesheet/i.test(m[0])) continue;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1];
    if (!href) continue;
    const url = new URL(href, base);
    if (url.origin !== origin) continue;
    try {
      const res = await fetch(url);
      if (res.ok) out.push(await res.text());
    } catch {
      // Ignore unreachable stylesheets.
    }
  }
  return out;
}

interface Browser {
  name: string;
  audit(url: string, options: AuditOptions): Promise<AuditResult>;
  close(): Promise<void>;
}

/** Starts Playwright or Puppeteer when one of them is installed, otherwise returns null. */
async function launchBrowser(): Promise<Browser | null> {
  const candidates = [new URL("./a11ymedic.js", import.meta.url), new URL("../dist/a11ymedic.js", import.meta.url)];
  const scriptUrl = candidates.find((u) => existsSync(fileURLToPath(u)));
  if (!scriptUrl) return null;
  const script = readFileSync(fileURLToPath(scriptUrl), "utf8");
  const run = `(opts) => { const r = window.a11ymedic.auditDocument(document, opts); return JSON.parse(JSON.stringify(r)); }`;
  const dynamicImport = (name: string): Promise<unknown> => import(name);
  try {
    const pw = (await dynamicImport("playwright")) as { chromium: { launch(): Promise<{ newPage(): Promise<PlaywrightPage>; close(): Promise<void> }> } };
    const browser = await pw.chromium.launch();
    return {
      name: "playwright",
      async audit(url, options) {
        const page = await browser.newPage();
        try {
          await page.goto(url, { waitUntil: "load" });
          await page.addScriptTag({ content: script });
          return (await page.evaluate(`(${run})(${JSON.stringify(options)})`)) as AuditResult;
        } finally {
          await page.close();
        }
      },
      close: () => browser.close(),
    };
  } catch {
    // Not installed or no browser binary: try Puppeteer.
  }
  try {
    const pp = (await dynamicImport("puppeteer")) as { default?: { launch(o: object): Promise<PuppeteerBrowser> }; launch?(o: object): Promise<PuppeteerBrowser> };
    const launch = pp.launch ?? pp.default!.launch;
    const browser = await launch({ headless: true });
    return {
      name: "puppeteer",
      async audit(url, options) {
        const page = await browser.newPage();
        try {
          await page.goto(url, { waitUntil: "load" });
          await page.addScriptTag({ content: script });
          return (await page.evaluate(`(${run})(${JSON.stringify(options)})`)) as AuditResult;
        } finally {
          await page.close();
        }
      },
      close: () => browser.close(),
    };
  } catch {
    return null;
  }
}

interface PlaywrightPage {
  goto(url: string, o: object): Promise<unknown>;
  addScriptTag(o: object): Promise<unknown>;
  evaluate(code: string): Promise<unknown>;
  close(): Promise<void>;
}
type PuppeteerBrowser = { newPage(): Promise<PlaywrightPage>; close(): Promise<void> };

async function auditStatic(html: string, source: string, options: AuditOptions): Promise<AuditResult> {
  const parsed = await parseHtml(html, isUrl(source) ? { url: source } : {});
  return runAudit(RULES, parsed.document, { ...options, source, fragment: options.fragment ?? parsed.fragment, locate: parsed.locate });
}

function shouldFail(results: AuditResult[], failOn: Severity | "none"): boolean {
  if (failOn === "none") return false;
  const min = severityRank(failOn);
  return results.some((r) => r.findings.some((f) => severityRank(f.severity) >= min));
}

/** Runs the command line. Returns the exit code. */
export async function main(argv: string[], io: CliIO): Promise<number> {
  const { command, targets, flags, error } = parseArgs(argv);
  if (error) {
    io.stderr(`a11ymedic: ${error}\nRun a11ymedic --help for usage.\n`);
    return 2;
  }
  if (command === "help") {
    io.stdout(HELP + "\n");
    return 0;
  }
  if (command === "version") {
    io.stdout(VERSION + "\n");
    return 0;
  }
  const color = flags.color && io.isTTY && !io.env.NO_COLOR;
  const lang = flags.lang;

  if (command === "rules") {
    const lines = RULES.map((r) => `${r.id.padEnd(28)} ${r.severity.padEnd(9)} ${r.level.padEnd(4)} WCAG ${r.wcag.join(", ").padEnd(16)} ${r.title[lang]}`);
    io.stdout(`${RULES.length} rules\n\n${lines.join("\n")}\n`);
    return 0;
  }

  if (!targets.length) {
    io.stderr("a11ymedic: give me at least one file, glob, directory or URL.\nRun a11ymedic --help for usage.\n");
    return 2;
  }

  const options: AuditOptions = { level: flags.level, lang, exclude: flags.exclude };
  if (flags.rules) options.rules = flags.rules;
  if (flags.disable) options.disable = flags.disable;
  if (flags.defaultLang) options.defaultLang = flags.defaultLang;

  const urls = targets.filter(isUrl);
  const stdin = targets.includes("-");
  const files = expandGlobs(targets.filter((t) => !isUrl(t) && t !== "-"), io.cwd);
  const missing = targets.filter((t) => !isUrl(t) && t !== "-" && !/[*?[{]/.test(t) && !existsSync(resolve(io.cwd, t)));
  for (const m of missing) io.stderr(`a11ymedic: ${m}: no such file or directory\n`);
  if (!files.length && !urls.length && !stdin) {
    io.stderr("a11ymedic: no HTML files matched.\n");
    return 2;
  }
  const rel = (f: string): string => relative(io.cwd, f).split("\\").join("/") || f;

  if (command === "fix") {
    let fixedFiles = 0;
    let fixes = 0;
    let left = 0;
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      const result = await fixHtml(html, { ...options, css: linkedCss(html, file) });
      left += result.remaining.length;
      if (!result.changed) continue;
      fixedFiles++;
      fixes += result.applied.length;
      const diff = unifiedDiff(html, result.output, rel(file));
      if (!flags.quiet) {
        io.stdout(
          color
            ? diff
                .split("\n")
                .map((l) => (l.startsWith("+") && !l.startsWith("+++") ? `\u001b[32m${l}\u001b[0m` : l.startsWith("-") && !l.startsWith("---") ? `\u001b[31m${l}\u001b[0m` : l.startsWith("@@") ? `\u001b[36m${l}\u001b[0m` : l))
                .join("\n")
            : diff,
        );
        for (const f of result.applied) io.stdout(`  ${f.rule}: ${f.fix.summary[lang]}\n`);
        io.stdout("\n");
      }
      if (flags.write) writeFileSync(file, result.output);
    }
    const verb = flags.write ? (lang === "pt" ? "aplicadas" : "applied") : lang === "pt" ? "para aplicar (use --write)" : "to apply (run with --write)";
    io.stdout(
      lang === "pt"
        ? `${fixes} correção(ões) seguras ${verb} em ${fixedFiles} de ${files.length} arquivo(s). ${left} problema(s) precisam de uma pessoa: rode a11ymedic para ver as correções sugeridas.\n`
        : `${fixes} safe fix(es) ${verb} in ${fixedFiles} of ${files.length} file(s). ${left} problem(s) need a human: run a11ymedic to see the suggested fixes.\n`,
    );
    return 0;
  }

  const results: AuditResult[] = [];
  let browser: Browser | null = null;
  const wantBrowser = flags.browser === "always" || (flags.browser === "auto" && urls.length > 0);
  if (wantBrowser) {
    browser = await launchBrowser();
    if (!browser && flags.browser === "always") {
      io.stderr("a11ymedic: --browser needs Playwright or Puppeteer (npm i -D playwright). Falling back to static analysis.\n");
    } else if (!browser && urls.length && !flags.quiet) {
      io.stderr("a11ymedic: no headless browser found (install playwright for layout aware checks); fetching the HTML for a static check.\n");
    }
  }
  try {
    if (stdin && io.stdin) results.push(await auditStatic(await io.stdin(), "stdin", options));
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      if (browser && flags.browser === "always") {
        const r = await browser.audit(pathToFileURL(file).href, options);
        r.source = rel(file);
        results.push(r);
      } else {
        results.push(await auditStatic(html, rel(file), { ...options, css: linkedCss(html, file) }));
      }
    }
    for (const url of urls) {
      if (browser) {
        const r = await browser.audit(url, options);
        r.source = url;
        results.push(r);
        continue;
      }
      let html: string;
      try {
        const res = await fetch(url, { headers: { "user-agent": `a11ymedic/${VERSION}` } });
        if (!res.ok) {
          io.stderr(`a11ymedic: ${url} answered ${res.status}\n`);
          return 2;
        }
        html = await res.text();
      } catch (e) {
        io.stderr(`a11ymedic: could not fetch ${url}: ${(e as Error).message}\n`);
        return 2;
      }
      results.push(await auditStatic(html, url, { ...options, css: await remoteCss(html, url) }));
    }
  } finally {
    await browser?.close();
  }

  let report: string;
  switch (flags.format) {
    case "json":
      report = toJSON(results);
      break;
    case "html":
      report = toHtml(results, { lang });
      break;
    case "md":
      report = toMarkdown(results, { lang });
      break;
    case "github":
      report = githubAnnotations(results, { lang });
      break;
    default:
      report = formatText(results, { lang, color: color && !flags.output });
  }
  if (flags.output) {
    const out = resolve(io.cwd, flags.output);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, report);
  }
  if (flags.quiet || flags.output) {
    const n = results.reduce((a, r) => a + r.findings.length, 0);
    io.stdout(`${n} ${lang === "pt" ? "problema(s)" : "problem(s)"} ${lang === "pt" ? "em" : "in"} ${results.length} ${lang === "pt" ? "documento(s)" : "document(s)"}${flags.output ? ` -> ${flags.output}` : ""}\n`);
  } else io.stdout(report);

  const github = flags.github ?? io.env.GITHUB_ACTIONS === "true";
  if (github) {
    if (flags.format !== "github") io.stdout(githubAnnotations(results, { lang }));
    const summary = io.env.GITHUB_STEP_SUMMARY;
    if (summary) appendFileSync(summary, githubSummary(results, { lang }));
  }
  return shouldFail(results, flags.failOn) ? 1 : 0;
}

const invokedDirectly = (() => {
  try {
    const self = fileURLToPath(import.meta.url);
    const argv1 = process.argv[1] ? resolve(process.argv[1]) : "";
    return argv1 === self || /a11ymedic(\.js|\.cmd)?$/.test(argv1) || argv1.endsWith(`${"dist"}/cli.js`) || argv1.endsWith(`${"dist"}\\cli.js`);
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  const readStdin = async (): Promise<string> => {
    const chunks: Buffer[] = [];
    for await (const c of process.stdin) chunks.push(c as Buffer);
    return Buffer.concat(chunks).toString("utf8");
  };
  main(process.argv.slice(2), {
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    cwd: process.cwd(),
    env: process.env,
    isTTY: !!process.stdout.isTTY,
    stdin: readStdin,
  }).then(
    (code) => {
      process.exitCode = code;
    },
    (e: unknown) => {
      process.stderr.write(`a11ymedic: ${(e as Error).stack ?? String(e)}\n`);
      process.exitCode = 2;
    },
  );
}
