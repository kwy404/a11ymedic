// Interactive parts of the docs site, built with Voodoo.js (https://kwy404.github.io/Voodoo.js/).
// Every page loads Voodoo with data-manual: this module publishes pure helpers on
// V.config.globals, declares the page state with V.data and starts Voodoo. The HTML declares
// the behavior (v-model, v-text, v-for, @click, v-theme-toggle). Plain JavaScript only drives
// what lives outside Voodoo: the patient iframe, the a11ymedic engine and the clipboard.

const V = window.V;
const A = window.a11ymedic;

const T = {
  en: {
    chart: "Diagnosis chart",
    problems: "problems",
    notYet: "Not examined yet",
    critical: "critical",
    serious: "serious",
    moderate: "moderate",
    minor: "minor",
    treatSafe: "Treat safe fixes",
    treatAll: "Treat everything",
    reset: "Start over",
    healthy: "Healthy: no problems found. Patch signs the discharge papers.",
    waiting: "Waiting",
    conditions: ["Critical", "Serious", "Stable", "Recovering", "Healthy"],
    why: "Why it matters",
    who: "Who is affected",
    fix: "The fix",
    before: "Before",
    after: "After",
    treat: "Treat on the page",
    copy: "Copy fix",
    copied: "Copied",
    safe: "Safe to auto fix",
    examined: (n, m) => `Examined: ${n} ${n === 1 ? "problem" : "problems"}${m ? `, ${m} need a human check` : ""}.`,
    treated: (title, n) => `Treated "${title}". ${n} ${n === 1 ? "problem" : "problems"} left.`,
    treatedMany: (k, n) => `Applied ${k} ${k === 1 ? "fix" : "fixes"}. ${n} ${n === 1 ? "problem" : "problems"} left.`,
    empty: "Paste some HTML or a URL first.",
    since: "since the first exam",
    print: "Print report",
    saved: "The report was saved as a file.",
    yourHtml: "Your HTML",
    fetching: (host) => `Asking ${host} for its page...`,
    blocked: (host) => `Your browser could not read ${host}. The options below always work.`,
    httpError: (host, code) => `${host} answered with error ${code}. Check the address and try again.`,
    notHtml: (host) => `${host} did not send an HTML page. Paste the address of a web page.`,
  },
  pt: {
    chart: "Prontuário",
    problems: "problemas",
    notYet: "Ainda não examinado",
    critical: "crítico",
    serious: "grave",
    moderate: "moderado",
    minor: "leve",
    treatSafe: "Tratar correções seguras",
    treatAll: "Tratar tudo",
    reset: "Recomeçar",
    healthy: "Saudável: nenhum problema encontrado. Patch assina a alta.",
    waiting: "Aguardando",
    conditions: ["Crítico", "Grave", "Estável", "Em recuperação", "Saudável"],
    why: "Por que importa",
    who: "Quem é afetado",
    fix: "A correção",
    before: "Antes",
    after: "Depois",
    treat: "Tratar na página",
    copy: "Copiar correção",
    copied: "Copiado",
    safe: "Correção automática segura",
    examined: (n, m) => `Exame concluído: ${n} ${n === 1 ? "problema" : "problemas"}${m ? `, ${m} precisam de verificação humana` : ""}.`,
    treated: (title, n) => `Tratado: "${title}". Restam ${n} ${n === 1 ? "problema" : "problemas"}.`,
    treatedMany: (k, n) => `${k} ${k === 1 ? "correção aplicada" : "correções aplicadas"}. Restam ${n} ${n === 1 ? "problema" : "problemas"}.`,
    empty: "Cole algum HTML ou uma URL primeiro.",
    since: "desde o primeiro exame",
    print: "Imprimir relatório",
    saved: "O relatório foi salvo como arquivo.",
    yourHtml: "Seu HTML",
    fetching: (host) => `Pedindo a página para ${host}...`,
    blocked: (host) => `Seu navegador não conseguiu ler ${host}. As opções abaixo sempre funcionam.`,
    httpError: (host, code) => `${host} respondeu com o erro ${code}. Confira o endereço e tente de novo.`,
    notHtml: (host) => `${host} não enviou uma página HTML. Cole o endereço de uma página web.`,
  },
};

// The medicine cabinet: one entry per rule with its drawer, severity and search text.
let RULES = null;
function rules() {
  if (!RULES) {
    try {
      RULES = JSON.parse(document.getElementById("rule-data")?.textContent ?? "[]");
    } catch {
      RULES = [];
    }
  }
  return RULES;
}
const matches = (r, q, sev) => {
  if (sev !== "all" && sev !== r.s) return false;
  const words = String(q ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  return words.every((w) => r.h.includes(w));
};

/** Pure helpers the templates may call. */
const globals = {
  ruleVisible(id, q, sev) {
    const r = rules().find((x) => x.id === id);
    return r ? matches(r, q, sev) : true;
  },
  drawerCount(drawer, q, sev) {
    return rules().filter((r) => r.d === drawer && matches(r, q, sev)).length;
  },
  drawerTotal(q, sev) {
    return rules().filter((r) => matches(r, q, sev)).length;
  },
  scVisible(hay, level, q, lvl) {
    if (lvl !== "all" && lvl !== level) return false;
    const words = String(q ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    return words.every((w) => hay.includes(w));
  },
  hexOf(color) {
    const c = A?.parseColor(String(color ?? ""));
    return c ? A.toHex({ ...c, a: 1 }) : "#000000";
  },
};

if (V) {
  Object.assign(V.config.globals, globals);
  const frame = document.getElementById("patient");
  let samples = [];
  let raw = [];
  let doc = null;
  let pins = null;
  let skipSampleWatch = false;
  let lastResult = null;

  const S = V.data({
    menu: false,
    copied: "",
    // check-up
    tab: "samples",
    sample: "bakery",
    paste: "",
    level: "AA",
    lang: "en",
    t: T.en,
    ran: false,
    items: [],
    open: -1,
    total: 0,
    safeCount: 0,
    counts: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    status: "",
    patientName: "Bakery landing page",
    score: 0,
    shownScore: 0,
    delta: 0,
    mood: "sick",
    fresh: false,
    canPrint: typeof A?.printReport === "function",
    // the quick check in the hero
    quick: "",
    quickMsg: "",
    busy: false,
    corsUrl: "",
    corsHost: "",
    corsWhere: "",
    conditionText: T.en.waiting,
    healing: false,
    focusing: false,
    // contrast fixer
    fg: "#8a9ba8",
    bg: "#ffffff",
    target: "4.5",
    valid: true,
    ratioText: "",
    aaNormal: false,
    aaLarge: false,
    aaaNormal: false,
    passes: false,
    optFg: null,
    optBg: null,
    optBoth: null,
    // filters
    rq: "",
    rsev: "all",
    wq: "",
    wlevel: "all",

    async copyText(text, id) {
      try {
        await navigator.clipboard.writeText(text);
        S.copied = id;
        setTimeout(() => {
          if (S.copied === id) S.copied = "";
        }, 1600);
      } catch {
        S.copied = "";
      }
    },
    copy(button) {
      const fig = button.closest(".cl-code");
      const pre = fig && fig.querySelector("pre");
      if (pre) S.copyText(pre.textContent.replace(/\n$/, ""), fig.id);
    },
    run() {
      return examineFresh("room");
    },
    /** The hero box: HTML or a URL goes straight to the check-up room. */
    async quickCheck() {
      const text = String(S.quick ?? "").trim();
      if (!text) {
        S.quickMsg = S.t.empty;
        document.getElementById("quick-input")?.focus();
        return;
      }
      S.quickMsg = "";
      S.tab = "paste";
      S.paste = text;
      if (await examineFresh("hero")) showRoom();
    },
    async trySample(id) {
      S.quickMsg = "";
      S.tab = "samples";
      if (S.sample !== id) skipSampleWatch = true;
      S.sample = id;
      if (await examineFresh("hero")) showRoom();
    },
    tryUrl(url) {
      S.quick = new URL(url, location.href).href;
      return S.quickCheck();
    },
    toggle(i) {
      S.open = S.open === i ? -1 : i;
      focusElement(S.open);
    },
    treat(i) {
      const f = raw[i];
      if (!f || !A.applyFix(f)) return;
      examine();
      S.open = -1;
      S.status = S.t.treated(f.title[S.lang], raw.length);
      pulse("healing", 1300);
    },
    treatAll(safeOnly) {
      let applied = 0;
      for (let pass = 0; pass < 4; pass++) {
        const list = raw.filter((f) => (safeOnly ? f.fix.safe : f.fix.ops?.length));
        if (!list.length) break;
        for (const f of list) if (A.applyFix(f)) applied++;
        examine();
      }
      S.open = -1;
      S.status = S.t.treatedMany(applied, raw.length);
      if (applied) pulse("healing", 1300);
    },
    /** The chart as a print friendly report (it can be saved as PDF). */
    printChart() {
      if (!lastResult || typeof A.printReport !== "function") return;
      if (A.printReport({ ...lastResult, source: S.patientName }, { lang: S.lang }) === "downloaded") S.status = S.t.saved;
    },
    selfCheck() {
      A.overlay({ lang: S.lang });
    },
    swap() {
      const fg = S.fg;
      S.fg = S.bg;
      S.bg = fg;
    },
    useLens(option) {
      if (!option) return;
      S.fg = option.foreground;
      S.bg = option.background;
      pulse("focusing", 900);
    },
  });

  /** Sets a flag for `ms` so CSS can play a one shot animation (skipped with reduced motion). */
  const timers = {};
  function pulse(flag, ms) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearTimeout(timers[flag]);
    S[flag] = false;
    requestAnimationFrame(() => {
      S[flag] = true;
      timers[flag] = setTimeout(() => (S[flag] = false), ms);
    });
  }

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Health score from 0 to 100. Uses the engine score when the build has it. */
  function vitals() {
    let score = 0;
    let label = "";
    if (S.ran && typeof A.score === "function") {
      const s = A.score({ findings: raw });
      score = s.value;
      label = s.label?.[S.lang] ?? "";
    } else if (S.ran) {
      const c = S.counts;
      const penalty = c.critical * 10 + c.serious * 6 + c.moderate * 3 + c.minor;
      score = Math.round(100 * Math.exp(-penalty / 90));
    }
    S.score = score;
    S.delta = S.ran && startScore !== null ? Math.max(0, score - startScore) : 0;
    S.mood = !S.ran ? "sick" : score >= 100 ? "happy" : score >= 70 ? "ok" : "sick";
    const names = S.t.conditions;
    S.conditionText = !S.ran ? S.t.waiting : label || (score >= 100 ? names[4] : score >= 90 ? names[3] : score >= 70 ? names[2] : score >= 40 ? names[1] : names[0]);
    countTo(score);
  }

  /** Counts the score display up or down to the new value in about 0.7 seconds. */
  let counting = 0;
  function countTo(to) {
    cancelAnimationFrame(counting);
    const from = Number(S.shownScore) || 0;
    if (reduced() || from === to) {
      S.shownScore = to;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 700);
      const ease = 1 - Math.pow(1 - p, 3);
      S.shownScore = Math.round(from + (to - from) * ease);
      if (p < 1) counting = requestAnimationFrame(step);
    };
    counting = requestAnimationFrame(step);
  }

  /** Rebuilds the reactive view of the findings and redraws the pins. */
  function view() {
    const t = T[S.lang];
    const L = S.lang;
    S.t = t;
    S.items = raw.map((f, i) => ({
      key: `${f.id}:${i}`,
      i,
      n: i + 1,
      severity: f.severity,
      sevLabel: t[f.severity],
      title: f.title[L],
      message: f.message[L],
      explanation: f.explanation[L],
      affects: f.affects[L],
      wcagUrl: f.wcag[0]?.url ?? "",
      wcagLabel: f.wcag.map((w) => `${w.id} ${L === "pt" ? w.namePt : w.name} (${w.level})`).join(", "),
      summary: f.fix.summary[L],
      before: f.fix.before,
      after: f.fix.after,
      safe: f.fix.safe,
      treatable: !!f.fix.ops?.length,
      selector: f.selector,
    }));
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const f of raw) counts[f.severity]++;
    S.counts = counts;
    S.total = raw.length;
    S.safeCount = raw.filter((f) => f.fix.safe).length;
    vitals();
    if (doc) {
      pins?.remove();
      pins = A.drawPins(doc, raw, {
        lang: L,
        onSelect(i) {
          S.open = i;
          focusElement(i);
          requestAnimationFrame(() => {
            const item = document.getElementById(`finding-${i}`);
            item?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            item?.querySelector("button")?.focus({ preventScroll: true });
          });
        },
      });
    }
  }

  function examine() {
    if (!doc) return;
    const result = A.auditDocument(doc, { level: S.level });
    lastResult = result;
    raw = result.findings;
    S.ran = true;
    view();
    return result;
  }

  /** Scrolls the patient frame to an element and outlines it. */
  function focusElement(i) {
    pins?.highlight(i >= 0 ? i : null);
    const el = i >= 0 ? raw[i]?.element : null;
    if (!el || !doc) return;
    const win = doc.defaultView;
    const r = el.getBoundingClientRect();
    if (r.width || r.height) win.scrollTo({ top: Math.max(0, r.top + win.scrollY - 60), behavior: "auto" });
  }

  const looksLikeUrl = (text) => !/[\s<>]/.test(text) && (/^https?:\/\/\S+$/i.test(text) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(text));
  const escAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  /**
   * Downloads a page for the check. Only works when the site allows it (CORS), which is the
   * case for GitHub Pages and many static hosts. A <base> keeps its images and CSS working.
   */
  async function fetchPage(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      let res;
      try {
        res = await fetch(url, { mode: "cors", credentials: "omit", signal: ctrl.signal });
      } catch {
        return { error: "blocked" };
      }
      if (!res.ok) return { error: "http", code: res.status };
      const type = res.headers.get("content-type") ?? "";
      if (type && !/html|xml/i.test(type)) return { error: "type" };
      const base = `<base href="${escAttr(res.url || url)}">`;
      // Scripts cannot run in the sandboxed frame, so drop them instead of letting them fail.
      const text = (await res.text()).replace(/<script\b[\s\S]*?<\/script>/gi, "");
      return { html: /<head[^>]*>/i.test(text) ? text.replace(/<head[^>]*>/i, (m) => m + base) : base + text };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Loads the chosen patient into the frame and examines it. Resolves to true when it ran. */
  let runId = 0;
  let startScore = null;
  async function examineFresh(where = "room") {
    if (!frame) return false;
    const id = ++runId;
    S.busy = true;
    try {
      if (!samples.length) samples = (await import("./samples.js")).SAMPLES;
      const sample = samples.find((s) => s.id === S.sample) ?? samples[0];
      let html = S.tab === "paste" ? String(S.paste ?? "").trim() : sample.html;
      S.corsUrl = "";
      if (!html) {
        S.status = S.t.empty;
        if (where === "hero") S.quickMsg = S.t.empty;
        return false;
      }
      let name = S.tab === "paste" ? S.t.yourHtml : S.lang === "pt" ? sample.pt : sample.name;
      if (S.tab === "paste" && looksLikeUrl(html)) {
        const url = /^https?:/i.test(html) ? html : `https://${html}`;
        const u = new URL(url);
        const host = u.host;
        const say = (msg) => {
          S.status = msg;
          if (where === "hero") S.quickMsg = msg;
        };
        say(S.t.fetching(host));
        const page = await fetchPage(url);
        if (id !== runId) return false;
        if (page.error) {
          if (page.error === "blocked") {
            S.corsUrl = url;
            S.corsHost = host;
            S.corsWhere = where;
            S.status = S.t.blocked(host);
            // In the hero the help box itself is the message.
            if (where === "hero") S.quickMsg = "";
          } else say(page.error === "http" ? S.t.httpError(host, page.code) : S.t.notHtml(host));
          return false;
        }
        html = page.html;
        name = host + (u.pathname === "/" ? "" : u.pathname);
        if (where === "hero") S.quickMsg = "";
      }
      S.patientName = name;
      S.open = -1;
      startScore = null;
      await new Promise((resolve) => {
        frame.addEventListener("load", resolve, { once: true });
        frame.srcdoc = html;
      });
      if (id !== runId) return false;
      doc = frame.contentDocument;
      const result = examine();
      startScore = S.score;
      S.delta = 0;
      S.status = S.t.examined(raw.length, result?.incomplete.length ?? 0);
      pulse("fresh", 1200);
      return true;
    } finally {
      if (id === runId) S.busy = false;
    }
  }

  /** Brings the check-up room into view and moves focus to it, after a check from the hero. */
  function showRoom() {
    const title = document.getElementById("checkup-title");
    const intake = document.querySelector(".cl-intake");
    const exam = document.querySelector(".cl-exam");
    // On narrow screens the intake sits above the patient, so jump straight to the patient.
    const stacked = intake && exam && exam.getBoundingClientRect().top > intake.getBoundingClientRect().bottom - 20;
    (stacked ? exam : document.getElementById("checkup"))?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    title?.focus({ preventScroll: true });
  }

  // Contrast fixer: recompute whenever a color or the target changes.
  V.effect(() => {
    const fg = A?.parseColor(String(S.fg));
    const bg = A?.parseColor(String(S.bg));
    const target = Number(S.target);
    if (!A || !fg || !bg) {
      S.valid = false;
      return;
    }
    S.valid = true;
    const ratio = A.contrastRatio(fg, bg);
    S.ratioText = A.formatRatio(ratio);
    S.aaNormal = ratio >= 4.5;
    S.aaLarge = ratio >= 3;
    S.aaaNormal = ratio >= 7;
    S.passes = ratio >= target;
    const s = A.suggestColors(fg, bg, { ratio: target });
    const fmt = (o) => (o ? { foreground: o.foreground, background: o.background, ratio: A.formatRatio(o.ratio) } : null);
    S.optFg = S.passes ? null : fmt(s.foregroundOption);
    S.optBg = S.passes ? null : fmt(s.backgroundOption);
    S.optBoth = !S.passes && s.changed === "both" ? fmt(s) : null;
  });

  if (frame) {
    V.watch(() => S.lang, () => {
      view();
      if (samples.length && S.tab === "samples") {
        const sample = samples.find((s) => s.id === S.sample);
        if (sample) S.patientName = S.lang === "pt" ? sample.pt : sample.name;
      }
    });
    V.watch(() => S.level, () => examine());
    V.watch(() => S.sample, () => {
      if (skipSampleWatch) skipSampleWatch = false;
      else if (S.tab === "samples") examineFresh("room");
    });
    // Examine the first patient as soon as the page is idle, so the room is never empty.
    (window.requestIdleCallback ?? setTimeout)(() => examineFresh("room"));
  }

  // Open every drawer of the medicine cabinet while a search or a triage filter is active.
  const drawers = [...document.querySelectorAll(".cl-drawer")];
  if (drawers.length) {
    let auto = false;
    V.watch(
      () => [S.rq, S.rsev],
      () => {
        const filtering = String(S.rq).trim() !== "" || S.rsev !== "all";
        if (filtering && !auto) drawers.forEach((d) => (d.open = true));
        if (!filtering && auto) drawers.forEach((d) => (d.open = false));
        auto = filtering;
      },
    );
  }

  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && S.menu) S.menu = false;
  });

  V.start();
}

// Scroll reveal: groups marked data-reveal rise in once when they come into view. Content stays
// visible without this script, without IntersectionObserver and with reduced motion.
const groups = [...document.querySelectorAll("[data-reveal]")];
if (groups.length && "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (const g of groups) {
    [...g.children].forEach((child, i) => {
      if (!child.style.getPropertyValue("--step")) child.style.setProperty("--step", String(Math.min(i, 7)));
    });
    // Groups already on screen at load show at once, with no animation.
    const r = g.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) g.classList.add("is-in", "is-done");
  }
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const g = e.target;
        g.classList.add("is-in");
        io.unobserve(g);
        setTimeout(() => g.classList.add("is-done"), 1600);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  groups.filter((g) => !g.classList.contains("is-in")).forEach((g) => io.observe(g));
}
