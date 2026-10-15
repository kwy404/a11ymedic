import { describe, expect, it } from "vitest";
import {
  addEntry,
  audit,
  bookmarklet,
  cdnUrl,
  clearHistory,
  gradeOf,
  historyKey,
  memoryStorage,
  readHistory,
  recordScore,
  rulePoints,
  score,
  toEntry,
  version,
  type Finding,
  type HistoryEntry,
} from "../src/index";

const f = (rule: string, severity: Finding["severity"]): Pick<Finding, "rule" | "severity"> => ({ rule, severity });

describe("score", () => {
  it("is 100 for a clean result and below 100 for any finding", async () => {
    expect(score({ findings: [] })).toMatchObject({ value: 100, grade: "healthy", rules: [] });
    expect(score({ findings: [f("x", "minor")] as Finding[] }).value).toBe(99);
    const clean = await audit("<main><h1>Hi</h1></main>");
    expect(clean.score).toBe(100);
  });

  it("takes points per failing rule by severity, up to double when it repeats", () => {
    expect(rulePoints("critical", 1)).toBe(12);
    expect(rulePoints("serious", 1)).toBe(7);
    expect(rulePoints("moderate", 1)).toBe(3);
    expect(rulePoints("minor", 1)).toBe(1);
    expect(rulePoints("critical", 10)).toBe(24);
    expect(rulePoints("critical", 500)).toBe(24);
    expect(rulePoints("critical", 0)).toBe(0);
    const s = score({ findings: [f("image-alt", "critical"), f("image-alt", "critical"), f("color-contrast", "serious")] as Finding[] });
    expect(s.rules.map((r) => [r.rule, r.count, r.points])).toEqual([
      ["image-alt", 2, 15.6],
      ["color-contrast", 1, 7],
    ]);
    expect(s.value).toBe(77);
    expect(s.grade).toBe("fair");
    expect(s.label).toEqual({ en: "Needs care", pt: "Precisa de cuidados" });
  });

  it("never calls a page with a critical or serious problem healthy", async () => {
    const serious = score({ findings: [f("color-contrast", "serious")] as Finding[] });
    expect(serious).toMatchObject({ value: 93, grade: "fair" });
    expect(score({ findings: [f("input-purpose", "minor"), f("heading-order", "moderate")] as Finding[] })).toMatchObject({ value: 96, grade: "healthy" });
    const many = [await audit('<p style="color:#aaa">Low</p>'), ...(await Promise.all([1, 2, 3].map(() => audit("<p>ok</p>"))))];
    expect(score(many)).toMatchObject({ value: 98, grade: "fair" });
  });

  it("uses the worst severity when one rule reports several", () => {
    const s = score({ findings: [f("target-size", "minor"), f("target-size", "serious")] as Finding[] });
    expect(s.rules[0]).toMatchObject({ severity: "serious", count: 2 });
  });

  it("never goes below 0", () => {
    const findings = Array.from({ length: 12 }, (_, i) => f(`rule-${i}`, "critical")) as Finding[];
    expect(score({ findings }).value).toBe(0);
    expect(score({ findings }).grade).toBe("urgent");
  });

  it("grades", () => {
    expect([100, 90, 89, 70, 69, 50, 49, 0].map(gradeOf)).toEqual(["healthy", "healthy", "fair", "fair", "unwell", "unwell", "urgent", "urgent"]);
  });

  it("averages several results", async () => {
    const a = await audit('<img src="team.jpg">');
    const b = await audit("<p>ok</p>");
    expect(a.score).toBe(88);
    expect(score([a, b]).value).toBe(94);
    expect(score([]).value).toBe(100);
  });

  it("is part of every audit result and of the JSON", async () => {
    const r = await audit('<main><h1>Hi</h1><img src="team.jpg"><button></button></main>');
    expect(r.score).toBe(score(r).value);
    expect(JSON.parse(JSON.stringify(r)).score).toBe(r.score);
  });
});

describe("score history", () => {
  const counts = (critical = 0): HistoryEntry["counts"] => ({ critical, serious: 0, moderate: 0, minor: 0 });

  it("keys a page by its address without query and hash", () => {
    expect(historyKey("https://shop.test/cart?id=1#top")).toBe("https://shop.test/cart");
    expect(historyKey("http://localhost:3000/")).toBe("http://localhost:3000/");
    expect(historyKey("file:///C:/site/index.html")).toBe("file:/C:/site/index.html");
    expect(historyKey("src/index.html")).toBe("src/index.html");
  });

  it("records scores locally and reports the change since the last check", async () => {
    const storage = memoryStorage();
    const url = "https://shop.test/";
    const first = recordScore(url, await audit('<img src="a.png"><img src="b.png">'), { storage, now: new Date("2026-10-01T10:00:00Z") });
    expect(first.change).toBeNull();
    expect(first.previous).toBeNull();
    const second = recordScore(url + "?utm=x", await audit('<img src="a.png" alt="A">'), { storage, now: new Date("2026-10-02T10:00:00Z") });
    expect(second.previous!.score).toBe(first.entries[0]!.score);
    expect(second.change).toBe(100 - first.entries[0]!.score);
    const saved = readHistory(url, { storage });
    expect(saved.map((e) => [e.date.slice(0, 10), e.score, e.total])).toEqual([
      ["2026-10-01", 84, 2],
      ["2026-10-02", 100, 0],
    ]);
    expect(Object.keys(storage.data)).toEqual(["a11ymedic:history:https://shop.test/"]);
    clearHistory(url, { storage });
    expect(readHistory(url, { storage })).toEqual([]);
  });

  it("does not repeat a check with the same result, only moves its date", () => {
    const a: HistoryEntry = { date: "2026-10-01T00:00:00.000Z", score: 80, total: 2, counts: counts(1) };
    const b: HistoryEntry = { ...a, date: "2026-10-03T00:00:00.000Z" };
    expect(addEntry([a], b)).toEqual([b]);
    const c: HistoryEntry = { ...a, score: 90, counts: counts(0) };
    expect(addEntry([a], c)).toHaveLength(2);
  });

  it("keeps at most the newest entries", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < 40; i++) list = addEntry(list, { date: `d${i}`, score: i, total: 1, counts: counts(i) });
    expect(list).toHaveLength(30);
    expect(list[0]!.score).toBe(10);
    expect(addEntry(list, { date: "x", score: 1, total: 1, counts: counts(99) }, 3).map((e) => e.date)).toEqual(["d38", "d39", "x"]);
  });

  it("survives blocked, broken or missing storage", async () => {
    const result = await audit('<img src="a.png">');
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(recordScore("p", result, { storage: blocked }).entries).toHaveLength(1);
    expect(readHistory("p", { storage: blocked })).toEqual([]);
    expect(() => clearHistory("p", { storage: blocked })).not.toThrow();
    expect(readHistory("p", { storage: memoryStorage({ "a11ymedic:history:p": "{not json" }) })).toEqual([]);
    expect(readHistory("p", { storage: memoryStorage({ "a11ymedic:history:p": '[{"score":"x"},{"date":"d","score":5,"total":1,"counts":{}}]' }) })).toHaveLength(1);
    expect(recordScore("p", result, { storage: null }).change).toBeNull();
  });

  it("builds an entry from a result", async () => {
    const r = await audit('<img src="a.png">');
    expect(toEntry(r, new Date("2026-10-15T12:00:00Z"))).toEqual({ date: "2026-10-15T12:00:00.000Z", score: 88, total: 1, counts: { critical: 1, serious: 0, moderate: 0, minor: 0 } });
  });
});

describe("bookmarklet", () => {
  it("loads the browser build of this version once, then toggles the panel", () => {
    const url = bookmarklet();
    expect(url.startsWith("javascript:(function(){")).toBe(true);
    expect(url).toContain(`s.src='${cdnUrl()}'`);
    expect(cdnUrl()).toBe(`https://cdn.jsdelivr.net/npm/a11ymedic@${version}/dist/a11ymedic.js`);
    expect(url).toContain("if(a&&a.toggleOverlay){a.toggleOverlay({});return}");
    expect(url).not.toMatch(/\s/);
  });

  it("is valid JavaScript that loads the script, and toggles when it is already there", () => {
    const code = decodeURIComponent(bookmarklet({ lang: "pt", src: "https://example.test/a11ymedic.js" }).slice("javascript:".length));
    const appended: Array<{ src: string; attrs: Record<string, string> }> = [];
    const calls: unknown[] = [];
    const fakeDocument = {
      createElement: () => {
        const el = { src: "", attrs: {} as Record<string, string>, onerror: null, setAttribute: (k: string, v: string) => (el.attrs[k] = v) };
        return el;
      },
      body: { appendChild: (el: { src: string; attrs: Record<string, string> }) => appended.push(el) },
    };
    const fakeWindow: { a11ymedic?: { toggleOverlay(o: unknown): void } } = {};
    const run = new Function("window", "document", "alert", code) as (w: unknown, d: unknown, a: unknown) => void;
    run(fakeWindow, fakeDocument, () => {});
    expect(appended).toEqual([{ src: "https://example.test/a11ymedic.js", attrs: { "data-overlay": "pt" }, onerror: expect.any(Function), setAttribute: expect.any(Function) }]);
    fakeWindow.a11ymedic = { toggleOverlay: (o) => calls.push(o) };
    run(fakeWindow, fakeDocument, () => {});
    expect(calls).toEqual([{ lang: "pt" }]);
    expect(appended).toHaveLength(1);
  });

  it("refuses a src that would break out of the string", () => {
    expect(() => bookmarklet({ src: "https://x.test/a'.js" })).toThrow(/quotes/);
  });
});
