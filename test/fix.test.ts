import { describe, expect, it } from "vitest";
import { parse } from "parse5";
import { audit, fixHtml } from "../src/index";
import { previewFix } from "../src/engine";
import { parseHtml } from "../src/parse";
import { RULE_CASES } from "./fixtures/rules";

/** parse5 error codes for a document, ignoring the ones the input already had. */
function parseErrors(html: string): string[] {
  const errors: string[] = [];
  parse(html, { onParseError: (e) => errors.push(e.code) });
  return errors;
}

const BROKEN = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  </head>
  <body>
    <main>
      <h1>Welcome to the clinic</h1>
      <img src="spacer.gif" width="1" height="1" />
      <img src="cat.jpg" alt="image of a cat">
      <a href="/"><img src="home.png" alt="Home"> Home</a>
      <span aria-labeledby="t" tabindex="3">Hi</span>
      <p id="t">Label</p>
      <video autoplay src="a.mp4"><track kind="captions" src="a.vtt"></video>
      <input type="password" aria-label="Password" onpaste="return false">
      <input type="text" aria-label="Email" autocomplete="e-mail">
      <div role="dialog"><h2 id="dlg">Hello</h2></div>
      <div role="buton2x">x</div>
      <table><tr><th scope="column">A</th></tr></table>
      <button role="none">Go</button>
    </main>
  </body>
</html>
`;

describe("fixHtml", () => {
  it("applies every safe fix and keeps the rest of the file as it was", async () => {
    const result = await fixHtml(BROKEN);
    expect(result.changed).toBe(true);
    const out = result.output;
    expect(out).toContain("<title>Welcome to the clinic</title>");
    expect(out).toContain('content="width=device-width, initial-scale=1"');
    expect(out).toContain('<img src="spacer.gif" width="1" height="1" alt="" />');
    expect(out).toContain('<img src="cat.jpg" alt="A cat">');
    expect(out).toContain('<img src="home.png" alt=""> Home</a>');
    expect(out).toContain('<span aria-labelledby="t" tabindex="0">Hi</span>');
    expect(out).toContain('<video autoplay src="a.mp4" muted>');
    expect(out).toContain('<input type="password" aria-label="Password">');
    expect(out).toContain('autocomplete="email"');
    expect(out).toContain('<div role="dialog" aria-labelledby="dlg">');
    expect(out).toContain('<div>x</div>');
    expect(out).toContain('<th scope="col">A</th>');
    expect(out).toContain("<button>Go</button>");
    // Untouched lines stay byte for byte identical.
    expect(out).toContain('    <meta charset="utf-8">\n');
    expect(out.split("\n").length).toBe(BROKEN.split("\n").length + 1);
    expect(result.applied.map((f) => f.rule).sort()).toEqual(
      [
        "aria-dialog-name",
        "aria-valid-attr",
        "aria-valid-role",
        "autocomplete-valid",
        "autoplay-media",
        "document-title",
        "image-alt",
        "image-alt-quality",
        "image-alt-quality",
        "meta-viewport",
        "paste-blocked",
        "presentation-role-conflict",
        "tabindex",
        "th-scope-valid",
      ].sort(),
    );
  });

  it("is idempotent: fixing the output again changes nothing", async () => {
    const once = await fixHtml(BROKEN);
    const twice = await fixHtml(once.output);
    expect(twice.changed).toBe(false);
    expect(twice.output).toBe(once.output);
    expect(twice.applied).toEqual([]);
  });

  it("produces valid HTML (no new parse errors)", async () => {
    const { output } = await fixHtml(BROKEN);
    expect(parseErrors(output)).toEqual(parseErrors(BROKEN));
  });

  it("leaves no safe findings behind", async () => {
    const { output } = await fixHtml(BROKEN);
    const after = await audit(output);
    expect(after.findings.filter((f) => f.fix.safe)).toEqual([]);
  });

  it.each(RULE_CASES.map((c) => [c.rule, c] as const))("%s: fixes are idempotent and keep valid HTML", async (_rule, c) => {
    const options = { level: c.level ?? ("AA" as const), defaultLang: "en" };
    const once = await fixHtml(c.fail, options);
    const twice = await fixHtml(once.output, options);
    expect(twice.output).toBe(once.output);
    expect(parseErrors(once.output).length).toBeLessThanOrEqual(parseErrors(c.fail).length);
  });

  it("does nothing to healthy HTML", async () => {
    const html = '<main><h1>Hi</h1><img src="a.png" alt="A"></main>';
    const result = await fixHtml(html);
    expect(result.output).toBe(html);
    expect(result.changed).toBe(false);
  });

  it("adds lang to an implied html element when a language is given", async () => {
    const html = "<!doctype html>\n<title>x</title>\n<main><h1>Hi</h1></main>\n";
    const result = await fixHtml(html, { defaultLang: "pt-BR" });
    expect(result.output).toBe('<!doctype html>\n<html lang="pt-BR">\n<title>x</title>\n<main><h1>Hi</h1></main>\n');
  });

  it("detects the page language when it can", async () => {
    const text = "Este é um texto em português para que a página tenha palavras suficientes. Não é para você, mas para o teste do idioma da página com mais de vinte palavras.";
    const html = `<!doctype html><html><head><title>x</title></head><body><main><h1>Oi</h1><p>${text}</p></main></body></html>`;
    const result = await fixHtml(html);
    expect(result.output).toContain('<html lang="pt">');
  });

  it("inserts a title even when <head> is implied", async () => {
    const html = "<!doctype html>\n<html lang=\"en\">\n<body><main><h1>Shop</h1></main></body>\n</html>\n";
    const result = await fixHtml(html);
    expect(result.output).toContain("<title>Shop</title>");
    expect((await fixHtml(result.output)).changed).toBe(false);
  });

  it("fills an empty title from the h1", async () => {
    const html = '<!doctype html><html lang="en"><head><title></title></head><body><main><h1>Docs</h1></main></body></html>';
    expect((await fixHtml(html)).output).toContain("<title>Docs</title>");
  });

  it("does not apply unsafe fixes", async () => {
    const html = '<main><img src="team.jpg"><button></button></main>';
    const result = await fixHtml(html);
    expect(result.output).toBe(html);
    expect(result.remaining.map((f) => f.rule).sort()).toEqual(["button-name", "image-alt"]);
  });
});

describe("previewFix", () => {
  it("shows every kind of edit", async () => {
    const { document } = await parseHtml('<div id="d" class="x" aria-x="1"><span>Hi</span></div>');
    const el = document.getElementById("d")!;
    expect(previewFix(el, [{ op: "set-attr", name: "role", value: "group" }])).toBe('<div id="d" class="x" aria-x="1" role="group"><span>Hi</span></div>');
    expect(previewFix(el, [{ op: "remove-attr", name: "class" }])).toBe('<div id="d" aria-x="1"><span>Hi</span></div>');
    expect(previewFix(el, [{ op: "rename-attr", name: "class", to: "data-c" }])).toBe('<div id="d" data-c="x" aria-x="1"><span>Hi</span></div>');
    expect(previewFix(el, [{ op: "rename-tag", tag: "section" }])).toBe('<section id="d" class="x" aria-x="1"><span>Hi</span></section>');
    expect(previewFix(el, [{ op: "prepend", html: "<b>1</b>" }])).toContain("<b>1</b><span>");
    expect(previewFix(el, [{ op: "append", html: "<i>2</i>" }])).toContain("</span><i>2</i>");
    expect(previewFix(el, [{ op: "insert-before", html: "<label>L</label>" }])).toMatch(/^<label>L<\/label>\n<div/);
    expect(previewFix(el, [{ op: "replace", html: "<p>new</p>" }])).toBe("<p>new</p>");
    expect(previewFix(el, [{ op: "remove" }])).toBe("");
    const span = el.querySelector("span")!;
    expect(previewFix(el, [{ op: "set-attr", name: "lang", value: "en" }], span)).toContain('<span lang="en">Hi</span>');
  });
});
