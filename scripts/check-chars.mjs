// Fails when a tracked text file contains emoji, typographic dashes or banned words.
// Code must spell such characters as escapes (for example "\u" + "2014").
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const banned = [
  [0x1f000, 0x1faff, "emoji"],
  [0x2600, 0x27bf, "symbol or dingbat"],
  [0x2013, 0x2014, "en or em dash"],
  [0xfe0f, 0xfe0f, "emoji variation selector"],
];
const words = [
  [new RegExp("tail" + "wind", "i"), "CSS framework name"],
  [new RegExp("\\b(boot" + "strap|bul" + "ma)\\b", "i"), "CSS framework name"],
  [new RegExp("\\bclau" + "de\\b", "i"), "assistant name"],
  [new RegExp("\\b(chat" + "gpt|open" + "ai|anthro" + "pic)\\b", "i"), "vendor name"],
  [new RegExp("\\bA" + "I\\b|artificial intel" + "ligence"), "machine learning mention"],
];
const files = execSync("git ls-files --cached --others --exclude-standard", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !/\.(png|ico|jpg|gif|woff2?)$/i.test(f) && !f.startsWith("node_modules/"));

let problems = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  text.split("\n").forEach((line, index) => {
    for (const ch of line) {
      const cp = ch.codePointAt(0);
      const hit = banned.find(([from, to]) => cp >= from && cp <= to);
      if (hit) {
        problems++;
        console.error(`${file}:${index + 1}: U+${cp.toString(16).toUpperCase()} (${hit[2]})`);
      }
    }
    for (const [re, label] of words) {
      if (file === "package-lock.json") continue;
      if (re.test(line)) {
        problems++;
        console.error(`${file}:${index + 1}: banned word (${label})`);
      }
    }
  });
}
if (problems > 0) {
  console.error(`${problems} banned character(s) or word(s) found.`);
  process.exit(1);
}
console.log(`Checked ${files.length} files: no emoji, dashes or banned words.`);
