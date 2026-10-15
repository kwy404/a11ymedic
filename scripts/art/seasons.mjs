// Seasonal art for the special dates: Patch in costume, a hero accent for the clinic scene and
// three icons per season, all hand written SVG. Writes, for each season id:
//
//   assets/seasons/<id>/patch-light.svg, patch-dark.svg   Patch in costume (full body)
//   assets/seasons/<id>/patch-head.svg                     the head in costume (footer, cards)
//   assets/seasons/<id>/accent-light.svg, accent-dark.svg  the hero accent, in scene coordinates
//   assets/seasons/<id>/icons/<name>-light.svg, -dark.svg  the three seasonal icons
//
// and one sprite for the site, docs/assets/seasons/seasons.svg, whose symbols take their colors
// from the --a-* and --ic-* custom properties so the theme toggle recolors them. The site sets
// <use href="assets/seasons/seasons.svg#<id>-costume"> only while a season is on.
//
//   node scripts/art/seasons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { C, patchGroup, patchGroupDefs } from "./build.mjs";
import { ART, ICON, themeable } from "./clinic.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = 'stroke-linecap="round" stroke-linejoin="round"';

/** Seasonal colors: muted so they sit well on the warm paper and on the dark teal night. */
const S = {
  pumpkin: "#e0874a",
  pumpkinDark: "#b8642f",
  witch: "#5e4b7c",
  witchDark: "#463863",
  leaf: "#4f7d58",
  santa: "#c4473f",
  santaDark: "#9c3730",
  snow: "#fbf7ef",
  pine: "#3f7d5c",
  gold: "#e3b552",
  mask: "#6d5a9e",
  feather: "#e07a8a",
  straw: "#dcb366",
  strawDark: "#b98d45",
  flame: "#ef8f4a",
  heart: "#e07a8a",
  heartDark: "#c25a6c",
  lilac: "#b7a6dc",
  mint: "#9fd8c4",
  butter: "#f2d98a",
  wicker: "#b98a55",
  wickerDark: "#8f6738",
  night: "#2c4b63",
};

export const SEASONS = {
  newyear: "New Year",
  carnival: "Carnival",
  easter: "Easter",
  valentine: "Valentine's",
  junina: "Festa Junina and Midsummer",
  halloween: "Halloween",
  christmas: "Christmas",
};

// ------------------------------------------------------------------------- shapes

const heartPath = (x, y, s) =>
  `M${x} ${y + s * 0.9}C${x - s * 1.1} ${y + s * 0.2} ${x - s * 1.2} ${y - s * 0.7} ${x - s * 0.6} ${y - s * 0.9}C${x - s * 0.25} ${y - s} ${x} ${y - s * 0.75} ${x} ${y - s * 0.45}C${x} ${y - s * 0.75} ${x + s * 0.25} ${y - s} ${x + s * 0.6} ${y - s * 0.9}C${x + s * 1.2} ${y - s * 0.7} ${x + s * 1.1} ${y + s * 0.2} ${x} ${y + s * 0.9}Z`;

/** A firework: rays and dots around a center, no fill, so it never reads as a flash. */
const burst = (x, y, r, color, ink, sw = 5) => {
  const rays = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x1 = x + Math.cos(a) * r * 0.42;
    const y1 = y + Math.sin(a) * r * 0.42;
    const x2 = x + Math.cos(a) * r;
    const y2 = y + Math.sin(a) * r;
    rays.push(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }
  const dots = [0.3, 1.1, 2.0, 2.9, 3.8, 4.7, 5.6].map((a) => `<circle cx="${(x + Math.cos(a) * r * 1.22).toFixed(1)}" cy="${(y + Math.sin(a) * r * 1.22).toFixed(1)}" r="${(sw * 0.55).toFixed(1)}" fill="${color}"/>`).join("");
  return `<path d="${rays.join("")}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${sw * 0.8}" fill="${color}" stroke="${ink}" stroke-width="${sw * 0.4}"/>${dots}`;
};

const flag = (x, y, w, h, fill, ink, sw) => `<path d="M${x} ${y}h${w}l${-w / 2} ${h}Z" fill="${fill}" stroke="${ink}" stroke-width="${sw}" ${R}/>`;

// ------------------------------------------------------------------------- costumes
// Drawn in Patch's 400 x 400 box with his ink and line weight. `head` holds what sits on the
// head (hats, masks); `body` what goes on the body or in his paws. Patch's head spans x 102 to
// 298 and y 50 (cap) to 234; his bag sits at x 40 to 148, y 258 to 364; his right paw holds a
// button near 284, 257.

const ink = C.ink;
const W = `stroke="${ink}" stroke-width="7" ${R}`;
const w4 = `stroke="${ink}" stroke-width="4.5" ${R}`;

const COSTUMES = {
  halloween: {
    head:
      `<path d="M138 104C156 66 176 30 196 -6C206 -24 226 -30 244 -20C228 -12 222 2 226 22C232 54 246 82 262 104Z" fill="${S.witch}" ${W}/>` +
      `<path d="M150 82C182 92 220 92 252 82L260 102C222 112 178 112 140 102Z" fill="${S.pumpkin}" ${w4}/>` +
      `<rect x="190" y="84" width="22" height="20" rx="4" fill="${S.gold}" ${w4}/>` +
      `<ellipse cx="200" cy="108" rx="124" ry="20" fill="${S.witchDark}" ${W}/>` +
      `<path d="M150 72C160 52 170 34 180 18" fill="none" stroke="#7d6a9c" stroke-width="5" stroke-linecap="round"/>`,
    body:
      `<g ${W}><ellipse cx="66" cy="330" rx="30" ry="36" fill="${S.pumpkin}"/><ellipse cx="122" cy="330" rx="30" ry="36" fill="${S.pumpkin}"/><ellipse cx="94" cy="328" rx="34" ry="40" fill="${S.pumpkin}"/>` +
      `<path d="M94 290C92 280 96 272 104 268" fill="none" stroke-width="9"/><path d="M94 290C92 280 96 272 104 268" fill="none" stroke="${S.leaf}" stroke-width="4"/></g>` +
      `<g fill="${S.gold}" ${w4}><path d="M70 318l12-12 10 14Z"/><path d="M118 318l-12-12-10 14Z"/><path d="M66 340q28 22 56 0l-8 10-8-6-10 8-10-8-8 6Z"/></g>`,
  },
  christmas: {
    head:
      `<path d="M126 112C122 70 158 42 204 42C248 42 280 68 296 102C306 124 314 150 318 176" fill="${S.santa}" ${W}/>` +
      `<path d="M210 50C238 52 262 66 278 88" fill="none" stroke="#e0756c" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="116" y="98" width="172" height="34" rx="17" fill="${S.snow}" ${W}/>` +
      `<circle cx="318" cy="184" r="18" fill="${S.snow}" ${W}/>`,
    body:
      `<path d="M134 220C170 240 230 240 266 220L272 248C232 266 168 266 128 248Z" fill="${S.pine}" ${W}/>` +
      `<path d="M226 246L238 306L266 300L254 242Z" fill="${S.pine}" ${W}/>` +
      `<path d="M160 236l-6 22M190 242l-4 22M220 242l2 22M248 234l6 22M232 270l26-6M236 288l26-6" fill="none" stroke="${S.snow}" stroke-width="6" stroke-linecap="round"/>`,
  },
  carnival: {
    head:
      `<path d="M136 128C112 100 102 70 112 44C124 72 140 98 150 124Z" fill="${S.feather}" ${w4}/>` +
      `<path d="M150 124C140 92 140 62 154 40C160 70 164 98 164 124Z" fill="${S.gold}" ${w4}/>` +
      `<path d="M128 152C128 128 166 122 200 136C234 122 272 128 272 152C274 180 242 188 222 176C212 170 206 166 200 166C194 166 188 170 178 176C158 188 126 180 128 152Z" fill="${S.mask}" ${W}/>` +
      `<ellipse cx="166" cy="154" rx="17" ry="13" fill="${C.cream}" ${w4}/><ellipse cx="234" cy="154" rx="17" ry="13" fill="${C.cream}" ${w4}/>` +
      `<circle cx="166" cy="155" r="9" fill="${ink}"/><circle cx="234" cy="155" r="9" fill="${ink}"/><circle cx="163" cy="151" r="3.4" fill="#fff"/><circle cx="231" cy="151" r="3.4" fill="#fff"/>` +
      `<path d="M140 140q8-8 16-6M244 134q8-2 16 6" fill="none" stroke="${S.gold}" stroke-width="5" stroke-linecap="round"/>`,
    body:
      `<g ${w4}><rect x="320" y="120" width="14" height="9" rx="2" fill="${S.gold}" transform="rotate(24 327 124)"/><rect x="60" y="210" width="14" height="9" rx="2" fill="${S.mint}" transform="rotate(-30 67 214)"/>` +
      `<rect x="340" y="300" width="14" height="9" rx="2" fill="${S.feather}" transform="rotate(12 347 304)"/><circle cx="54" cy="150" r="7" fill="${S.lilac}"/><circle cx="352" cy="200" r="7" fill="${S.mint}"/></g>` +
      `<path d="M300 90c14 12 4 24 18 34s4 26 18 30" fill="none" stroke="${S.lilac}" stroke-width="7" stroke-linecap="round"/>`,
  },
  junina: {
    head:
      `<path d="M148 104C146 64 170 46 200 46C230 46 254 64 252 104Z" fill="${S.straw}" ${W}/>` +
      `<path d="M150 86C182 94 218 94 250 86L252 102C218 110 182 110 148 102Z" fill="${C.coral}" ${w4}/>` +
      `<rect x="214" y="58" width="20" height="18" rx="3" fill="${C.teal}" ${w4}/><path d="M218 62h12M218 67h12M218 72h12" stroke="${C.cream}" stroke-width="2" stroke-dasharray="3 3"/>` +
      `<ellipse cx="200" cy="108" rx="136" ry="22" fill="${S.straw}" ${W}/>` +
      `<path d="M92 108q12 6 24 4M284 112q12-2 24-4M140 120q30 8 60 8M220 128q30 0 60-8" fill="none" stroke="${S.strawDark}" stroke-width="4" stroke-linecap="round"/>`,
    body:
      `<g fill="${C.brownDark}" stroke="none"><circle cx="150" cy="176" r="2.5"/><circle cx="142" cy="170" r="2.5"/><circle cx="158" cy="170" r="2.5"/><circle cx="250" cy="176" r="2.5"/><circle cx="242" cy="170" r="2.5"/><circle cx="258" cy="170" r="2.5"/></g>`,
  },
  valentine: {
    head: `<path d="${heartPath(200, 84, 13)}" fill="${S.heart}" stroke="${ink}" stroke-width="3" ${R}/>`,
    body:
      `<path d="M286 250C300 200 318 160 334 110" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M328 112l6-10 6 10Z" fill="${S.heartDark}" ${w4}/>` +
      `<path d="${heartPath(334, 62, 44)}" fill="${S.heart}" ${W}/>` +
      `<path d="M312 40q8-10 20-8" fill="none" stroke="#f3b4bd" stroke-width="6" stroke-linecap="round"/>`,
  },
  easter: {
    head:
      `<path d="M168 70C148 32 140 -8 154 -32C172 -38 186 0 188 60Z" fill="${C.creamLight}" ${W}/><path d="M168 46C160 24 158 4 162 -14C170 2 174 24 176 46Z" fill="#f3b4bd"/>` +
      `<path d="M212 60C214 0 232 -38 250 -30C262 -6 252 34 232 70Z" fill="${C.creamLight}" ${W}/><path d="M222 46C224 24 230 4 238 -10C242 8 238 28 230 46Z" fill="#f3b4bd"/>` +
      `<path d="M150 74C170 52 230 52 250 74" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round"/><path d="M150 74C170 52 230 52 250 74" fill="none" stroke="${S.lilac}" stroke-width="7" stroke-linecap="round"/>`,
    body:
      `<path d="M52 304C50 246 138 246 136 304" fill="none" stroke="${ink}" stroke-width="16" stroke-linecap="round"/><path d="M52 304C50 246 138 246 136 304" fill="none" stroke="${S.wicker}" stroke-width="8" stroke-linecap="round"/>` +
      `<g ${W}><ellipse cx="68" cy="290" rx="16" ry="21" fill="${S.mint}"/><ellipse cx="120" cy="290" rx="16" ry="21" fill="${S.butter}"/><ellipse cx="94" cy="282" rx="17" ry="23" fill="#f3b4bd"/></g>` +
      `<path d="M80 280l6-6 6 6 6-6 6 6M56 292l6-5 6 5 6-5M108 292l6-5 6 5 6-5" fill="none" stroke="${ink}" stroke-width="3" ${R}/>` +
      `<path d="M30 296H158L144 366H44Z" fill="${S.wicker}" ${W}/>` +
      `<path d="M40 318H150M44 340H146M66 296L70 366M94 296V366M122 296L118 366" fill="none" stroke="${S.wickerDark}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M30 296H158L144 366H44Z" fill="none" ${W}/>`,
  },
  newyear: {
    head:
      `<path d="M172 64L214 -40L250 58Z" fill="${S.gold}" ${W}/>` +
      `<path d="M186 30L236 40M196 6L226 12" fill="none" stroke="${C.teal}" stroke-width="7" stroke-linecap="round"/>` +
      `<circle cx="214" cy="-42" r="12" fill="${C.coral}" ${w4}/>` +
      `<path d="M172 64L214 -40L250 58Z" fill="none" ${W}/>`,
    body: `${burst(60, 52, 34, S.gold, ink)}${burst(352, 40, 28, C.coral, ink)}${burst(356, 156, 18, S.mint, ink, 4)}`,
  },
};

// ------------------------------------------------------------------------- hero accents
// Drawn in the clinic scene's 760 x 600 box with its palette `k`. The window spans x 40 to 220,
// y 52 to 238 (sill at 236), the eye chart x 262 to 362, the clock sits at 440, 128, the monitor
// at x 530 to 696, y 58 to 174, and the floor starts near y 520. The top band (y 0 to 40) is free.

function garland(k, from, to, sag, items) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const at = (t) => [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t ** 2 * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t ** 2 * y2];
  const out = [`<path d="M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${k.ink}" stroke-width="3" stroke-linecap="round"/>`];
  items.forEach((draw, i) => {
    const [x, y] = at((i + 0.5) / items.length);
    out.push(draw(Math.round(x), Math.round(y), i));
  });
  return out.join("");
}

const ACCENTS = {
  halloween: (k) =>
    // bats under the ceiling, a web in the corner and a pumpkin on the window sill
    [
      [300, 22, 1],
      [380, 34, 0.8],
      [470, 20, 0.9],
    ]
      .map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0c-6-8-16-10-26-6 6 2 8 8 6 12-6-4-12-2-14 2 8 0 14 4 16 10 6-6 12-8 18-8 6 0 12 2 18 8 2-6 8-10 16-10-2-4-8-6-14-2-2-4 0-10 6-12-10-4-20-2-26 6Z" fill="${S.witchDark}" stroke="${k.ink}" stroke-width="2" ${R}/>`)
      .join("") +
    `<g fill="none" stroke="${k.ink}" stroke-width="2" stroke-opacity=".55" stroke-linecap="round"><path d="M760 0 680 0M760 0 700 60M760 0 760 80"/><path d="M738 0q-6 16 22 22M716 0q-10 34 44 42M700 0q-12 50 60 64"/></g>` +
    `<g stroke="${k.ink}" stroke-width="3" ${R}><ellipse cx="70" cy="222" rx="16" ry="15" fill="${S.pumpkin}"/><ellipse cx="96" cy="222" rx="16" ry="15" fill="${S.pumpkin}"/><ellipse cx="83" cy="220" rx="17" ry="17" fill="${S.pumpkin}"/><path d="M83 204q0-8 6-10" fill="none" stroke-width="4"/></g>` +
    `<g fill="${S.gold}" stroke="${k.ink}" stroke-width="1.5" ${R}><path d="M74 216l6-6 4 7Z"/><path d="M92 216l-6-6-4 7Z"/><path d="M72 226q11 8 22 0l-4 5-3-3-4 4-4-4-3 3Z"/></g>`,
  christmas: (k) =>
    garland(k, [250, 6], [520, 6], 34, Array.from({ length: 9 }, () => (x, y, i) => `<path d="M${x - 3} ${y}h6v5h-6Z" fill="${k.metalDark}" stroke="${k.ink}" stroke-width="2"/><ellipse cx="${x}" cy="${y + 13}" rx="6" ry="9" fill="${[S.santa, S.gold, S.pine][i % 3]}" stroke="${k.ink}" stroke-width="2"/>`)) +
    `<path d="M30 236q20-14 40-4 18-12 38-2 22-12 42-2 22-10 40 2 18-8 42 4" fill="${S.snow}" stroke="${k.ink}" stroke-width="3" ${R}/>` +
    `<g transform="translate(440 198) scale(.8)" stroke="${k.ink}" stroke-width="3" ${R}><circle r="26" fill="none" stroke="${S.pine}" stroke-width="12"/><circle r="26" fill="none" stroke-width="2.5"/><circle r="20" fill="none" stroke-width="2.5"/><path d="M-6 22l6 10 6-10Z" fill="${S.santa}"/><circle cx="-14" cy="-16" r="3.5" fill="${S.santa}"/><circle cx="18" cy="-10" r="3.5" fill="${S.gold}"/><circle cx="-20" cy="10" r="3.5" fill="${S.gold}"/></g>`,
  carnival: (k) =>
    [
      [250, 8, S.feather],
      [250, 22, S.mint],
      [250, 14, S.gold],
    ]
      .map(([x, y, c], i) => `<path d="M${x} ${y}c40 30 70-20 110 10s70-20 110 10 70-20 110 10 60-14 90 4" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" transform="translate(0 ${i * 4})"/>`)
      .join("") +
    `<g stroke="${k.ink}" stroke-width="1.5">${[
      [470, 200, S.gold],
      [500, 236, S.feather],
      [380, 290, S.mint],
      [250, 280, S.lilac],
      [520, 300, S.gold],
      [400, 60, S.feather],
    ]
      .map(([x, y, c], i) => `<rect x="${x}" y="${y}" width="10" height="6" rx="1.5" fill="${c}" transform="rotate(${i * 37} ${x + 5} ${y + 3})"/>`)
      .join("")}</g>`,
  junina: (k) =>
    garland(k, [240, 4], [520, 4], 30, Array.from({ length: 10 }, () => (x, y, i) => flag(x - 10, y, 20, 22, [C.coral, S.butter, S.mint, S.lilac, ART.light.teal][i % 5], k.ink, 2))) +
    garland(k, [540, 2], [756, 18], 24, Array.from({ length: 7 }, () => (x, y, i) => flag(x - 10, y, 20, 22, [S.butter, S.mint, C.coral, S.lilac][i % 4], k.ink, 2))) +
    `<g transform="translate(628 560)" stroke="${k.ink}" stroke-width="3" ${R}><path d="M-34 6l68-14M-34 -8l68 14" stroke-width="10"/><path d="M-34 6l68-14M-34 -8l68 14" stroke="${S.wicker}" stroke-width="5"/>` +
    `<path d="M0 -10C-22 -16 -20 -40 -8 -54C-8 -40 0 -36 2 -46C12 -38 20 -26 16 -14C24 -20 26 -28 24 -36C34 -22 26 -8 0 -10Z" fill="${S.flame}"/><path d="M2 -12C-8 -16 -8 -28 0 -34C2 -26 8 -24 8 -20C12 -18 10 -12 2 -12Z" fill="${S.butter}"/></g>`,
  valentine: (k) =>
    garland(k, [250, 6], [520, 6], 34, Array.from({ length: 8 }, () => (x, y, i) => `<path d="${heartPath(x, y + 12, 9)}" fill="${i % 2 ? S.heart : "#f3b4bd"}" stroke="${k.ink}" stroke-width="2" ${R}/>`)) +
    `<path d="${heartPath(440, 200, 18)}" fill="${S.heart}" stroke="${k.ink}" stroke-width="3" ${R}/><path d="M430 192q4-7 10-7" fill="none" stroke="#f3b4bd" stroke-width="4" stroke-linecap="round"/>` +
    `<g transform="translate(200 214)" stroke="${k.ink}" stroke-width="2.5" ${R}><path d="M0 22V0" /><path d="${heartPath(0, -6, 9)}" fill="${S.heart}"/></g>`,
  easter: (k) =>
    garland(k, [250, 6], [520, 6], 30, Array.from({ length: 9 }, () => (x, y, i) => flag(x - 10, y, 20, 20, [S.mint, S.butter, "#f3b4bd", S.lilac][i % 4], k.ink, 2))) +
    `<g stroke="${k.ink}" stroke-width="3" ${R}><ellipse cx="612" cy="548" rx="14" ry="18" fill="${S.mint}"/><ellipse cx="642" cy="552" rx="13" ry="16" fill="${S.butter}"/><ellipse cx="668" cy="548" rx="12" ry="15" fill="#f3b4bd"/>` +
    `<path d="M602 548l5-5 5 5 5-5 5 5M634 552l4-4 4 4 4-4 4 4M660 548l4-4 4 4 4-4" fill="none" stroke-width="2"/></g>` +
    `<g transform="translate(196 214)" stroke="${k.ink}" stroke-width="2.5" ${R}><path d="M0 22V2" /><circle cy="-4" r="5" fill="${S.butter}"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-12" rx="4" ry="6" fill="${S.lilac}" transform="rotate(${a} 0 -4)"/>`).join("")}<circle cy="-4" r="4" fill="${S.butter}"/></g>`,
  newyear: (k) =>
    `<g>${burst(92, 104, 28, S.gold, k.ink, 4)}${burst(174, 152, 20, C.coral, k.ink, 3.5)}${burst(170, 84, 14, S.mint, k.ink, 3)}</g>` +
    [
      [250, 10, S.gold],
      [250, 22, C.coral],
    ]
      .map(([x, y, c]) => `<path d="M${x} ${y}c40 24 70-16 110 8s70-16 110 8 70-16 110 8" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`)
      .join(""),
};

// ------------------------------------------------------------------------- icons
// 24 x 24, the clinic icon style: 2px round ink strokes, duotone fills.

const ICONS = {
  halloween: [
    ["pumpkin", "Pumpkin", (_k) => `<ellipse cx="8.5" cy="14" rx="5" ry="6" fill="${S.pumpkin}"/><ellipse cx="15.5" cy="14" rx="5" ry="6" fill="${S.pumpkin}"/><ellipse cx="12" cy="14" rx="5" ry="6.5" fill="${S.pumpkin}"/><path d="M12 7.5c0-2 1-3.5 3-4"/><path d="M9.5 12.5l1.5-1.5 1 1.5M14.5 12.5l-1.5-1.5-1 1.5" stroke-width="1.5"/><path d="M9 16.5q3 2 6 0" stroke-width="1.5"/>`],
    ["bat", "Bat", (k) => `<path d="M12 9c-2-3-6-4-10-2 2 1 3 3 2 5-2-1-3 0-3 1 3 0 5 1 6 3 2-2 3-3 5-3s3 1 5 3c1-2 3-3 6-3 0-1-1-2-3-1-1-2 0-4 2-5-4-2-8-1-10 2Z" fill="${S.witch}"/><circle cx="11" cy="11" r=".6" fill="${k.paper}" stroke="none"/><circle cx="13" cy="11" r=".6" fill="${k.paper}" stroke="none"/>`],
    ["witch-hat", "Witch hat", (k) => `<path d="M6 17C8 12 10 7 12.5 3c1-1 3-1 4 0-1 .5-1.5 2-1 4 .5 3 1.5 7 2.5 10Z" fill="${S.witch}"/><path d="M8 14.5c3 1 6 1 9 0" stroke="${S.pumpkin}" stroke-width="2.5"/><ellipse cx="12" cy="18" rx="9.5" ry="2.5" fill="${k.teal}"/>`],
  ],
  christmas: [
    ["snowflake", "Snowflake", (k) => `<circle cx="12" cy="12" r="3" fill="${k.teal}"/><path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M10 4.5l2 2 2-2M10 19.5l2-2 2 2"/>`],
    ["gift", "Gift", (k) => `<rect x="3.5" y="9" width="17" height="11.5" rx="2" fill="${k.coral}"/><rect x="2.5" y="6.5" width="19" height="4" rx="1.5" fill="${k.paper}"/><path d="M12 6.5v14"/><path d="M12 6.5C10 3 6.5 3.5 7.5 5.5 8.2 6.7 12 6.5 12 6.5ZM12 6.5c2-3.5 5.5-3 4.5-1-.7 1.2-4.5 1-4.5 1Z" fill="${S.gold}"/>`],
    ["ornament", "Ornament", (k) => `<circle cx="12" cy="14" r="7" fill="${S.santa}"/><rect x="10" y="4.5" width="4" height="3" rx="1" fill="${k.paper}"/><path d="M12 4.5c0-1.5 1.5-2 2-1"/><path d="M5.5 12.5q6.5 3 13 0" stroke="${S.gold}" stroke-width="2.5"/><path d="M5.5 12.5q6.5 3 13 0"/>`],
  ],
  carnival: [
    ["mask", "Carnival mask", (k) => `<path d="M2.5 10c0-3 4.5-3.5 9.5-2 5-1.5 9.5-1 9.5 2 0 4-3.5 5-6 3.5-1.5-1-2.5-1.5-3.5-1.5s-2 .5-3.5 1.5C6 15 2.5 14 2.5 10Z" fill="${S.mask}"/><ellipse cx="7.5" cy="10.5" rx="2" ry="1.5" fill="${k.paper}"/><ellipse cx="16.5" cy="10.5" rx="2" ry="1.5" fill="${k.paper}"/><path d="M4 7C3 4 4 2 5.5 1.5c0 2 1 4 2 5.5" fill="${S.feather}"/>`],
    ["confetti", "Confetti", (k) => `<path d="M3 21 7.5 8.5 15.5 16.5Z" fill="${k.teal}"/><path d="M6 15.5l2.5 2.5"/><rect x="14" y="3" width="3" height="2" rx=".5" fill="${S.gold}" transform="rotate(25 15.5 4)"/><rect x="18.5" y="9" width="3" height="2" rx=".5" fill="${k.coral}" transform="rotate(-20 20 10)"/><circle cx="11" cy="4.5" r="1.2" fill="${S.lilac}"/><path d="M13 9.5c1.5-1.5 3-1 3.5-3M15 12.5c1.5-1 3 0 4.5-1.5"/>`],
    ["streamer", "Streamer", (k) => `<path d="M3 5c3 0 3 4 6 4s3-4 6-4 3 4 6 4" stroke="${k.coral}" stroke-width="3"/><path d="M3 5c3 0 3 4 6 4s3-4 6-4 3 4 6 4"/><path d="M3 14c3 0 3 4 6 4s3-4 6-4 3 4 6 4" stroke="${k.teal}" stroke-width="3"/><path d="M3 14c3 0 3 4 6 4s3-4 6-4 3 4 6 4"/>`],
  ],
  junina: [
    ["flags", "Party flags", (k) => `<path d="M2 4q10 5 20 0"/><path d="M4 5h5l-2.5 6Z" fill="${k.coral}"/><path d="M10 6.2h5l-2.5 6Z" fill="${S.butter}"/><path d="M16 5.5h5l-2.5 6Z" fill="${k.teal}"/><path d="M5 15q7 4 14 0"/><path d="M7 16.2h4.5l-2.25 5Z" fill="${S.lilac}"/><path d="M12.5 16.5H17l-2.25 5Z" fill="${S.mint}"/>`],
    ["bonfire", "Bonfire", (_k) => `<path d="M4 21l16-4M4 17l16 4" stroke-width="3"/><path d="M12 17c-4-1-5-5-3-8 0 2 1 3 2 2 0-3 1-5 3-6 0 2 3 4 3 7 0 3-2 5-5 5Z" fill="${S.flame}"/><path d="M12 17c-1.5-.5-2-2-1-3.5.5 1 1 1 1.5.5.5 1 1.5 1.5 1.5 2.5 0 .5-1 .5-2 .5Z" fill="${S.butter}"/>`],
    ["straw-hat", "Straw hat", (k) => `<path d="M7 14c0-5 2-8 5-8s5 3 5 8Z" fill="${S.straw}"/><path d="M7.2 12h9.6" stroke="${k.coral}" stroke-width="2.5"/><ellipse cx="12" cy="15" rx="10" ry="3" fill="${S.straw}"/><rect x="13" y="7.5" width="2.5" height="2.5" rx=".5" fill="${k.teal}" stroke-width="1"/>`],
  ],
  valentine: [
    ["heart", "Heart", (k) => `<path d="${heartPath(12, 11.5, 9)}" fill="${S.heart}"/><path d="M7 8.5q1-2 3-2" stroke="${k.paper}"/>`],
    ["love-letter", "Love letter", (k) => `<rect x="3" y="6" width="18" height="13" rx="2" fill="${k.paper}"/><path d="M3.5 7l8.5 6.5L20.5 7"/><path d="${heartPath(12, 15.5, 2.6)}" fill="${S.heart}" stroke-width="1.2"/>`],
    ["heart-balloon", "Heart balloon", (k) => `<path d="${heartPath(13, 8, 6.5)}" fill="${k.coral}"/><path d="M13 14c-1 2 0 3-1.5 4.5S10 21 11 22"/>`],
  ],
  easter: [
    ["egg", "Painted egg", (k) => `<path d="M12 2.5c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11Z" fill="${S.mint}"/><path d="M5.5 11.5l2-1.5 2 1.5 2.5-1.5 2.5 1.5 2-1.5 2 1.5" /><path d="M5.3 15.5h13.4" stroke="${k.coral}" stroke-width="2.5"/>`],
    ["bunny", "Bunny", (k) => `<path d="M9 10C7 6 7 2 8.5 1.5 10.5 1.5 11 5 11 9.5ZM15 10c2-4 2-8 .5-8.5-2 0-2.5 3.5-2.5 8Z" fill="${k.paper}"/><circle cx="12" cy="15" r="6.5" fill="${k.paper}"/><circle cx="9.8" cy="14" r=".9" fill="${k.ink}" stroke="none"/><circle cx="14.2" cy="14" r=".9" fill="${k.ink}" stroke="none"/><path d="M11 17h2l-1 1Z" fill="${k.coral}" stroke-width="1"/>`],
    ["flower", "Spring flower", (k) => `<path d="M12 22v-8"/><path d="M12 18c-2-2-4-2-5-1 1 2 3 2 5 1Z" fill="${k.teal}"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="12" cy="5.2" rx="2.4" ry="3.2" fill="${S.lilac}" transform="rotate(${a} 12 9)"/>`).join("")}<circle cx="12" cy="9" r="2.3" fill="${S.butter}"/>`],
  ],
  newyear: [
    ["firework", "Firework", (_k) => `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M12 7.5V3" transform="rotate(${a} 12 12)"/>`).join("")}<circle cx="12" cy="12" r="2.5" fill="${S.gold}"/>`],
    ["party-hat", "Party hat", (k) => `<path d="M6 20.5 12 3l6 17.5Z" fill="${S.gold}"/><path d="M8.5 14l7 2M10 9.5l4 1" stroke="${k.teal}" stroke-width="2.5"/><path d="M6 20.5 12 3l6 17.5Z"/><circle cx="12" cy="2.6" r="1.6" fill="${k.coral}"/>`],
    ["midnight", "Clock at midnight", (k) => `<circle cx="12" cy="13" r="8.5" fill="${k.paper}"/><path d="M12 13V7.5M12 13l.01 0"/><path d="M12 13V7.5" stroke="${k.coral}" stroke-width="2.5"/><path d="M12 4.5V2.5M9 2.5h6"/><path d="M5 5.5l1.5 1.5M19 5.5 17.5 7"/>`],
  ],
};

// ------------------------------------------------------------------------- files

const write = (rel, content) => {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

/** Patch in costume as a standalone file. */
function patchFile(id, dark) {
  const p = `patch-${id}${dark ? "-dark" : ""}`;
  const c = COSTUMES[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -60 420 440" width="420" height="440" role="img" aria-labelledby="${p}-title">
<title id="${p}-title">Patch, the a11ymedic otter paramedic, dressed up for ${SEASONS[id]}</title>
<defs>${patchGroupDefs(p, dark)}</defs>
${patchGroup(p, dark)}${c.body}${c.head}
</svg>
`;
}

function headFile(id) {
  const c = COSTUMES[id];
  // The head is the full mascot cropped to the face, so the costume stays in the same place.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="72 -50 256 300" width="256" height="300" role="img" aria-labelledby="patch-head-${id}-title">
<title id="patch-head-${id}-title">Patch, the a11ymedic otter paramedic, dressed up for ${SEASONS[id]}</title>
<defs>${patchGroupDefs(`ph-${id}`, false)}<clipPath id="ph-${id}-crop"><rect x="72" y="-50" width="256" height="290"/></clipPath></defs>
<g clip-path="url(#ph-${id}-crop)">${patchGroup(`ph-${id}`, false).replace(/<ellipse cx="214" cy="378"[^>]*\/>/, "")}${c.head}</g>
</svg>
`;
}

function accentFile(id, mode) {
  const k = ART[mode];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 600" width="760" height="600" role="img" aria-labelledby="accent-${id}-title">
<title id="accent-${id}-title">${SEASONS[id]} decorations for the a11ymedic clinic</title>
${ACCENTS[id](k)}
</svg>
`;
}

function iconFile(draw, label, mode) {
  const k = { ...ICON[mode] };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-labelledby="t">
<title id="t">${label}</title>
<g fill="none" stroke="${k.ink}" stroke-width="2" ${R}>${draw(k)}</g>
</svg>
`;
}

/** The site sprite: costume and accent in scene coordinates, icons on the 24 grid. */
function sprite() {
  const fallback = { ...ART.light };
  const k = Object.fromEntries(Object.keys(ART.light).map((key) => [key, `var(--a-${key}, ${fallback[key]})`]));
  const ki = Object.fromEntries(Object.entries(ICON.var).map(([key, v]) => [key, v.replace(")", `, ${ICON.light[key]})`)]));
  const out = ['<svg xmlns="http://www.w3.org/2000/svg">'];
  for (const id of Object.keys(SEASONS)) {
    const c = COSTUMES[id];
    // Patch sits at translate(4 282) scale(.72) in the clinic scene.
    out.push(`<symbol id="${id}-costume" viewBox="0 0 760 600"><g transform="translate(4 282) scale(.72)">${c.body}${c.head}</g></symbol>`);
    out.push(`<symbol id="${id}-accent" viewBox="0 0 760 600">${themeable(ACCENTS[id](k))}</symbol>`);
    ICONS[id].forEach(([, , draw], i) => {
      out.push(`<symbol id="${id}-icon-${i + 1}" viewBox="0 0 24 24">${themeable(`<g fill="none" stroke="${ki.ink}" stroke-width="2" ${R}>${draw(ki)}</g>`)}</symbol>`);
    });
  }
  out.push("</svg>");
  return out.join("\n") + "\n";
}

export function writeSeasons() {
  let files = 0;
  for (const id of Object.keys(SEASONS)) {
    const base = `assets/seasons/${id}`;
    write(`${base}/patch-light.svg`, patchFile(id, false));
    write(`${base}/patch-dark.svg`, patchFile(id, true));
    write(`${base}/patch-head.svg`, headFile(id));
    for (const mode of ["light", "dark"]) {
      write(`${base}/accent-${mode}.svg`, accentFile(id, mode));
      for (const [name, label, draw] of ICONS[id]) write(`${base}/icons/${name}-${mode}.svg`, iconFile(draw, label, mode));
    }
    write(`docs/assets/seasons/${id}/patch-head.svg`, headFile(id));
    files += 5 + ICONS[id].length * 2;
  }
  write("docs/assets/seasons/seasons.svg", sprite());
  return files;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(`wrote ${writeSeasons()} seasonal art files and the site sprite`);
}
