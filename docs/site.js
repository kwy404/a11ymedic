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
    healthy: "Healthy: no problems found. Patch approves.",
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
    empty: "Paste some HTML first.",
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
    healthy: "Saudável: nenhum problema encontrado. Patch aprova.",
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
    empty: "Cole algum HTML primeiro.",
  },
};

/** Pure helpers the templates may call. */
const globals = {
  ruleVisible(hay, severity, q, sev) {
    if (sev !== "all" && sev !== severity) return false;
    const words = String(q ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    return words.every((w) => hay.includes(w));
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
      return examineFresh();
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
    },
    selfCheck() {
      A.overlay({ lang: S.lang });
    },
    swap() {
      const fg = S.fg;
      S.fg = S.bg;
      S.bg = fg;
    },
  });

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

  async function examineFresh() {
    if (!frame) return;
    if (!samples.length) samples = (await import("./samples.js")).SAMPLES;
    const sample = samples.find((s) => s.id === S.sample) ?? samples[0];
    const html = S.tab === "paste" ? S.paste : sample.html;
    if (!html.trim()) {
      S.status = S.t.empty;
      return;
    }
    S.patientName = S.tab === "paste" ? (S.lang === "pt" ? "Seu HTML" : "Your HTML") : S.lang === "pt" ? sample.pt : sample.name;
    S.open = -1;
    await new Promise((resolve) => {
      frame.addEventListener("load", resolve, { once: true });
      frame.srcdoc = html;
    });
    doc = frame.contentDocument;
    const result = examine();
    S.status = S.t.examined(raw.length, result?.incomplete.length ?? 0);
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
      if (S.tab === "samples") examineFresh();
    });
    // Examine the first patient as soon as the page is idle, so the room is never empty.
    (window.requestIdleCallback ?? setTimeout)(() => examineFresh());
  }

  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && S.menu) S.menu = false;
  });

  V.start();
}
