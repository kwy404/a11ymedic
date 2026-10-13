// Builds the a11ymedic art: Patch the otter paramedic (full body, dark variant,
// head), the favicon, the README banners and the icon set. Every file is plain,
// hand written SVG with fixed colors, so it renders the same on GitHub, npm and
// the docs site. Run with `node scripts/art/build.mjs`; scripts/art/render.sh
// runs it before rendering the PNG previews.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const C = {
  ink: "#12343B",
  brown: "#A8693D",
  brownDark: "#7F4A2A",
  cream: "#F7E3C6",
  creamLight: "#FFF5E8",
  teal: "#0F8B8D",
  tealDark: "#0A6B6D",
  tealLight: "#2EC4B6",
  coral: "#FF7A66",
  coralDark: "#E35E4B",
  plaster: "#F9C89E",
  pad: "#EDA27A",
  reflect: "#D9F6F1",
  white: "#FFFFFF",
  bgLight: "#F1FAF9",
  bgDark: "#0B1F24",
  textDark: "#12343B",
  mutedDark: "#46666C",
  textLight: "#E8F6F5",
  mutedLight: "#9FC9C6",
};

const SANS = "Segoe UI, Helvetica, Arial, sans-serif";

// Patch ---------------------------------------------------------------------------
// Drawn in a 400 x 400 box. `p` prefixes the ids so several copies can live in one
// document.

const BODY = "M138 226C122 258 112 298 118 330C124 356 160 368 200 368C240 368 276 356 282 330C288 298 278 258 262 226Z";
const HEAD = "M200 62C260 62 298 100 298 150C298 202 258 234 200 234C142 234 102 202 102 150C102 100 140 62 200 62Z";

function accessMark(cx, cy, s, color) {
  // The universal access symbol: a ring and a figure with open arms.
  const k = (n) => +(n * s).toFixed(2);
  return `<g transform="translate(${cx} ${cy})" fill="none" stroke="${color}" stroke-width="${k(3)}" stroke-linecap="round" stroke-linejoin="round">` +
    `<circle r="${k(14)}"/><circle cy="${k(-7.5)}" r="${k(2.4)}" fill="${color}" stroke="none"/>` +
    `<path d="M${k(-7.5)} ${k(-2.5)}H${k(7.5)}M0 ${k(-2.5)}V${k(3.5)}L${k(-4.5)} ${k(9.5)}M0 ${k(3.5)}L${k(4.5)} ${k(9.5)}"/></g>`;
}

function headParts() {
  return [
    // ears
    `<circle cx="113" cy="112" r="14" fill="${C.brown}"/><circle cx="287" cy="112" r="14" fill="${C.brown}"/>`,
    `<circle cx="112" cy="112" r="6" fill="${C.brownDark}" stroke="none"/><circle cx="288" cy="112" r="6" fill="${C.brownDark}" stroke="none"/>`,
    // head, light lower face, outline again on top of the face
    `<path d="${HEAD}" fill="${C.brown}"/>`,
    `<path d="M132 186C134 162 168 158 200 170C232 158 266 162 268 186C270 214 240 234 200 234C160 234 130 214 132 186Z" fill="${C.cream}" stroke="none"/>`,
    `<path d="${HEAD}" fill="none"/>`,
    // blush
    `<ellipse cx="146" cy="184" rx="12" ry="7" fill="${C.coral}" fill-opacity=".45" stroke="none"/><ellipse cx="254" cy="184" rx="12" ry="7" fill="${C.coral}" fill-opacity=".45" stroke="none"/>`,
    // eyes
    `<circle cx="166" cy="154" r="12" fill="${C.ink}" stroke="none"/><circle cx="234" cy="154" r="12" fill="${C.ink}" stroke="none"/>`,
    `<circle cx="161.5" cy="149" r="4.5" fill="${C.white}" stroke="none"/><circle cx="229.5" cy="149" r="4.5" fill="${C.white}" stroke="none"/>`,
    `<circle cx="170" cy="159" r="1.8" fill="${C.white}" stroke="none"/><circle cx="238" cy="159" r="1.8" fill="${C.white}" stroke="none"/>`,
    // whiskers
    `<path d="M166 194L134 188M166 203L137 208M234 194L266 188M234 203L263 208" fill="none" stroke-width="3.5"/>`,
    // mouth, then muzzle puffs over its top
    `<path d="M189 206C192 222 208 222 211 206Z" fill="${C.coralDark}" stroke-width="4.5"/>`,
    `<ellipse cx="183" cy="196" rx="20" ry="15" fill="${C.creamLight}" stroke-width="5"/><ellipse cx="217" cy="196" rx="20" ry="15" fill="${C.creamLight}" stroke-width="5"/>`,
    `<g fill="${C.ink}" stroke="none"><circle cx="175" cy="195" r="2"/><circle cx="184" cy="202" r="2"/><circle cx="171" cy="203" r="2"/><circle cx="225" cy="195" r="2"/><circle cx="216" cy="202" r="2"/><circle cx="229" cy="203" r="2"/></g>`,
    // nose
    `<path d="M184 181C184 172 216 172 216 181C216 190 207 196 200 196C193 196 184 190 184 181Z" fill="${C.ink}" stroke-width="4"/>`,
    `<ellipse cx="194" cy="178" rx="5" ry="2.6" fill="${C.white}" fill-opacity=".85" stroke="none"/>`,
    // paramedic cap with a cross badge
    `<path d="M134 108C132 72 164 50 200 50C236 50 268 72 266 108Z" fill="${C.teal}"/>`,
    `<path d="M156 70C164 62 176 57 188 56" fill="none" stroke="${C.tealLight}" stroke-width="5" stroke-opacity=".7"/>`,
    `<circle cx="200" cy="51" r="6" fill="${C.tealDark}" stroke-width="5"/>`,
    `<circle cx="200" cy="83" r="17" fill="${C.white}" stroke-width="5"/>`,
    `<path d="M195.5 72H204.5V78.5H211V87.5H204.5V94H195.5V87.5H189V78.5H195.5Z" fill="${C.coral}" stroke="none"/>`,
    `<path d="M126 104C158 118 242 118 274 104C281 108 280 118 272 122C238 134 162 134 128 122C120 118 119 108 126 104Z" fill="${C.tealDark}"/>`,
  ].join("");
}

function bag() {
  return [
    `<path d="M72 292C72 258 124 258 124 292" fill="none" stroke-width="10"/>`,
    `<rect x="40" y="288" width="108" height="76" rx="16" fill="${C.coral}"/>`,
    `<path d="M56 288H132A16 16 0 0 1 148 304V312H40V304A16 16 0 0 1 56 288Z" fill="${C.coralDark}" stroke="none"/>`,
    `<path d="M40 312H148" fill="none" stroke-width="5"/>`,
    `<rect x="40" y="288" width="108" height="76" rx="16" fill="none"/>`,
    `<circle cx="94" cy="338" r="19" fill="${C.white}" stroke-width="4.5"/>`,
    accessMark(94, 338, 0.92, C.teal),
  ].join("");
}

function brokenButton() {
  const plaster = (angle) =>
    `<g transform="rotate(${angle})"><rect x="-29" y="-8.5" width="58" height="17" rx="7" fill="${C.plaster}" stroke-width="4"/>` +
    `<rect x="-8.5" y="-5.5" width="17" height="11" rx="2.5" fill="${C.pad}" stroke="none"/>` +
    `<g fill="${C.ink}" fill-opacity=".45" stroke="none"><circle cx="-19" cy="-2.5" r="1.4"/><circle cx="-19" cy="2.5" r="1.4"/><circle cx="19" cy="-2.5" r="1.4"/><circle cx="19" cy="2.5" r="1.4"/></g></g>`;
  // A UI button with a label, a crack through its right half and a crossed bandage.
  return `<g transform="translate(328 228) rotate(-12)">` +
    `<rect x="-58" y="-29" width="116" height="58" rx="16" fill="${C.white}"/>` +
    `<path d="M-42 -5H-10" fill="none" stroke="${C.teal}" stroke-width="8"/>` +
    `<path d="M-42 10H-22" fill="none" stroke="${C.tealLight}" stroke-width="6"/>` +
    `<path d="M25 -29L16 -15L28 -4L17 8L23 29" fill="none" stroke-width="4.5"/>` +
    `<g transform="translate(22 0)">${plaster(32)}${plaster(-32)}</g></g>`;
}

function arm(d) {
  return `<path d="${d}" fill="none" stroke-width="34"/><path d="${d}" fill="none" stroke="${C.brown}" stroke-width="20"/>`;
}

function paw(cx, cy, rot) {
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})"><ellipse rx="16" ry="13" fill="${C.brown}"/>` +
    `<path d="M-5 -8V-2M3 -8V-2" fill="none" stroke-width="3.5"/></g>`;
}

function bodyParts(p) {
  return [
    // tail
    `<path d="M256 320C296 334 336 342 358 316C370 302 386 308 382 330C374 362 320 378 260 358Z" fill="${C.brownDark}"/>`,
    // body and vest
    `<path d="${BODY}" fill="${C.brown}"/>`,
    `<g clip-path="url(#${p}-body)">`,
    `<path d="M90 214H310V338C270 352 130 352 90 338Z" fill="${C.teal}" stroke-width="5"/>`,
    `<rect x="90" y="298" width="220" height="16" fill="${C.reflect}" stroke-width="4"/>`,
    `<path d="M300 302H90M300 310H90" fill="none" stroke="${C.tealLight}" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="butt"/>`,
    `<path d="M170 212C186 250 194 290 196 352H204C206 290 214 250 230 212Z" fill="${C.cream}" stroke-width="5"/>`,
    `</g>`,
    `<path d="${BODY}" fill="none"/>`,
    `<rect x="220" y="258" width="28" height="28" rx="7" fill="${C.white}" stroke-width="4.5"/>`,
    `<path d="M231 264H237V269H242V275H237V280H231V275H226V269H231Z" fill="${C.coral}" stroke="none"/>`,
    // feet
    `<ellipse cx="164" cy="366" rx="27" ry="13" fill="${C.brown}"/><ellipse cx="236" cy="366" rx="27" ry="13" fill="${C.brown}"/>`,
    `<path d="M156 358V364M166 357V363M234 357V363M244 358V364" fill="none" stroke-width="3.5"/>`,
  ].join("");
}

function patchArt(p, { shadow = true } = {}) {
  return [
    shadow ? `<ellipse cx="214" cy="378" rx="168" ry="10" fill="${C.ink}" fill-opacity=".09"/>` : "",
    `<g stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">`,
    bodyParts(p),
    headParts(),
    arm("M150 246C134 254 116 262 104 268"),
    bag(),
    paw(100, 270, -20),
    arm("M248 252C260 258 272 260 282 258"),
    brokenButton(),
    paw(284, 257, -25),
    `</g>`,
  ].join("");
}

function patchDefs(p) {
  return `<clipPath id="${p}-body"><path d="${BODY}"/></clipPath>`;
}

function rimFilter(id, radius = 5) {
  return `<filter id="${id}" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">` +
    `<feMorphology in="SourceAlpha" operator="dilate" radius="${radius}" result="grown"/>` +
    `<feFlood flood-color="${C.textLight}"/><feComposite in2="grown" operator="in" result="rim"/>` +
    `<feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

/** Patch as a group in the 400 box, for embedding into larger documents. */
export function patchGroup(p, dark) {
  const art = patchArt(p, { shadow: !dark });
  return dark ? `<g filter="url(#${p}-rim)">${art}</g>` : art;
}
export function patchGroupDefs(p, dark) {
  return patchDefs(p) + (dark ? rimFilter(`${p}-rim`) : "");
}

const MASCOT_TITLE = "Patch, the a11ymedic mascot: a friendly otter paramedic with an accessibility first aid bag and a bandaged button";

function mascotSvg(dark) {
  const p = dark ? "patch-dark" : "patch";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-labelledby="${p}-title">
<title id="${p}-title">${MASCOT_TITLE}</title>
<defs>${patchGroupDefs(p, dark)}</defs>
${patchGroup(p, dark)}
</svg>
`;
}

function headSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="82 26 236 236" width="256" height="256" role="img" aria-labelledby="patch-head-title">
<title id="patch-head-title">Patch, the a11ymedic otter paramedic</title>
<g stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${headParts()}</g>
</svg>
`;
}

function faviconSvg() {
  // A simplified Patch head on a teal tile, built to read at 16 px.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-labelledby="favicon-title">
<title id="favicon-title">a11ymedic</title>
<rect width="64" height="64" rx="14" fill="${C.teal}"/>
<g stroke="${C.ink}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
<circle cx="12.5" cy="33" r="6" fill="${C.brown}"/><circle cx="51.5" cy="33" r="6" fill="${C.brown}"/>
<path d="M32 13C46 13 55 22 55 35C55 48 45 57 32 57C19 57 9 48 9 35C9 22 18 13 32 13Z" fill="${C.brown}"/>
<path d="M17 45C17 38 25 37 32 40C39 37 47 38 47 45C47 52 40 57 32 57C24 57 17 52 17 45Z" fill="${C.cream}" stroke="none"/>
<path d="M32 13C46 13 55 22 55 35C55 48 45 57 32 57C19 57 9 48 9 35C9 22 18 13 32 13Z" fill="none"/>
<path d="M24 45.5L14.5 44M24 49L15.5 51.5M40 45.5L49.5 44M40 49L48.5 51.5" fill="none" stroke-width="1.6"/>
<ellipse cx="28" cy="48.5" rx="5.5" ry="4.2" fill="${C.creamLight}" stroke="none"/><ellipse cx="36" cy="48.5" rx="5.5" ry="4.2" fill="${C.creamLight}" stroke="none"/>
<path d="M27.5 43.5C27.5 41 36.5 41 36.5 43.5C36.5 46 34 47.5 32 47.5C30 47.5 27.5 46 27.5 43.5Z" fill="${C.ink}" stroke="none"/><path d="M32 47.5V50" fill="none" stroke-width="1.6"/>
<path d="M11.5 27C11 15 20 8 32 8C44 8 53 15 52.5 27Z" fill="${C.white}"/>
<path d="M29.5 12H34.5V15.5H38V20.5H34.5V24H29.5V20.5H26V15.5H29.5Z" fill="${C.coral}" stroke="none"/>
</g>
<circle cx="23.5" cy="35" r="3.6" fill="${C.ink}"/><circle cx="40.5" cy="35" r="3.6" fill="${C.ink}"/>
<circle cx="22.4" cy="33.8" r="1.2" fill="${C.white}"/><circle cx="39.4" cy="33.8" r="1.2" fill="${C.white}"/>
</svg>
`;
}

// Banners -------------------------------------------------------------------------

function plus(x, y, s, color, opacity = 1) {
  const a = s / 2;
  const b = s / 6;
  return `<path d="M${x - b} ${y - a}H${x + b}V${y - b}H${x + a}V${y + b}H${x + b}V${y + a}H${x - b}V${y + b}H${x - a}V${y - b}H${x - b}Z" fill="${color}" fill-opacity="${opacity}"/>`;
}

function bannerSvg(dark) {
  const p = dark ? "banner-dark" : "banner";
  const bg = dark ? C.bgDark : C.bgLight;
  const text = dark ? C.textLight : C.textDark;
  const muted = dark ? C.mutedLight : C.mutedDark;
  const teal = dark ? C.tealLight : C.teal;
  const blob = dark ? "#10323A" : "#DDF3F0";
  const chipBg = dark ? "#123840" : C.white;
  const chipLine = dark ? "#1F5660" : "#BFE6E1";
  const chips = [["WCAG 2.2 rules", 452, 196, teal], ["Plain language", 662, 196, teal], ["Exact fixes", 872, 160, C.coral]];
  const chip = ([label, x, w, dot]) =>
    `<g transform="translate(${x} 284)"><rect width="${w}" height="44" rx="22" fill="${chipBg}" stroke="${chipLine}" stroke-width="2"/>` +
    `<circle cx="24" cy="22" r="6" fill="${dot}"/>` +
    `<text x="40" y="29" font-family="${SANS}" font-size="19" font-weight="600" fill="${text}">${label}</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 400" width="1280" height="400" role="img" aria-labelledby="${p}-title">
<title id="${p}-title">a11ymedic: Find accessibility problems. Get the exact fix.</title>
<defs>${patchGroupDefs(p, dark)}<clipPath id="${p}-frame"><rect width="1280" height="400" rx="24"/></clipPath></defs>
<g clip-path="url(#${p}-frame)">
<rect width="1280" height="400" fill="${bg}"/>
<circle cx="230" cy="214" r="168" fill="${blob}"/>
<circle cx="1220" cy="-10" r="150" fill="${blob}"/>
<path d="M452 362H1060L1076 334L1094 384L1114 306L1132 362H1280" fill="none" stroke="${teal}" stroke-opacity=".28" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
${plus(1128, 116, 30, C.coral, 0.9)}${plus(1222, 250, 18, teal, 0.7)}${plus(1176, 44, 16, teal, 0.6)}
<g transform="translate(46 20) scale(0.9)">${patchGroup(p, dark)}</g>
<text x="446" y="168" font-family="${SANS}" font-size="124" font-weight="700" letter-spacing="-3" fill="${text}">a11y<tspan fill="${teal}">medic</tspan></text>
<text x="452" y="236" font-family="${SANS}" font-size="36" font-weight="600" fill="${muted}">Find accessibility problems. <tspan fill="${dark ? C.coral : C.coralDark}">Get the exact fix.</tspan></text>
${chips.map(chip).join("")}
</g>
</svg>
`;
}

// Icons ---------------------------------------------------------------------------
// 24 x 24, stroke 2, round caps and joins. `k` holds the palette: ink for the main
// line, teal and coral for one accent each, bg for knockouts.

export const ICON_LIGHT = { ink: C.ink, teal: C.teal, coral: C.coralDark, bg: C.white };
export const ICON_DARK = { ink: C.textLight, teal: C.tealLight, coral: C.coral, bg: C.bgDark };

export const ICONS = {
  contrast: {
    about: "Color contrast: a circle split into a solid half and an open half",
    draw: (k) => `<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="${k.teal}" stroke="${k.teal}"/><circle cx="12" cy="12" r="9"/>`,
  },
  "image-alt": {
    about: "Image alt text: a picture frame with a sun and hills plus a text label tag",
    draw: (k) => `<path d="M14 16.5H4.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v6"/><circle cx="7.5" cy="7.5" r="1.5" fill="${k.coral}" stroke="${k.coral}"/><path d="m2.5 13.5 4.5-4 3.5 3 2-1.5"/><rect x="13.5" y="14" width="8" height="6.5" rx="1.5" stroke="${k.teal}"/><path d="M16 17.3h3" stroke="${k.teal}"/>`,
  },
  "form-label": {
    about: "Form label: a label line sitting above a text field with a cursor",
    draw: (k) => `<path d="M4 5.5h8" stroke="${k.teal}"/><rect x="3" y="10" width="18" height="9" rx="2"/><path d="M7.5 12.5v4" stroke="${k.coral}"/>`,
  },
  "keyboard-focus": {
    about: "Keyboard focus: a key with a tab arrow wrapped in a visible focus ring",
    draw: (k) => `<rect x="2" y="4.5" width="20" height="15" rx="4.5" stroke="${k.teal}"/><rect x="6" y="8.5" width="12" height="7" rx="2"/><path d="M9.5 12h4.5M12.5 10.5 14 12l-1.5 1.5" stroke="${k.coral}"/>`,
  },
  aria: {
    about: "ARIA: angle brackets around an equals sign, for roles and attributes",
    draw: (k) => `<path d="m7.5 6.5-5 5.5 5 5.5M16.5 6.5l5 5.5-5 5.5"/><path d="M10 10h4" stroke="${k.teal}"/><path d="M10 14h4" stroke="${k.coral}"/>`,
  },
  headings: {
    about: "Headings: a letter H next to three steps of a heading outline",
    draw: (k) => `<path d="M3.5 5v14M11.5 5v14M3.5 12h8"/><path d="M15.5 7h5" stroke="${k.teal}"/><path d="M17 12h3.5M18.5 17h2" stroke="${k.coral}"/>`,
  },
  landmarks: {
    about: "Landmarks: a page layout split into header, navigation and main regions",
    draw: (k) => `<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 8.5h18" stroke="${k.teal}"/><path d="M9 8.5V21"/><path d="M12.5 13h5M12.5 16.5h3" stroke="${k.coral}"/>`,
  },
  "target-size": {
    about: "Target size: a tap target with a touch point and width and height arrows",
    draw: (k) => `<rect x="3" y="3" width="13" height="13" rx="3"/><circle cx="9.5" cy="9.5" r="2" fill="${k.coral}" stroke="${k.coral}"/><path d="M3 20.5h13M5 18.5 3 20.5l2 2M14 18.5l2 2-2 2M20.5 3v13M18.5 5l2-2 2 2M18.5 14l2 2 2-2" stroke="${k.teal}"/>`,
  },
  motion: {
    about: "Motion: a moving ball with speed lines, for animation and reduced motion",
    draw: (k) => `<circle cx="15.5" cy="12" r="5.5"/><path d="M2.5 9h6M4.5 12h4M2.5 15h6" stroke="${k.teal}"/><path d="M13.5 9.5a3 3 0 0 1 3-.5" stroke="${k.coral}"/>`,
  },
  media: {
    about: "Media: a video frame with a play button and caption lines",
    draw: (k) => `<rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="M10 7.5v5l4.5-2.5Z" fill="${k.coral}" stroke="${k.coral}"/><path d="M6.5 16.5h4M13 16.5h4.5" stroke="${k.teal}"/>`,
  },
  table: {
    about: "Table: a data grid with a highlighted header row and header column",
    draw: (k) => `<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18" stroke="${k.teal}"/><path d="M9 9v11" stroke="${k.coral}"/><path d="M9 14.5h12M15 9v11"/>`,
  },
  language: {
    about: "Language: a globe with meridians, for the page language attribute",
    draw: (k) => `<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17" stroke="${k.teal}"/><path d="M12 3c-3.2 3.4-3.2 14.6 0 18M12 3c3.2 3.4 3.2 14.6 0 18"/>`,
  },
  fix: {
    about: "Fix: a diagonal bandage with a padded center",
    draw: (k) => `<rect x="1.5" y="8" width="21" height="8" rx="4" transform="rotate(-45 12 12)"/><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(-45 12 12)" fill="${k.coral}" fill-opacity=".25" stroke="${k.coral}"/><path d="M6.2 15.2h.01M8.8 17.8h.01M15.2 6.2h.01M17.8 8.8h.01" stroke="${k.teal}" stroke-width="2.2"/>`,
  },
  report: {
    about: "Report: a medical clipboard with a check mark and a result line",
    draw: (k) => `<rect x="4.5" y="4" width="15" height="17.5" rx="2.5"/><rect x="8.5" y="2.5" width="7" height="3.5" rx="1.2" fill="${k.bg}"/><path d="m8.5 12 2.2 2.2 4.8-4.7" stroke="${k.teal}"/><path d="M8.5 17.5h7" stroke="${k.coral}"/>`,
  },
  ci: {
    about: "CI: two circular arrows around a check mark, for checks in a pipeline",
    draw: (k) => `<path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18 3v4h-4M6 21v-4h4" stroke="${k.coral}"/><path d="m8.8 12 2.2 2.2 4.2-4.2" stroke="${k.teal}"/>`,
  },
  "overlay-pin": {
    about: "Overlay pin: a numbered map pin, like the markers the browser overlay drops on a page",
    draw: (k) => `<path d="M12 21.5s-7.5-6.3-7.5-12a7.5 7.5 0 0 1 15 0c0 5.7-7.5 12-7.5 12Z" fill="${k.coral}" stroke="${k.coral}"/><path d="M12 21.5s-7.5-6.3-7.5-12a7.5 7.5 0 0 1 15 0c0 5.7-7.5 12-7.5 12Z"/><path d="M10.5 7.2 12.5 6v7.5M10.5 13.5h4" stroke="${k.bg}" stroke-width="1.8"/>`,
  },
  cli: {
    about: "CLI: a terminal window with a prompt chevron and a cursor line",
    draw: (k) => `<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m6.5 9.5 3 2.5-3 2.5" stroke="${k.teal}"/><path d="M12 15h5" stroke="${k.coral}"/>`,
  },
  stethoscope: {
    about: "Stethoscope: ear tips, a tube and a chest piece, for the diagnosis step",
    draw: (k) => `<path d="M5 2.5h-1v6a5 5 0 0 0 10 0v-6h-1"/><path d="M9 13.5v1.5a5.5 5.5 0 0 0 11 0v-3.5"/><circle cx="20" cy="9.5" r="2" fill="${k.coral}" fill-opacity=".25" stroke="${k.teal}"/>`,
  },
};

function iconSvg(name, k) {
  const { about, draw } = ICONS[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-labelledby="${name}-title">
<title id="${name}-title">${about.split(":")[0]}</title>
<g fill="none" stroke="${k.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${draw(k)}</g>
</svg>
`;
}

// Write ---------------------------------------------------------------------------

function write(rel, content) {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export function buildAll() {
  write("assets/mascot.svg", mascotSvg(false));
  write("assets/mascot-dark.svg", mascotSvg(true));
  write("assets/mascot-head.svg", headSvg());
  write("assets/favicon.svg", faviconSvg());
  write("docs/favicon.svg", faviconSvg());
  write("assets/banner.svg", bannerSvg(false));
  write("assets/banner-dark.svg", bannerSvg(true));
  for (const name of Object.keys(ICONS)) {
    write(`assets/icons/light/${name}.svg`, iconSvg(name, ICON_LIGHT));
    write(`assets/icons/dark/${name}.svg`, iconSvg(name, ICON_DARK));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  buildAll();
  console.log(`wrote mascot, head, favicon, banners and ${Object.keys(ICONS).length * 2} icons`);
}
