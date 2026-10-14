// Sample "patients" for the live check-up on the docs site: small, realistic pages with the
// accessibility problems people ship every day. They render inside a sandboxed iframe.

/** A tiny SVG illustration as a data URI, so the samples need no image files. */
function art(bg, fg, shape) {
  const shapes = {
    cake: `<rect x="70" y="70" width="100" height="50" rx="8" fill="${fg}"/><rect x="80" y="50" width="80" height="24" rx="6" fill="#fff" opacity=".8"/><rect x="117" y="28" width="6" height="22" rx="3" fill="${fg}"/><circle cx="120" cy="24" r="6" fill="#ffb347"/>`,
    bread: `<ellipse cx="120" cy="88" rx="70" ry="34" fill="${fg}"/><path d="M80 80q10-14 20 0M110 76q10-14 20 0M140 80q10-14 20 0" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>`,
    team: `<circle cx="85" cy="70" r="20" fill="${fg}"/><circle cx="155" cy="70" r="20" fill="${fg}"/><circle cx="120" cy="62" r="22" fill="#fff" opacity=".85"/><rect x="60" y="94" width="120" height="40" rx="20" fill="${fg}"/>`,
    chart: `<rect x="50" y="90" width="26" height="40" fill="${fg}"/><rect x="88" y="60" width="26" height="70" fill="${fg}"/><rect x="126" y="40" width="26" height="90" fill="#fff" opacity=".85"/><rect x="164" y="72" width="26" height="58" fill="${fg}"/>`,
    map: `<path d="M40 40l50-14 60 14 50-14v100l-50 14-60-14-50 14z" fill="${fg}"/><circle cx="125" cy="78" r="12" fill="#fff"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150"><rect width="240" height="150" fill="${bg}"/>${shapes[shape]}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const icon = {
  cart: '<svg class="icon icon-cart" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h11L21 7H6.5"/></svg>',
  search: '<svg class="icon icon-search" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  close: '<svg class="icon icon-close" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  heart: '<svg class="icon icon-heart" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z"/></svg>',
  share: '<svg class="icon icon-share" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
  gear: '<svg class="icon icon-gear" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  bell: '<svg class="icon icon-bell" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
};

const base = `*{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,"Segoe UI",Helvetica,Arial,sans-serif}img{max-width:100%;display:block}`;

const bakery = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
${base}
body{background:#fffaf3;color:#4a3426}
.top{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:#fff;border-bottom:1px solid #f1e4d4}
.logo{font-weight:800;font-size:20px;color:#c26a3d}
.top nav a{margin-right:14px;color:#8a6b55;text-decoration:none}
.icon-btn{border:0;background:#f7ead9;color:#7a4b2c;width:30px;height:30px;border-radius:8px}
button:focus{outline:none}
.hero{display:grid;grid-template-columns:1.1fr 1fr;gap:20px;padding:26px 22px;align-items:center}
.hero h1{font-size:32px;margin:0 0 8px;color:#4a3426}
.tagline{color:#c9b29e;font-size:17px}
.cta{display:inline-block;background:#f4a261;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:700;margin-top:8px}
.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding:0 22px 26px}
.card{background:#fff;border-radius:14px;padding:12px;box-shadow:0 2px 8px rgba(74,52,38,.08)}
.card h4{margin:10px 0 4px}
.price{color:#d8c3ae;font-size:14px}
.foot{padding:16px 22px;font-size:13px;color:#b49b86}
</style>
</head>
<body>
<div class="top">
  <span class="logo">Crumb &amp; Co.</span>
  <nav><a href="#menu">Menu</a><a href="#visit">Visit</a></nav>
  <div><button class="icon-btn">${icon.search}</button> <button class="icon-btn">${icon.cart}</button></div>
</div>
<div class="hero">
  <div>
    <h1>Fresh bread, every morning</h1>
    <p class="tagline">Sourdough, cakes and croissants baked before sunrise.</p>
    <a class="cta" href="#order" tabindex="1">Order now</a>
  </div>
  <img src="${art("#f6d7b8", "#c26a3d", "bread")}">
</div>
<div class="cards" id="menu">
  <div class="card"><img src="${art("#fde2e4", "#e07a8b", "cake")}" alt="image of a cake"><h4>Strawberry cake</h4><p class="price">From 24 dollars</p><a href="/cakes">Read more</a></div>
  <div class="card"><img src="${art("#e3f0e6", "#5e8c61", "team")}"><h4>Meet the bakers</h4><p class="price">Our team since 1998</p><a href="/team">click here</a></div>
</div>
<div class="foot">Open daily 6am to 2pm.</div>
</body>
</html>`;

const signup = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Create your account</title>
<style>
${base}
body{background:#eef2ff;color:#1e1b4b;display:grid;place-items:start center;padding:24px}
form{background:#fff;width:100%;max-width:420px;border-radius:16px;padding:22px;box-shadow:0 6px 24px rgba(30,27,75,.1)}
h2{margin:0 0 4px}
.hint{color:#a5a3c9;font-size:14px;margin:0 0 16px}
input[type=text],input[type=email],input[type=password]{display:block;width:100%;padding:10px 12px;margin:0 0 10px;border:1px solid #d6d4f0;border-radius:10px;font:inherit}
.plans{display:flex;gap:16px;margin:6px 0 12px}
.terms{font-size:13px;color:#9a98bd}
.terms input{width:12px;height:12px}
.submit{background:#6366f1;color:#fff;padding:11px;border-radius:10px;text-align:center;font-weight:700;cursor:pointer;margin-top:12px}
.error{color:#f87171;font-size:13px}
</style>
</head>
<body>
<form>
  <h2>Create your account</h2>
  <p class="hint">It takes less than a minute.</p>
  <input type="text" name="fullName" placeholder="Full name">
  <input type="email" name="email" placeholder="Email" autocomplete="e-mail">
  <input type="password" name="password" placeholder="Password" onpaste="return false">
  <p class="error">Use at least 12 characters.</p>
  <div class="plans">
    <label><input type="radio" name="plan" value="free"> Free</label>
    <label><input type="radio" name="plan" value="pro"> Pro</label>
  </div>
  <p class="terms"><input type="checkbox" name="terms"> I agree to the terms</p>
  <div class="submit" onclick="submit()">Sign up</div>
</form>
</body>
</html>`;

const news = `<!doctype html>
<html lang="english">
<head>
<meta charset="utf-8">
<title>Daily Ledger</title>
<style>
${base}
body{background:#fff;color:#111827}
header{padding:14px 22px;border-bottom:3px solid #111827;display:flex;justify-content:space-between;align-items:center}
.brand{font:700 24px Georgia,serif}
marquee{background:#fef3c7;color:#92400e;padding:6px 0;font-size:14px}
article{padding:20px 22px;max-width:720px}
h1{font:700 30px/1.15 Georgia,serif;margin:0 0 10px}
.byline{color:#9ca3af;font-size:14px}
.live{display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;animation:pulse 1s infinite}
@keyframes pulse{50%{transform:scale(1.8)}}
table{border-collapse:collapse;margin:14px 0;width:100%}
td{border:1px solid #e5e7eb;padding:6px 10px}
.social a{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;background:#f3f4f6;border-radius:6px;color:#374151;margin-right:4px}
</style>
</head>
<body>
<header><span class="brand">Daily Ledger</span><span><span class="live"></span> Live</span></header>
<marquee>Breaking: city council approves new bike lanes</marquee>
<article>
  <h1>City approves 40 km of new bike lanes</h1>
  <p class="byline" id="byline">By Ana Souza, 3 minutes ago</p>
  <h3>What changes</h3>
  <p>The plan connects the old port to the university campus by 2027.</p>
  <table>
    <tr><td>District</td><td>New lanes</td></tr>
    <tr><td>Harbor</td><td>12 km</td></tr>
    <tr><td>Campus</td><td>9 km</td></tr>
  </table>
  <iframe src="https://www.openstreetmap.org/export/embed.html" width="100%" height="120"></iframe>
  <h2></h2>
  <p id="byline">Photo by the city press office.</p>
  <div class="social"><a href="https://x.com/dailyledger">${icon.share}</a><a href="/save">${icon.heart}</a></div>
</article>
</body>
</html>`;

const dashboard = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Analytics</title>
<style>
${base}
body{background:#0f172a;color:#e2e8f0}
.bar{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#111c33}
.bar h1{font-size:18px;margin:0;flex:1}
.ico{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:5px;background:#1e293b;color:#94a3b8}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:18px 20px}
.tile{background:#16213a;border-radius:12px;padding:14px}
.tile .label{color:#475569;font-size:13px}
.tile .num{font-size:26px;font-weight:800}
.tabs{display:flex;gap:6px;padding:0 20px}
.tab{padding:6px 12px;border-radius:8px;background:#1e293b;color:#94a3b8}
.toggle{display:inline-block;width:38px;height:20px;border-radius:10px;background:#334155;vertical-align:middle}
.modal{margin:16px 20px;padding:14px;border-radius:12px;background:#1e293b}
.chart img{border-radius:10px}
</style>
</head>
<body>
<div class="bar"><h1>Analytics</h1><span class="ico" role="buton" tabindex="0">${icon.bell}</span><span class="ico" tabindex="0">${icon.gear}</span></div>
<div class="tabs"><div role="tab">Overview</div><div role="tab">Revenue</div></div>
<div class="grid">
  <div class="tile"><div class="label">Visitors</div><div class="num">12,480</div></div>
  <div class="tile"><div class="label">Sign ups</div><div class="num">932</div></div>
  <div class="tile"><div class="label">Churn</div><div class="num">2.1%</div></div>
</div>
<p style="padding:0 20px">Dark mode <span class="toggle" role="checkbox" tabindex="0"></span></p>
<div class="chart" style="padding:0 20px" aria-hidden="true"><a href="/report"><img src="${art("#16213a", "#38bdf8", "chart")}" alt="Weekly visitors chart"></a></div>
<div class="modal" role="dialog"><p>Export ready.</p><a href="/export.csv"><button>Download CSV</button></a></div>
<span aria-labeledby="byline">Updated hourly</span>
</body>
</html>`;

export const SAMPLES = [
  { id: "bakery", name: "Bakery landing page", pt: "Página de padaria", blurb: "Pretty, but quiet text, mystery buttons and images nobody can hear.", html: bakery },
  { id: "signup", name: "Sign-up form", pt: "Formulário de cadastro", blurb: "Placeholders as labels, a div pretending to be a button.", html: signup },
  { id: "news", name: "News article", pt: "Artigo de notícia", blurb: "Scrolling text, a table without headers, an untitled frame.", html: news },
  { id: "dashboard", name: "Analytics dashboard", pt: "Painel de análise", blurb: "ARIA typos, hidden links that still take focus, a nameless dialog.", html: dashboard },
];
