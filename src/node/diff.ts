/** A compact unified diff of two texts, with `context` unchanged lines around each change. */
export function unifiedDiff(a: string, b: string, file = "file", context = 2): string {
  if (a === b) return "";
  const x = a.split("\n");
  const y = b.split("\n");
  let pre = 0;
  while (pre < x.length && pre < y.length && x[pre] === y[pre]) pre++;
  let suf = 0;
  while (suf < x.length - pre && suf < y.length - pre && x[x.length - 1 - suf] === y[y.length - 1 - suf]) suf++;
  const xm = x.slice(pre, x.length - suf);
  const ym = y.slice(pre, y.length - suf);
  // LCS on the changed middle only.
  const n = xm.length;
  const m = ym.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i]![j] = xm[i] === ym[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  type Op = { t: " " | "-" | "+"; s: string; ai: number; bi: number };
  const ops: Op[] = [];
  for (let k = 0; k < pre; k++) ops.push({ t: " ", s: x[k]!, ai: k, bi: k });
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && xm[i] === ym[j]) {
      ops.push({ t: " ", s: xm[i]!, ai: pre + i, bi: pre + j });
      i++;
      j++;
    } else if (i < n && (j >= m || dp[i + 1]![j]! >= dp[i]![j + 1]!)) {
      ops.push({ t: "-", s: xm[i]!, ai: pre + i, bi: pre + j });
      i++;
    } else {
      ops.push({ t: "+", s: ym[j]!, ai: pre + i, bi: pre + j });
      j++;
    }
  }
  for (let k = 0; k < suf; k++) ops.push({ t: " ", s: x[x.length - suf + k]!, ai: x.length - suf + k, bi: y.length - suf + k });
  const out = [`--- ${file}`, `+++ ${file}`];
  let k = 0;
  while (k < ops.length) {
    if (ops[k]!.t === " ") {
      k++;
      continue;
    }
    let start = Math.max(0, k - context);
    let end = k;
    while (end < ops.length) {
      if (ops[end]!.t !== " ") {
        end++;
        continue;
      }
      let run = 0;
      while (end + run < ops.length && ops[end + run]!.t === " ") run++;
      if (end + run >= ops.length || run > context * 2) {
        end = Math.min(ops.length, end + context);
        break;
      }
      end += run;
    }
    const hunk = ops.slice(start, end);
    const aLen = hunk.filter((o) => o.t !== "+").length;
    const bLen = hunk.filter((o) => o.t !== "-").length;
    out.push(`@@ -${hunk[0]!.ai + 1},${aLen} +${hunk[0]!.bi + 1},${bLen} @@`);
    for (const o of hunk) out.push(`${o.t}${o.s}`);
    k = end;
    start = end;
  }
  return out.join("\n") + "\n";
}
