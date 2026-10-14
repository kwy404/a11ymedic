import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { main, type CliIO } from "../src/cli";

let dir: string;

function io(env: Record<string, string | undefined> = {}, stdin?: string): CliIO & { out: string; err: string } {
  const state = { out: "", err: "" };
  return Object.assign(state, {
    stdout: (s: string) => {
      state.out += s;
    },
    stderr: (s: string) => {
      state.err += s;
    },
    cwd: dir,
    env,
    isTTY: false,
    ...(stdin !== undefined ? { stdin: async () => stdin } : {}),
  });
}

const BAD = `<!doctype html>
<html lang="en">
<head><title>Bad</title><link rel="stylesheet" href="site.css"></head>
<body><main><h1>Bad</h1>
<img src="spacer.gif" width="1" height="1">
<img src="team.jpg">
<p class="muted">Muted text</p>
</main></body>
</html>
`;
const GOOD = '<!doctype html>\n<html lang="en"><head><title>Good</title></head><body><main><h1>Good</h1></main></body></html>\n';

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "a11ymedic-"));
  mkdirSync(join(dir, "src", "pages"), { recursive: true });
  mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
  writeFileSync(join(dir, "src", "bad.html"), BAD);
  writeFileSync(join(dir, "src", "site.css"), ".muted { color: #b0b0b0 }");
  writeFileSync(join(dir, "src", "pages", "good.html"), GOOD);
  writeFileSync(join(dir, "node_modules", "pkg", "x.html"), "<img src=a.png>");
});

describe("CLI", () => {
  it("prints help and version", async () => {
    const a = io();
    expect(await main(["--help"], a)).toBe(0);
    expect(a.out).toContain("Usage");
    const b = io();
    expect(await main(["-v"], b)).toBe(0);
    expect(b.out.trim()).toBe("0.1.0");
  });

  it("lists rules", async () => {
    const a = io();
    expect(await main(["rules"], a)).toBe(0);
    expect(a.out).toMatch(/^\d+ rules/);
    expect(a.out).toContain("color-contrast");
    const pt = io();
    await main(["rules", "--lang", "pt"], pt);
    expect(pt.out).toContain("Imagem sem texto alternativo");
  });

  it("checks globs, reads linked stylesheets and fails on findings", async () => {
    const a = io();
    const code = await main(["src/**/*.html", "--no-color"], a);
    expect(code).toBe(1);
    expect(a.out).toContain("src/bad.html");
    expect(a.out).toContain("src/pages/good.html");
    expect(a.out).toContain("Healthy: no problems found.");
    expect(a.out).toContain("[color-contrast]");
    expect(a.out).toContain("src/bad.html:6:1");
    expect(a.out).not.toContain("node_modules");
  });

  it("checks a directory and respects --fail-on", async () => {
    const minorOnly = io();
    expect(await main(["src/pages"], minorOnly)).toBe(0);
    const serious = io();
    expect(await main(["src", "--fail-on", "serious"], serious)).toBe(1);
    const none = io();
    expect(await main(["src", "--fail-on", "none"], none)).toBe(0);
    const critical = io();
    expect(await main(["src", "--fail-on", "critical", "--disable", "image-alt"], critical)).toBe(0);
  });

  it("writes JSON, HTML and Markdown reports", async () => {
    for (const [format, file, needle] of [
      ["json", "out/report.json", '"tool": "a11ymedic"'],
      ["html", "out/report.html", "<!doctype html>"],
      ["md", "out/report.md", "# Accessibility report"],
      ["markdown", "out/report2.md", "```diff"],
    ] as const) {
      const a = io();
      await main(["src/bad.html", "--format", format, "-o", file], a);
      expect(readFileSync(join(dir, file), "utf8")).toContain(needle);
      expect(a.out).toContain(`-> ${file}`);
    }
  });

  it("prints GitHub annotations and appends a job summary on Actions", async () => {
    const summary = join(dir, "summary.md");
    const a = io({ GITHUB_ACTIONS: "true", GITHUB_STEP_SUMMARY: summary });
    await main(["src/bad.html", "--quiet"], a);
    expect(a.out).toMatch(/::error file=src\/bad\.html,line=6,col=1,title=Image without alt text/);
    expect(readFileSync(summary, "utf8")).toContain("## a11ymedic:");
    const b = io();
    await main(["src/bad.html", "--format", "github"], b);
    expect(b.out.startsWith("::")).toBe(true);
    const c = io({ GITHUB_ACTIONS: "true" });
    await main(["src/bad.html", "--no-github", "-q"], c);
    expect(c.out).not.toContain("::error");
  });

  it("reads HTML from stdin", async () => {
    const a = io({}, '<img src="x.png">');
    expect(await main(["-", "--rules", "image-alt"], a)).toBe(1);
    expect(a.out).toContain("stdin");
  });

  it("previews fixes as a diff and writes them with --write", async () => {
    const file = join(dir, "src", "fixme.html");
    writeFileSync(file, '<!doctype html>\n<html lang="en">\n<head><title>x</title></head>\n<body><main><h1>x</h1>\n<div tabindex="5">x</div>\n</main></body>\n</html>\n');
    const preview = io();
    expect(await main(["fix", "src/fixme.html"], preview)).toBe(0);
    expect(preview.out).toContain('-<div tabindex="5">x</div>');
    expect(preview.out).toContain('+<div tabindex="0">x</div>');
    expect(preview.out).toContain("to apply (run with --write)");
    expect(readFileSync(file, "utf8")).toContain('tabindex="5"');
    const write = io();
    await main(["fix", "src/fixme.html", "--write"], write);
    expect(write.out).toContain("1 safe fix(es) applied in 1 of 1 file(s)");
    expect(readFileSync(file, "utf8")).toContain('tabindex="0"');
    const again = io();
    await main(["fix", "src/fixme.html", "--write", "--lang", "pt"], again);
    expect(again.out).toContain("0 correção(ões) seguras aplicadas em 0 de 1 arquivo(s)");
  });

  it("reports usage errors with exit code 2", async () => {
    for (const args of [[], ["--bogus"], ["x.html", "--format", "pdf"], ["x.html", "--fail-on", "bad"], ["x.html", "--level", "B"], ["missing.html"], ["nothing/**/*.html"]]) {
      const a = io();
      expect(await main(args, a), args.join(" ")).toBe(2);
      expect(a.err).toBeTruthy();
    }
  });

  it("supports --level, --exclude, --default-lang and --rules", async () => {
    writeFileSync(join(dir, "src", "aaa.html"), '<main><h1>x</h1><p style="color:#666">Almost</p><div class="ad"><img src="a.png"></div></main>');
    const aa = io();
    expect(await main(["src/aaa.html", "--exclude", ".ad"], aa)).toBe(0);
    const aaa = io();
    expect(await main(["src/aaa.html", "--level", "AAA", "--exclude", ".ad", "--rules", "color-contrast-enhanced", "--default-lang", "en"], aaa)).toBe(1);
    expect(aaa.out).toContain("color-contrast-enhanced");
  });

  describe("URLs without a headless browser", () => {
    let server: Server;
    let base = "";
    beforeAll(async () => {
      server = createServer((req, res) => {
        if (req.url === "/style.css") {
          res.setHeader("content-type", "text/css");
          res.end(".faded { color: #c8c8c8 }");
        } else if (req.url === "/missing") {
          res.statusCode = 404;
          res.end("nope");
        } else {
          res.setHeader("content-type", "text/html");
          res.end('<!doctype html><html lang="en"><head><title>Remote</title><link rel="stylesheet" href="/style.css"></head><body><main><h1>Remote</h1><p class="faded">Faded</p></main></body></html>');
        }
      });
      await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
      const addr = server.address();
      base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
    });
    afterAll(() => new Promise<void>((r) => server.close(() => r())));

    it("fetches the page and its same origin CSS for a static check", async () => {
      const a = io();
      const code = await main([`${base}/`, "--no-browser", "--no-color"], a);
      expect(code).toBe(1);
      expect(a.out).toContain(`${base}/`);
      expect(a.out).toContain("[color-contrast]");
    });

    it("fails clearly on HTTP errors", async () => {
      const a = io();
      expect(await main([`${base}/missing`, "--no-browser"], a)).toBe(2);
      expect(a.err).toContain("404");
    });
  });

  it("does not leave report folders behind unless asked", () => {
    expect(existsSync(join(dir, "out"))).toBe(true);
  });
});
