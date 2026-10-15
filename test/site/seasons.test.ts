// Site test: the seasonal theme dates in assets/seasons/seasons.js (copied to docs/seasons.js).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Seasons {
  ids: string[];
  easter(year: number): Date;
  detect(date: Date, lang?: string): string;
  resolve(date: Date, lang: string, search: string, isOff: ((id: string) => boolean) | null): string;
  label(id: string, lang?: string): string;
}

const source = readFileSync(new URL("../../assets/seasons/seasons.js", import.meta.url), "utf8");
const win: { kwySeasons?: Seasons } = {};
new Function(source.replace(/\}\)\(typeof globalThis[^;]*;\s*$/, "})(arguments[0]);"))(win);
const S = win.kwySeasons as Seasons;

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);
const iso = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

describe("easter", () => {
  it.each([
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2029, "2029-04-01"],
    [2030, "2030-04-21"],
  ])("%i is on %s", (year, date) => {
    expect(iso(S.easter(year))).toBe(date);
  });
});

describe("windows", () => {
  it("New Year runs from Dec 30 to Jan 2", () => {
    expect(S.detect(d(2026, 12, 29))).toBe("");
    expect(S.detect(d(2026, 12, 30))).toBe("newyear");
    expect(S.detect(d(2026, 12, 31))).toBe("newyear");
    expect(S.detect(d(2027, 1, 1))).toBe("newyear");
    expect(S.detect(d(2027, 1, 2))).toBe("newyear");
    expect(S.detect(d(2027, 1, 3))).toBe("");
  });

  it("Christmas runs from Dec 18 to Dec 26", () => {
    expect(S.detect(d(2026, 12, 17))).toBe("");
    expect(S.detect(d(2026, 12, 18))).toBe("christmas");
    expect(S.detect(d(2026, 12, 26))).toBe("christmas");
    expect(S.detect(d(2026, 12, 27))).toBe("");
  });

  it("Halloween runs from Oct 24 to Oct 31", () => {
    expect(S.detect(d(2026, 10, 23))).toBe("");
    expect(S.detect(d(2026, 10, 24))).toBe("halloween");
    expect(S.detect(d(2026, 10, 31))).toBe("halloween");
    expect(S.detect(d(2026, 11, 1))).toBe("");
  });

  it("Easter runs from Good Friday to Easter Sunday", () => {
    expect(S.detect(d(2026, 4, 2))).toBe("");
    expect(S.detect(d(2026, 4, 3))).toBe("easter");
    expect(S.detect(d(2026, 4, 5))).toBe("easter");
    expect(S.detect(d(2026, 4, 6))).toBe("");
    expect(S.detect(d(2027, 3, 26))).toBe("easter");
    expect(S.detect(d(2027, 3, 25))).toBe("");
  });

  it("Carnival runs from the Saturday before Ash Wednesday through Ash Wednesday", () => {
    // 2027: Easter March 28, Ash Wednesday February 10.
    expect(S.detect(d(2027, 2, 5))).toBe("");
    expect(S.detect(d(2027, 2, 6))).toBe("carnival");
    expect(S.detect(d(2027, 2, 9))).toBe("carnival");
    expect(S.detect(d(2027, 2, 10))).toBe("carnival");
    expect(S.detect(d(2027, 2, 11))).toBe("");
    // 2025: Ash Wednesday March 5.
    expect(S.detect(d(2025, 3, 1))).toBe("carnival");
    expect(S.detect(d(2025, 3, 5))).toBe("carnival");
    expect(S.detect(d(2025, 3, 6))).toBe("");
  });

  it("Valentine's is Feb 14, plus June 12 for pt-BR", () => {
    expect(S.detect(d(2027, 2, 13))).toBe("");
    expect(S.detect(d(2027, 2, 14))).toBe("valentine");
    expect(S.detect(d(2027, 2, 15))).toBe("");
    expect(S.detect(d(2027, 2, 14), "pt-BR")).toBe("valentine");
    expect(S.detect(d(2027, 6, 12))).toBe("");
    expect(S.detect(d(2027, 6, 12), "en-US")).toBe("");
    expect(S.detect(d(2027, 6, 12), "pt-PT")).toBe("");
    expect(S.detect(d(2027, 6, 12), "pt-BR")).toBe("valentine");
  });

  it("Feb 14 inside Carnival is Carnival in Brazil and Valentine's elsewhere", () => {
    // 2026: Ash Wednesday February 18, so Carnival starts February 14.
    expect(S.detect(d(2026, 2, 14), "pt-BR")).toBe("carnival");
    expect(S.detect(d(2026, 2, 14), "en")).toBe("valentine");
    expect(S.detect(d(2026, 2, 15), "en")).toBe("carnival");
  });

  it("Festa Junina runs from June 13 to June 29, called Midsummer outside Brazil", () => {
    expect(S.detect(d(2026, 6, 13), "pt-BR")).toBe("junina");
    expect(S.detect(d(2026, 6, 29), "pt-BR")).toBe("junina");
    expect(S.detect(d(2026, 6, 30), "pt-BR")).toBe("");
    expect(S.detect(d(2026, 6, 13))).toBe("junina");
    expect(S.label("junina", "pt-BR")).toBe("Festa Junina");
    expect(S.label("junina", "en-US")).toBe("Midsummer");
  });

  it("an ordinary day has no season", () => {
    expect(S.detect(d(2026, 8, 20))).toBe("");
    expect(S.detect(d(2026, 10, 15))).toBe("");
  });
});

describe("overrides", () => {
  const ordinary = d(2026, 8, 20);
  const spooky = d(2026, 10, 30);

  it("?season=<id> forces a season on any day", () => {
    for (const id of S.ids) expect(S.resolve(ordinary, "en", `?season=${id}`, null)).toBe(id);
    expect(S.resolve(ordinary, "en", "?lang=pt&season=christmas", null)).toBe("christmas");
  });

  it("?season=off and unknown ids turn it off", () => {
    expect(S.resolve(spooky, "en", "?season=off", null)).toBe("");
    expect(S.resolve(spooky, "en", "?season=summer", null)).toBe("");
  });

  it("the stored off switch hides a season, but a forced preview still shows it", () => {
    const off = (id: string) => id === "halloween";
    expect(S.resolve(spooky, "en", "", null)).toBe("halloween");
    expect(S.resolve(spooky, "en", "", off)).toBe("");
    expect(S.resolve(spooky, "en", "?season=halloween", off)).toBe("halloween");
  });
});
