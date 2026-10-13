import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const MAGIC = /[*?[{]/;

/** Converts a glob (with **, *, ?, [abc] and {a,b}) into an anchored regular expression. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  let inBraces = 0;
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i]!;
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        const slash = glob[i + 2] === "/";
        re += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else re += "[^/]*";
    } else if (ch === "?") re += "[^/]";
    else if (ch === "[") {
      const end = glob.indexOf("]", i);
      if (end < 0) re += "\\[";
      else {
        re += glob.slice(i, end + 1).replace(/^\[!/, "[^");
        i = end;
      }
    } else if (ch === "{") {
      inBraces++;
      re += "(?:";
    } else if (ch === "}" && inBraces) {
      inBraces--;
      re += ")";
    } else if (ch === "," && inBraces) re += "|";
    else re += /[.+^$()|\\]/.test(ch) ? `\\${ch}` : ch;
  }
  return new RegExp(`^${re}$`);
}

function walk(dir: string, out: string[], skipHeavy: boolean): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (skipHeavy && (name === "node_modules" || name === ".git")) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out, skipHeavy);
    else out.push(full);
  }
}

/**
 * Expands file paths, directories (all .html and .htm files inside) and globs into a sorted,
 * de-duplicated list of files. node_modules and .git are skipped unless the pattern names them.
 */
export function expandGlobs(patterns: string[], cwd = process.cwd()): string[] {
  const found = new Set<string>();
  for (const raw of patterns) {
    const pattern = raw.replace(/\\/g, "/");
    if (!MAGIC.test(pattern)) {
      const abs = resolve(cwd, pattern);
      try {
        const st = statSync(abs);
        if (st.isDirectory()) {
          for (const f of expandGlobs([`${pattern.replace(/\/$/, "")}/**/*.{html,htm}`], cwd)) found.add(f);
        } else found.add(abs);
      } catch {
        // Missing file: reported by the caller.
      }
      continue;
    }
    const parts = pattern.split("/");
    const staticParts: string[] = [];
    for (const p of parts) {
      if (MAGIC.test(p)) break;
      staticParts.push(p);
    }
    const base = resolve(cwd, staticParts.join("/") || ".");
    const rest = parts.slice(staticParts.length).join("/");
    const re = globToRegExp(rest);
    const files: string[] = [];
    walk(base, files, !/node_modules|\.git/.test(pattern));
    for (const f of files) {
      const rel = relative(base, f).split(sep).join("/");
      if (re.test(rel)) found.add(f);
    }
  }
  return [...found].sort();
}
