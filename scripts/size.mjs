// Prints the raw and gzip size of the browser build and the main entry points.
import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";

for (const file of ["dist/a11ymedic.js", "dist/index.js", "dist/cli.js"]) {
  const raw = statSync(file).size;
  const gz = gzipSync(readFileSync(file)).length;
  console.log(`${file.padEnd(22)} ${(raw / 1024).toFixed(1).padStart(7)} KB  ${(gz / 1024).toFixed(1).padStart(6)} KB gzip`);
}
