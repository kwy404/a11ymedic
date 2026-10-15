import { SEVERITIES, type AuditResult, type Severity } from "./types";
import { score as scoreOf } from "./score";

/** One check-up in the score history. */
export interface HistoryEntry {
  /** ISO date and time of the check. */
  date: string;
  score: number;
  /** Number of findings. */
  total: number;
  counts: Record<Severity, number>;
}

/** The part of the Web Storage API the history needs (localStorage fits). */
export interface HistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface HistoryOptions {
  /** Where to keep the history. Default: localStorage when it is available. */
  storage?: HistoryStorage | null;
  /** Keep at most this many entries per page. Default 30. */
  max?: number;
  /** The time of the check. Default now. */
  now?: Date;
}

export interface HistoryUpdate {
  entries: HistoryEntry[];
  /** The check before this one, if any. */
  previous: HistoryEntry | null;
  /** Points gained (positive) or lost (negative) since the previous check; null on the first one. */
  change: number | null;
}

const PREFIX = "a11ymedic:history:";

/**
 * The history key of a page: its address without the query string and hash, so
 * `https://shop.test/cart?id=1#top` and `https://shop.test/cart` share one history.
 */
export function historyKey(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:") return `${u.origin === "null" ? u.protocol : u.origin}${u.pathname}`;
  } catch {
    // Not a URL: a file path or a name.
  }
  return url.split(/[?#]/)[0]!;
}

function defaultStorage(): HistoryStorage | null {
  try {
    const s = (globalThis as { localStorage?: HistoryStorage }).localStorage;
    return s ?? null;
  } catch {
    // Storage can throw when blocked (private windows, sandboxed frames).
    return null;
  }
}

function valid(e: unknown): e is HistoryEntry {
  const x = e as HistoryEntry;
  return !!x && typeof x.date === "string" && typeof x.score === "number" && typeof x.total === "number" && !!x.counts;
}

/** The saved history of a page, oldest first. Empty when there is none or storage is blocked. */
export function readHistory(key: string, options: Pick<HistoryOptions, "storage"> = {}): HistoryEntry[] {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(PREFIX + historyKey(key)) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(valid) : [];
  } catch {
    return [];
  }
}

/** Forgets the history of a page. */
export function clearHistory(key: string, options: Pick<HistoryOptions, "storage"> = {}): void {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  try {
    storage?.removeItem(PREFIX + historyKey(key));
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

/** Adds a check to a list of entries. A check with the same result as the last one only moves its date. */
export function addEntry(entries: HistoryEntry[], entry: HistoryEntry, max = 30): HistoryEntry[] {
  const last = entries[entries.length - 1];
  const same = !!last && last.score === entry.score && SEVERITIES.every((s) => last.counts[s] === entry.counts[s]);
  const next = same ? [...entries.slice(0, -1), entry] : [...entries, entry];
  return next.slice(-Math.max(1, max));
}

/** The history entry of an audit result. */
export function toEntry(result: Pick<AuditResult, "findings" | "counts"> & { score?: number }, now: Date = new Date()): HistoryEntry {
  return {
    date: now.toISOString(),
    score: result.score ?? scoreOf(result).value,
    total: result.findings.length,
    counts: { ...result.counts },
  };
}

/**
 * Saves the score of a check-up in the local history of a page (localStorage by default; nothing
 * leaves the browser) and tells how it changed since the last check.
 *
 *   const { change } = recordScore(location.href, result); // +6
 */
export function recordScore(key: string, result: Pick<AuditResult, "findings" | "counts"> & { score?: number }, options: HistoryOptions = {}): HistoryUpdate {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const before = readHistory(key, { storage });
  const entry = toEntry(result, options.now);
  const entries = addEntry(before, entry, options.max ?? 30);
  // The previous check is the last one that is not being replaced.
  const previous = entries.length >= 2 ? entries[entries.length - 2]! : null;
  if (storage) {
    try {
      storage.setItem(PREFIX + historyKey(key), JSON.stringify(entries));
    } catch {
      // Storage full or blocked: the change is still reported for this session.
    }
  }
  return { entries, previous, change: previous ? entry.score - previous.score : null };
}

/** A tiny in-memory storage, handy for tests and for runtimes without localStorage. */
export function memoryStorage(initial: Record<string, string> = {}): HistoryStorage & { data: Record<string, string> } {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}
