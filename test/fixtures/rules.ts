/**
 * One failing and one passing fixture per rule. `page: true` wraps the body in a full document
 * (with lang, title and a main landmark unless the fixture provides its own document).
 */
export interface RuleCase {
  rule: string;
  fail: string;
  pass: string;
  page?: boolean;
  level?: "A" | "AA" | "AAA";
}

export const page = (body: string, opts: { lang?: string | null; title?: string | null; head?: string } = {}): string => {
  const lang = opts.lang === null ? "" : ` lang="${opts.lang ?? "en"}"`;
  const title = opts.title === null ? "" : `<title>${opts.title ?? "Test page"}</title>`;
  return `<!doctype html>\n<html${lang}>\n<head>\n<meta charset="utf-8">\n${title}\n${opts.head ?? ""}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
};

export const RULE_CASES: RuleCase[] = [
  { rule: "image-alt", fail: '<img src="photo.jpg">', pass: '<img src="photo.jpg" alt="A red bike">' },
  { rule: "image-alt-quality", fail: '<img src="dog.png" alt="image of a dog">', pass: '<img src="dog.png" alt="A dog catching a ball">' },
  { rule: "input-image-alt", fail: '<form><input type="image" src="go.png"></form>', pass: '<form><input type="image" src="go.png" alt="Search"></form>' },
  {
    rule: "area-alt",
    fail: '<img src="m.png" usemap="#m" alt="Map"><map name="m"><area href="/north" shape="rect" coords="0,0,9,9"></map>',
    pass: '<img src="m.png" usemap="#m" alt="Map"><map name="m"><area href="/north" alt="North" shape="rect" coords="0,0,9,9"></map>',
  },
  { rule: "role-img-alt", fail: '<svg role="img" viewBox="0 0 4 4"><path d="M0 0h4v4z"/></svg>', pass: '<svg role="img" aria-label="Sales chart" viewBox="0 0 4 4"></svg>' },
  { rule: "object-alt", fail: '<object data="report.pdf"></object>', pass: '<object data="report.pdf" aria-label="Annual report"></object>' },
  { rule: "button-name", fail: '<button><svg viewBox="0 0 4 4"></svg></button>', pass: "<button>Save</button>" },
  { rule: "link-name", fail: '<a href="/home"><img src="logo.png"></a>', pass: '<a href="/home">Home</a>' },
  { rule: "link-text-generic", fail: '<h2>Pricing</h2><a href="/pricing">Read more</a>', pass: '<a href="/pricing">Read more about pricing</a>' },
  { rule: "label-in-name", fail: '<button aria-label="Find products">Search</button>', pass: '<button aria-label="Search products">Search</button>' },
  { rule: "aria-dialog-name", fail: '<div role="dialog"><p>Saved.</p></div>', pass: '<div role="dialog" aria-label="Settings"><p>Saved.</p></div>' },
  { rule: "aria-widget-name", fail: '<div role="switch" aria-checked="false" tabindex="0"></div>', pass: '<div role="switch" aria-checked="false" tabindex="0" aria-label="Dark mode"></div>' },
  { rule: "label", fail: '<input type="text" name="q">', pass: '<label for="q">Search</label><input id="q" type="text" name="q">' },
  { rule: "autocomplete-valid", fail: '<input autocomplete="e-mail" aria-label="Email">', pass: '<input autocomplete="email" aria-label="Email">' },
  { rule: "input-purpose", fail: '<input type="email" aria-label="Email">', pass: '<input type="email" aria-label="Email" autocomplete="email">' },
  { rule: "paste-blocked", fail: '<input type="password" aria-label="Password" onpaste="return false">', pass: '<input type="password" aria-label="Password">' },
  {
    rule: "radio-group",
    fail: '<label><input type="radio" name="size" value="s"> Small</label><label><input type="radio" name="size" value="l"> Large</label>',
    pass: '<fieldset><legend>Size</legend><label><input type="radio" name="size" value="s"> Small</label><label><input type="radio" name="size" value="l"> Large</label></fieldset>',
  },
  { rule: "color-contrast", fail: '<p style="color:#999999">Faded text</p>', pass: '<p style="color:#555555">Readable text</p>' },
  { rule: "color-contrast-enhanced", fail: '<p style="color:#666666">Almost</p>', pass: '<p style="color:#333333">Strong</p>', level: "AAA" },
  { rule: "html-has-lang", fail: page("<main><h1>Hi</h1></main>", { lang: null }), pass: page("<main><h1>Hi</h1></main>"), page: true },
  { rule: "html-lang-valid", fail: page("<main><h1>Hi</h1></main>", { lang: "english" }), pass: page("<main><h1>Hi</h1></main>", { lang: "pt-BR" }), page: true },
  { rule: "valid-lang", fail: '<p lang="xx-YY">Bonjour</p>', pass: '<p lang="fr">Bonjour</p>' },
  { rule: "document-title", fail: page("<main><h1>Hi</h1></main>", { title: null }), pass: page("<main><h1>Hi</h1></main>"), page: true },
  {
    rule: "meta-viewport",
    fail: '<meta name="viewport" content="width=device-width, user-scalable=no"><p>x</p>',
    pass: '<meta name="viewport" content="width=device-width, initial-scale=1"><p>x</p>',
  },
  { rule: "meta-refresh", fail: '<meta http-equiv="refresh" content="5; url=/next"><p>x</p>', pass: '<meta http-equiv="refresh" content="0; url=/next"><p>x</p>' },
  { rule: "heading-order", fail: "<h1>Shop</h1><h3>Shoes</h3>", pass: "<h1>Shop</h1><h2>Shoes</h2>" },
  { rule: "page-has-heading-one", fail: page("<main><h2>Shoes</h2></main>"), pass: page("<main><h1>Shoes</h1></main>"), page: true },
  { rule: "empty-heading", fail: "<h2></h2>", pass: "<h2>Plans</h2>" },
  { rule: "landmark-one-main", fail: page("<div><h1>Hi</h1></div>"), pass: page("<main><h1>Hi</h1></main>"), page: true },
  {
    rule: "landmark-unique",
    fail: '<nav><a href="/">Home</a></nav><nav><a href="/blog">Blog</a></nav>',
    pass: '<nav aria-label="Main"><a href="/">Home</a></nav><nav aria-label="Footer"><a href="/blog">Blog</a></nav>',
  },
  {
    rule: "region",
    fail: page("<header><p>Logo</p></header><main><h1>Hi</h1></main><div>Stray promo text</div>"),
    pass: page("<header><p>Logo</p></header><main><h1>Hi</h1><div>Promo text</div></main>"),
    page: true,
  },
  { rule: "bypass", fail: page('<div><a href="/a">A</a><a href="/b">B</a></div>'), pass: page('<main><a href="/a">A</a></main>'), page: true },
  { rule: "skip-link", fail: '<a href="#content">Skip to content</a>', pass: '<a href="#content">Skip to content</a><div id="content">Hi</div>' },
  { rule: "list", fail: "<ul><div>Apples</div></ul>", pass: "<ul><li>Apples</li></ul>" },
  { rule: "listitem", fail: "<div><li>Apples</li></div>", pass: "<ol><li>Apples</li></ol>" },
  { rule: "definition-list", fail: "<dl><p>Term</p></dl>", pass: "<dl><dt>Term</dt><dd>Meaning</dd></dl>" },
  { rule: "duplicate-id", fail: '<p id="a">One</p><p id="a">Two</p>', pass: '<p id="a">One</p><p id="b">Two</p>' },
  { rule: "aria-valid-role", fail: '<div role="buton">Go</div>', pass: '<div role="button" tabindex="0">Go</div>' },
  { rule: "aria-valid-attr", fail: '<p id="t">Hi</p><div aria-labeledby="t">x</div>', pass: '<p id="t">Hi</p><div role="group" aria-labelledby="t">x</div>' },
  { rule: "aria-valid-attr-value", fail: '<button aria-expanded="yes">Menu</button>', pass: '<button aria-expanded="true">Menu</button>' },
  { rule: "aria-required-attr", fail: '<div role="checkbox" tabindex="0">Agree</div>', pass: '<div role="checkbox" aria-checked="false" tabindex="0">Agree</div>' },
  { rule: "aria-hidden-focus", fail: '<div aria-hidden="true"><a href="/">Home</a></div>', pass: '<div aria-hidden="true"><a href="/" tabindex="-1">Home</a></div>' },
  { rule: "aria-hidden-body", fail: page("<main><h1>Hi</h1></main>").replace("<body>", '<body aria-hidden="true">'), pass: page("<main><h1>Hi</h1></main>") },
  { rule: "aria-prohibited-label", fail: '<div aria-label="Note">Some text</div>', pass: '<div role="group" aria-label="Note">Some text</div>' },
  { rule: "aria-required-parent", fail: '<div role="tab">One</div>', pass: '<div role="tablist"><div role="tab">One</div></div>' },
  { rule: "presentation-role-conflict", fail: '<button role="presentation">Go</button>', pass: '<img src="line.png" alt="" role="presentation">' },
  { rule: "tabindex", fail: '<div tabindex="2">First</div>', pass: '<div tabindex="0">First</div>' },
  {
    rule: "focus-visible",
    fail: '<style>a:focus { outline: none; }</style><a href="/">Home</a>',
    pass: '<style>a:focus { outline: none; box-shadow: 0 0 0 3px #0f8b8d; }</style><a href="/">Home</a>',
  },
  { rule: "nested-interactive", fail: '<a href="/"><button>Buy</button></a>', pass: '<a href="/">Details</a><button>Buy</button>' },
  { rule: "keyboard-click-handler", fail: '<div onclick="go()">Go</div>', pass: '<button type="button" onclick="go()">Go</button>' },
  { rule: "link-as-button", fail: '<a onclick="go()">Go</a>', pass: '<a href="/go">Go</a>' },
  {
    rule: "target-size",
    fail: '<style>.i { width: 16px; height: 16px; padding: 0; }</style><div><button class="i" aria-label="Bold">B</button><button class="i" aria-label="Italic">I</button></div>',
    pass: '<style>.i { width: 32px; height: 32px; }</style><div><button class="i" aria-label="Bold">B</button><button class="i" aria-label="Italic">I</button></div>',
  },
  { rule: "autoplay-media", fail: '<video autoplay src="intro.mp4"></video>', pass: '<video autoplay muted src="intro.mp4"></video>' },
  { rule: "video-caption", fail: '<video controls src="talk.mp4"></video>', pass: '<video controls src="talk.mp4"><track kind="captions" src="talk.vtt" srclang="en"></video>' },
  { rule: "blink-marquee", fail: "<marquee>Sale!</marquee>", pass: "<p>Sale!</p>" },
  {
    rule: "motion-reduced",
    fail: "<style>@keyframes spin { to { transform: rotate(360deg); } } .s { animation: spin 1s infinite; }</style><div class=\"s\">x</div>",
    pass: "<style>@keyframes spin { to { transform: rotate(360deg); } } .s { animation: spin 1s infinite; } @media (prefers-reduced-motion: reduce) { .s { animation: none; } }</style><div class=\"s\">x</div>",
  },
  { rule: "frame-title", fail: '<iframe src="https://www.youtube.com/embed/abc"></iframe>', pass: '<iframe src="https://www.youtube.com/embed/abc" title="Product tour video"></iframe>' },
  {
    rule: "frame-title-unique",
    fail: '<iframe src="/a" title="Embed"></iframe><iframe src="/b" title="Embed"></iframe>',
    pass: '<iframe src="/a" title="Map"></iframe><iframe src="/b" title="Video"></iframe>',
  },
  {
    rule: "table-headers",
    fail: "<table><tr><td>Plan</td><td>Price</td></tr><tr><td>Basic</td><td>9</td></tr></table>",
    pass: "<table><tr><th>Plan</th><th>Price</th></tr><tr><td>Basic</td><td>9</td></tr></table>",
  },
  { rule: "th-scope-valid", fail: '<table><tr><th scope="column">Plan</th></tr></table>', pass: '<table><tr><th scope="col">Plan</th></tr></table>' },
  {
    rule: "empty-table-header",
    fail: "<table><tr><th></th><th>Price</th></tr><tr><td>Basic</td><td>9</td></tr></table>",
    pass: "<table><tr><th>Plan</th><th>Price</th></tr><tr><td>Basic</td><td>9</td></tr></table>",
  },
];
