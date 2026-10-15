/* Seasonal themes: sets data-season on <html> on special dates (visitor's local date).
   ?season=<id> forces one, ?season=off turns them off. The chip's switch is kept per season. */
(function (w) {
  var IDS = ["newyear", "carnival", "easter", "valentine", "junina", "halloween", "christmas"];
  var NAMES = { newyear: "New Year", carnival: "Carnival", easter: "Easter", valentine: "Valentine's", junina: "Midsummer", halloween: "Halloween", christmas: "Christmas" };
  var KEY = "kwy-season-off:";

  // Anonymous Gregorian algorithm.
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var n = h + l - 7 * m + 114;
    return new Date(y, Math.floor(n / 31) - 1, (n % 31) + 1);
  }
  function day(dt) { return Math.round(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) / 864e5); }
  function md(y, m, d) { return day(new Date(y, m - 1, d)); }
  function isBR(lang) { return /^pt-br$/i.test(String(lang || "")); }

  /** The season for a local date and a language ("pt-BR" gets Festa Junina and June 12), or "". */
  function detect(dt, lang) {
    var y = dt.getFullYear(), t = day(dt), br = isBR(lang), ez = day(easter(y));
    var hits = [];
    if (t >= md(y, 12, 30) || t <= md(y, 1, 2)) hits.push("newyear");
    if (t >= md(y, 12, 18) && t <= md(y, 12, 26)) hits.push("christmas");
    if (t >= md(y, 10, 24) && t <= md(y, 10, 31)) hits.push("halloween");
    if (t >= ez - 2 && t <= ez) hits.push("easter");
    // Carnival: the Saturday before Ash Wednesday (Easter minus 46 days) through Ash Wednesday.
    if (t >= ez - 50 && t <= ez - 46) hits.push("carnival");
    if (t === md(y, 2, 14) || (br && t === md(y, 6, 12))) hits.push("valentine");
    if (t >= md(y, 6, 13) && t <= md(y, 6, 29)) hits.push("junina");
    // Feb 14 can fall in Carnival: Brazil keeps Carnival, everyone else gets Valentine's.
    if (hits.length > 1 && hits.indexOf("valentine") >= 0 && !br) return "valentine";
    return hits[0] || "";
  }

  /** The season to show, with ?season=<id|off> and the per season off switch applied. */
  function resolve(dt, lang, search, isOff) {
    var q = /[?&]season=([a-z]+)/.exec(search || "");
    if (q) return IDS.indexOf(q[1]) >= 0 ? q[1] : "";
    var id = detect(dt, lang);
    return id && !(isOff && isOff(id)) ? id : "";
  }

  function label(id, lang) {
    return id === "junina" && isBR(lang) ? "Festa Junina" : NAMES[id] || "";
  }

  var api = { ids: IDS, easter: easter, detect: detect, resolve: resolve, label: label };
  w.kwySeasons = api;
  var doc = w.document;
  if (!doc) return;

  var root = doc.documentElement;
  var script = doc.currentScript;
  var sprite = (script && script.getAttribute("data-sprite-href")) || "";
  var lang = (w.navigator && (w.navigator.languages || [])[0]) || (w.navigator && w.navigator.language) || "";
  function store(fn) { try { return fn(w.localStorage); } catch { return null; } }
  function isOff(id) { return store(function (s) { return s.getItem(KEY + id) === "1"; }); }
  var natural = resolve(new Date(), lang, "", null);
  var current = resolve(new Date(), lang, w.location.search, isOff);
  var chipId = current || natural;

  function apply(id) {
    if (id) root.setAttribute("data-season", id); else root.removeAttribute("data-season");
    var uses = doc.querySelectorAll("[data-season-use]");
    for (var i = 0; i < uses.length; i++) if (id) uses[i].setAttribute("href", sprite + "#" + id + "-" + uses[i].getAttribute("data-season-use"));
    var imgs = doc.querySelectorAll("[data-season-src]");
    for (var j = 0; j < imgs.length; j++) {
      var img = imgs[j];
      if (!img.getAttribute("data-src")) img.setAttribute("data-src", img.getAttribute("src"));
      img.setAttribute("src", id ? img.getAttribute("data-season-src").replace("{id}", id) : img.getAttribute("data-src"));
    }
    doc.dispatchEvent(new w.CustomEvent("seasonchange", { detail: id }));
  }

  function chip() {
    if (!chipId) return;
    var name = label(chipId, lang) + " mode";
    var el = doc.createElement("aside");
    el.className = "season-chip";
    el.setAttribute("aria-label", "Seasonal theme");
    el.innerHTML = (sprite ? '<svg class="season-chip-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="' + sprite + "#" + chipId + '-icon-1"/></svg>' : "") +
      '<span id="season-chip-name">' + name + '</span><button type="button" class="season-switch" role="switch" aria-labelledby="season-chip-name"><span class="season-knob"></span></button>';
    var btn = el.querySelector("button");
    function sync() { btn.setAttribute("aria-checked", current ? "true" : "false"); }
    btn.addEventListener("click", function () {
      current = current ? "" : chipId;
      store(function (s) { if (current) s.removeItem(KEY + chipId); else s.setItem(KEY + chipId, "1"); });
      sync();
      apply(current);
    });
    sync();
    doc.body.appendChild(el);
  }

  if (current) root.setAttribute("data-season", current);
  function ready() { apply(current); chip(); }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", ready); else ready();
})(typeof globalThis !== "undefined" ? globalThis : this);
