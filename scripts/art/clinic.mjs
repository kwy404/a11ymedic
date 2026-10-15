// The a11ymedic clinic art: the hero scene (Patch in his clinic room with a sick browser
// window on the stretcher), 5 spot illustrations, the duotone icon family, the "discharged"
// stamp and the README banner. Everything is hand written SVG.
//
// Every drawing takes a palette `k`. Three palettes exist for each family: LIGHT and DARK
// hold fixed colors and produce the files in docs/assets/art/ (for the README and anyone who
// wants the art), and VAR holds CSS custom properties so the docs site can inline the same
// drawing and let the theme toggle recolor it. `themeable()` moves var() colors from
// presentation attributes into style attributes, where var() is allowed.
//
//   node scripts/art/clinic.mjs        writes docs/assets/art/
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { patchGroup, patchGroupDefs } from "./build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ROUND = 'stroke-linecap="round" stroke-linejoin="round"';
const DISPLAY = "Fredoka, 'Arial Rounded MT Bold', 'Trebuchet MS', 'Segoe UI', sans-serif";
const MONO = "'Atkinson Hyperlegible Mono', Consolas, Menlo, monospace";

// ------------------------------------------------------------------------- palettes

/** Scene and spot palette. */
export const ART = {
  light: {
    ink: "#1d3a40",
    paper: "#fffdf7",
    wall: "#f6ead3",
    wallDeep: "#ecd8b5",
    wallLine: "#dfc59c",
    floor: "#d9bf98",
    floorDeep: "#c8a87c",
    teal: "#0f8b8d",
    tealSoft: "#7fd3c8",
    tealPale: "#d3f0ea",
    coral: "#ff7a66",
    coralSoft: "#ffb3a5",
    coralPale: "#ffe3dc",
    yellow: "#f7c65a",
    sky: "#cdeef3",
    moon: "#fff1c2",
    glass: "#e8f7f8",
    metal: "#c4d6d4",
    metalDark: "#86a3a4",
    blob: "#f3e3c6",
    screen: "#163c43",
    trace: "#7cf2dc",
    shadow: "#1d3a40",
    rim: "#fffdf7",
    plaster: "#f9c89e",
    pad: "#eda27a",
  },
  dark: {
    ink: "#071417",
    paper: "#e6dcc7",
    wall: "#1f454c",
    wallDeep: "#193a41",
    wallLine: "#173840",
    floor: "#132c31",
    floorDeep: "#0e2226",
    teal: "#22a6a3",
    tealSoft: "#3f9c95",
    tealPale: "#2a5d61",
    coral: "#f0806d",
    coralSoft: "#cf7464",
    coralPale: "#6b4440",
    yellow: "#e3b552",
    sky: "#0c2135",
    moon: "#f6e9b8",
    glass: "#3d6d73",
    metal: "#7c9a9b",
    metalDark: "#55716f",
    blob: "#183b41",
    screen: "#08191c",
    trace: "#6ff5dd",
    shadow: "#000000",
    rim: "#d8ecea",
    plaster: "#e3b48c",
    pad: "#c9896a",
  },
};
ART.var = Object.fromEntries(Object.keys(ART.light).map((key) => [key, `var(--a-${key})`]));

/** Icon palette: rounded 2px ink strokes with a teal and a coral duotone fill. */
export const ICON = {
  light: { ink: "#1d3a40", teal: "#7fd3c8", coral: "#ffa494", paper: "#fffdf7" },
  dark: { ink: "#f2e8d5", teal: "#1f8a86", coral: "#c25a49", paper: "#102a2f" },
};
ICON.var = { ink: "var(--ic-ink)", teal: "var(--ic-teal)", coral: "var(--ic-coral)", paper: "var(--ic-paper)" };

/** CSS custom properties for the inline art, for site.css (light, dark). */
export function artCss() {
  const block = (pal, icon) =>
    Object.entries(pal)
      .map(([key, v]) => `--a-${key}: ${v};`)
      .concat(Object.entries(icon).map(([key, v]) => `--ic-${key}: ${v};`))
      .join(" ");
  return { light: block(ART.light, ICON.light), dark: block(ART.dark, ICON.dark) };
}

/** Moves var() colors out of presentation attributes into a style attribute. */
export function themeable(svg) {
  return svg.replace(/<([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)(\s*\/?)>/g, (tag, name, attrs, end) => {
    if (!attrs.includes("var(")) return tag;
    const styles = [];
    const rest = attrs.replace(/\s+(fill|stroke|stop-color|flood-color|color)="(var\([^"]+\))"/g, (_, prop, value) => {
      styles.push(`${prop}:${value}`);
      return "";
    });
    if (!styles.length) return tag;
    const merged = rest.match(/\sstyle="([^"]*)"/);
    if (merged) return `<${name}${rest.replace(merged[0], ` style="${merged[1]};${styles.join(";")}"`)}${end}>`;
    return `<${name}${rest} style="${styles.join(";")}"${end}>`;
  });
}

// ------------------------------------------------------------------------- icons
// 24 x 24 grid. The outline is drawn last by the caller's group: `fill` shapes paint
// first, so draw fills before the strokes that sit on them.

const F = (color) => `fill="${color}"`;

export const ICONS = {
  // Rule categories -----------------------------------------------------------------
  contrast: {
    label: "Color contrast",
    group: "category",
    draw: (k) => `<path d="M12 3a9 9 0 0 0 0 18Z" ${F(k.teal)}/><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" stroke-width="2"/><circle cx="12" cy="12" r="2.2" ${F(k.coral)}/>`,
  },
  names: {
    label: "Accessible names",
    group: "category",
    draw: (k) => `<path d="M3 9.5V7a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 7v2.5Z" ${F(k.teal)}/><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9.5h18"/><path d="M7 13.5h10M7 16.5h6"/><circle cx="17.5" cy="16.5" r="1.3" ${F(k.coral)}/>`,
  },
  forms: {
    label: "Forms and labels",
    group: "category",
    draw: (k) => `<path d="M3.5 6.5h8"/><rect x="3" y="10.5" width="18" height="8.5" rx="2.5" ${F(k.teal)}/><path d="M7.5 12.8v4"/><circle cx="18.5" cy="6" r="2.5" ${F(k.coral)}/>`,
  },
  images: {
    label: "Images and alt text",
    group: "category",
    draw: (k) => `<path d="M3 16.5 8 11l4 4 3-3 6 6v.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" ${F(k.teal)}/><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 16.5 8 11l4 4 3-3 6 6"/><circle cx="16" cy="8.5" r="2" ${F(k.coral)}/>`,
  },
  keyboard: {
    label: "Keyboard and focus",
    group: "category",
    draw: (k) => `<rect x="2.5" y="6" width="19" height="12.5" rx="3"/><rect x="15" y="8.8" width="3.6" height="2.8" rx="0.9" ${F(k.teal)}/><rect x="7" y="14" width="10" height="2" rx="1" ${F(k.coral)}/><path d="M6 10.2h.01M9 10.2h.01M12 10.2h.01"/>`,
  },
  motion: {
    label: "Motion and timing",
    group: "category",
    draw: (k) => `<circle cx="15" cy="12" r="6" ${F(k.teal)}/><path d="M2.5 9h4.5M4 12h3M2.5 15h4.5"/><path d="M13.5 10v4M16.5 10v4"/><circle cx="20.5" cy="4.5" r="1.3" ${F(k.coral)}/>`,
  },
  structure: {
    label: "Page structure",
    group: "category",
    draw: (k) => `<rect x="4" y="3" width="16" height="18" rx="2.5"/><rect x="7" y="6" width="10" height="3.2" rx="1" ${F(k.teal)}/><path d="M7 12.5h10M7 15.5h6"/><rect x="7" y="17.5" width="3.5" height="1.2" rx="0.6" ${F(k.coral)}/>`,
  },
  language: {
    label: "Page language",
    group: "category",
    draw: (k) => `<path d="M3 5.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8.5L5 15v-2.5a2 2 0 0 1-2-2Z" ${F(k.teal)}/><path d="M11 12.5v1a2 2 0 0 0 2 2h4.5L21 18v-2.6a2 2 0 0 0 0-.4v-4a2 2 0 0 0-2-2h-2" ${F(k.coral)}/><path d="M6.5 9.5 9 5l2.5 4.5M7.3 8h3.4"/>`,
  },
  media: {
    label: "Audio and video",
    group: "category",
    draw: (k) => `<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M10 7.8v5l4.3-2.5Z" ${F(k.coral)}/><rect x="6" y="15.3" width="12" height="2" rx="1" ${F(k.teal)}/>`,
  },
  tables: {
    label: "Data tables",
    group: "category",
    draw: (k) => `<path d="M3 9V6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5V9Z" ${F(k.teal)}/><path d="M3 9h6v11H5.5A2.5 2.5 0 0 1 3 17.5Z" ${F(k.coral)}/><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M9 9v11M15 9v11M3 14.5h18"/>`,
  },
  aria: {
    label: "ARIA roles and attributes",
    group: "category",
    draw: (k) => `<path d="m7.5 6.5-5 5.5 5 5.5M16.5 6.5l5 5.5-5 5.5"/><path d="M9.8 9.6 12 7.4h2.6v2.6l-2.2 2.2a1.8 1.8 0 0 1-2.6 0 1.8 1.8 0 0 1 0-2.6Z" ${F(k.teal)}/><circle cx="13.3" cy="8.8" r="0.6" ${F(k.ink)}/><path d="M10 16.5h4" stroke-width="2"/><circle cx="12" cy="16.5" r="1.2" ${F(k.coral)}/>`,
  },
  zoom: {
    label: "Zoom and touch targets",
    group: "category",
    draw: (k) => `<circle cx="10.5" cy="10.5" r="6.5" ${F(k.teal)}/><path d="m15.5 15.5 5 5" stroke-width="3"/><path d="M8 10.5h5M10.5 8v5"/><path d="m19.2 19.2 1.3 1.3" stroke="${k.coral}" stroke-width="2.6"/>`,
  },
  // People ------------------------------------------------------------------------
  "screen-reader": {
    label: "Screen reader users",
    group: "people",
    draw: (k) => `<path d="M3.5 9.5h3l4.5-4v13l-4.5-4h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" ${F(k.teal)}/><path d="M14.5 9.3a4 4 0 0 1 0 5.4" stroke="${k.ink}"/><path d="M17.3 6.6a8 8 0 0 1 0 10.8" stroke="${k.ink}"/><circle cx="20.5" cy="4.5" r="1.3" ${F(k.coral)}/>`,
  },
  "low-vision": {
    label: "Low vision",
    group: "people",
    draw: (k) => `<circle cx="6.8" cy="13.5" r="4" ${F(k.teal)}/><circle cx="17.2" cy="13.5" r="4" ${F(k.teal)}/><path d="M10.8 13a2.2 2.2 0 0 1 2.4 0M2.8 13 2 8.5M21.2 13 22 8.5"/><path d="M5 12a2.2 2.2 0 0 1 2-1.6" stroke="${k.paper}" stroke-width="1.5"/><circle cx="12" cy="5" r="1.4" ${F(k.coral)}/>`,
  },
  "color-blind": {
    label: "Color blindness",
    group: "people",
    draw: (k) => `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><path d="M12 8.5a3.5 3.5 0 0 0 0 7Z" ${F(k.teal)}/><path d="M12 8.5a3.5 3.5 0 0 1 0 7Z" ${F(k.coral)}/><circle cx="12" cy="12" r="3.5"/>`,
  },
  "keyboard-only": {
    label: "Keyboard only",
    group: "people",
    draw: (k) => `<rect x="2.5" y="7" width="19" height="10" rx="3" ${F(k.teal)}/><path d="M6.5 12h8M11.5 9l3 3-3 3"/><path d="M17.5 9v6" stroke="${k.ink}"/><circle cx="12" cy="20.5" r="1.2" ${F(k.coral)}/>`,
  },
  cognitive: {
    label: "Cognitive and learning",
    group: "people",
    draw: (k) => `<path d="M9 21v-3.2A7.5 7.5 0 1 1 19 11l1.6 3.4h-2v2.4a2 2 0 0 1-2 2h-2V21" ${F(k.teal)}/><path d="M11.5 7.5a2.5 2.5 0 1 1 2.5 2.5v1.5" stroke="${k.ink}"/><circle cx="14" cy="14" r="1.2" ${F(k.coral)}/>`,
  },
  motor: {
    label: "Motor and dexterity",
    group: "people",
    draw: (k) => `<path d="M8.5 13V5.5a1.5 1.5 0 0 1 3 0V11 9.5a1.5 1.5 0 0 1 3 0V11a1.5 1.5 0 0 1 3 0v3.5a6.5 6.5 0 0 1-6.5 6.5h-.5a5.5 5.5 0 0 1-4.6-2.5L3.7 15a1.6 1.6 0 0 1 2.5-2l2.3 2.3" ${F(k.teal)}/><path d="m19.5 5.5 1.6-1.2M20 8.6h1.9M16.6 3.4l.6-1.6" stroke="${k.coral}" stroke-width="2"/>`,
  },
  deaf: {
    label: "Deaf and hard of hearing",
    group: "people",
    draw: (k) => `<path d="M7.5 9.5a5.5 5.5 0 0 1 11 0c0 3.2-2.6 4.3-3.2 7a3.2 3.2 0 0 1-5.8 1.2" ${F(k.teal)}/><path d="M10.5 10a2.5 2.5 0 0 1 5 0c0 1.2-1.2 1.8-1.7 2.8"/><rect x="2" y="15" width="7.5" height="5" rx="1.4" ${F(k.coral)}/><path d="M4 17.5h3.5"/>`,
  },
  // Principles ----------------------------------------------------------------------
  eye: {
    label: "Perceivable",
    group: "principle",
    draw: (k) => `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" ${F(k.teal)}/><circle cx="12" cy="12" r="3.5" ${F(k.paper)}/><circle cx="12" cy="12" r="1.5" ${F(k.coral)}/>`,
  },
  hand: {
    label: "Operable",
    group: "principle",
    draw: (k) => `<path d="M7 12V6a1.5 1.5 0 0 1 3 0v5V4.5a1.5 1.5 0 0 1 3 0V11 5.5a1.5 1.5 0 0 1 3 0V12 8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7l-2.3-3.5a1.5 1.5 0 0 1 2.4-1.8L7 15" ${F(k.teal)}/><circle cx="4" cy="5" r="1.3" ${F(k.coral)}/>`,
  },
  lightbulb: {
    label: "Understandable",
    group: "principle",
    draw: (k) => `<path d="M9 17.5v-1.8c0-1-.6-1.8-1.4-2.6a6 6 0 1 1 8.8 0c-.8.8-1.4 1.6-1.4 2.6v1.8Z" ${F(k.yellow ?? k.coral)}/><path d="M9.5 20.5h5"/><path d="M12 13v-3l-1.5-1.5M12 10l1.5-1.5"/><circle cx="19.5" cy="3.8" r="1.2" ${F(k.teal)}/>`,
  },
  blocks: {
    label: "Robust",
    group: "principle",
    draw: (k) => `<rect x="3" y="12" width="8" height="8" rx="1.8" ${F(k.teal)}/><rect x="13" y="12" width="8" height="8" rx="1.8" ${F(k.coral)}/><rect x="8" y="3.5" width="8" height="8" rx="1.8" ${F(k.teal)}/>`,
  },
  // Clinic --------------------------------------------------------------------------
  stethoscope: {
    label: "Stethoscope",
    group: "clinic",
    draw: (k) => `<path d="M5.5 3H4.5v5.5a5 5 0 0 0 10 0V3h-1"/><path d="M9.5 13.5v1.8a5 5 0 0 0 10 0V13"/><circle cx="19.5" cy="10.5" r="2.6" ${F(k.teal)}/><circle cx="9.5" cy="13.5" r="1.4" ${F(k.coral)}/>`,
  },
  chart: {
    label: "Medical chart",
    group: "clinic",
    draw: (k) => `<rect x="4.5" y="4" width="15" height="17.5" rx="2.5" ${F(k.paper)}/><rect x="8.5" y="2.5" width="7" height="3.5" rx="1.2" ${F(k.teal)}/><path d="M7.5 13h2.2l1.3-2.5 2 5 1.3-2.5h2.2" stroke="${k.ink}"/><circle cx="16.5" cy="17.8" r="1.2" ${F(k.coral)}/>`,
  },
  pill: {
    label: "Pill",
    group: "clinic",
    draw: (k) => `<g transform="rotate(-45 12 12)"><path d="M12 7.5H8a4.5 4.5 0 0 0 0 9h4Z" ${F(k.coral)}/><path d="M12 7.5h4a4.5 4.5 0 0 1 0 9h-4Z" ${F(k.teal)}/><rect x="3.5" y="7.5" width="17" height="9" rx="4.5"/><path d="M12 7.5v9"/></g>`,
  },
  bandage: {
    label: "Bandage",
    group: "clinic",
    draw: (k) => `<g transform="rotate(-45 12 12)"><rect x="1.5" y="8" width="21" height="8" rx="4" ${F(k.coral)}/><rect x="8.5" y="8" width="7" height="8" ${F(k.teal)}/><rect x="1.5" y="8" width="21" height="8" rx="4"/><path d="M8.5 8v8M15.5 8v8"/></g><path d="M11 11h.01M13 13h.01M13 11h.01M11 13h.01" stroke-width="1.6"/>`,
  },
  ambulance: {
    label: "Ambulance",
    group: "clinic",
    draw: (k) => `<path d="M2.5 16.5V8a1.5 1.5 0 0 1 1.5-1.5h10v10Z" ${F(k.paper)}/><path d="M14 9.5h3.6l3.4 3.6v3.4h-7Z" ${F(k.teal)}/><path d="M2.5 16.5V8a1.5 1.5 0 0 1 1.5-1.5h10v10M14 9.5h3.6l3.4 3.6v3.4H2.5"/><path d="M6.8 11.5h3.4M8.5 9.8v3.4" stroke="${k.coral}" stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="1.9" ${F(k.paper)}/><circle cx="17" cy="17.5" r="1.9" ${F(k.paper)}/>`,
  },
  report: {
    label: "Report",
    group: "clinic",
    draw: (k) => `<path d="M6 2.5h8.5l4.5 4.5v12.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Z" ${F(k.paper)}/><path d="M14.5 2.5V7H19" ${F(k.teal)}/><path d="M7.5 11h7M7.5 14h5"/><path d="m11.5 18 1.6 1.5 3.2-3.3" stroke="${k.ink}"/><circle cx="8" cy="18" r="1.2" ${F(k.coral)}/>`,
  },
  thermometer: {
    label: "Thermometer",
    group: "clinic",
    draw: (k) => `<path d="M10 14.2V4.5a2 2 0 0 1 4 0v9.7a4 4 0 1 1-4 0Z" ${F(k.paper)}/><circle cx="12" cy="17.5" r="2" ${F(k.coral)}/><path d="M12 15.5V9" stroke="${k.coral}" stroke-width="2"/><path d="M16.5 6h2M16.5 9h1.5M16.5 12h2" /><path d="M10 14.2V4.5a2 2 0 0 1 4 0v9.7a4 4 0 1 1-4 0Z"/><circle cx="19.6" cy="17.4" r="1.2" ${F(k.teal)}/>`,
  },
  "heart-pulse": {
    label: "Heart rate",
    group: "clinic",
    draw: (k) => `<path d="M12 20s-8-4.8-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.2 12 20 12 20Z" ${F(k.coral)}/><path d="M2 12.5h5l1.5-2.5 2.5 5 2-3.5 1 1h8" stroke="${k.ink}"/>`,
  },
  "first-aid": {
    label: "First aid kit",
    group: "clinic",
    draw: (k) => `<path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5"/><rect x="2.5" y="6.5" width="19" height="14" rx="3" ${F(k.coral)}/><path d="M10.5 10.5h3v2h2v3h-2v2h-3v-2h-2v-3h2Z" ${F(k.paper)} stroke-width="1.6"/><path d="M2.5 10h3M18.5 10h3" stroke="${k.ink}"/>`,
  },
  prescription: {
    label: "Prescription",
    group: "clinic",
    draw: (k) => `<rect x="4" y="2.5" width="16" height="19" rx="2.5" ${F(k.paper)}/><path d="M4 7.5V5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 5v2.5Z" ${F(k.teal)}/><path d="M8 17.5v-6h2.5a1.8 1.8 0 0 1 0 3.6H8m2.4 0 3.6 3.6m0-3.4-3 3" stroke="${k.ink}"/><circle cx="16.5" cy="12" r="1.2" ${F(k.coral)}/>`,
  },
  "clipboard-check": {
    label: "Checklist",
    group: "clinic",
    draw: (k) => `<rect x="4.5" y="4" width="15" height="17.5" rx="2.5" ${F(k.paper)}/><rect x="8.5" y="2.5" width="7" height="3.5" rx="1.2" ${F(k.coral)}/><rect x="7.5" y="9" width="3.5" height="3.5" rx="1" ${F(k.teal)}/><rect x="7.5" y="15" width="3.5" height="3.5" rx="1" ${F(k.teal)}/><path d="M13.5 10.8h3M13.5 16.8h3"/>`,
  },
  magnifier: {
    label: "Search",
    group: "clinic",
    draw: (k) => `<circle cx="10.5" cy="10.5" r="6.5" ${F(k.teal)}/><path d="M7.6 8.6a3.4 3.4 0 0 1 2.8-1.8" stroke="${k.paper}" stroke-width="1.6"/><path d="m15.5 15.5 2 2"/><path d="m17.3 17.3 3 3" stroke="${k.coral}" stroke-width="3.4"/><path d="m17.3 17.3 3 3"/>`,
  },
  stamp: {
    label: "Stamp",
    group: "clinic",
    draw: (k) => `<path d="M9.5 10.5V9a2.5 2.5 0 1 1 5 0v1.5l1 3h-7Z" ${F(k.coral)}/><rect x="3.5" y="13.5" width="17" height="4" rx="1.5" ${F(k.teal)}/><path d="M5 21h14"/>`,
  },
  terminal: {
    label: "Command line",
    group: "clinic",
    draw: (k) => `<path d="M2.5 8V6.5A2.5 2.5 0 0 1 5 4h14a2.5 2.5 0 0 1 2.5 2.5V8Z" ${F(k.teal)}/><rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 8h19"/><path d="m6.5 11.5 2.5 2-2.5 2"/><path d="M11.5 16h5" stroke="${k.ink}"/><circle cx="17.8" cy="16" r="1.1" ${F(k.coral)}/>`,
  },
  pipeline: {
    label: "Continuous integration",
    group: "clinic",
    draw: (k) => `<rect x="2.5" y="8.5" width="7" height="7" rx="2" ${F(k.teal)}/><circle cx="17.5" cy="12" r="4" ${F(k.coral)}/><path d="M9.5 12h4M11.5 9.8l2.2 2.2-2.2 2.2"/><path d="m15.8 12.1 1.2 1.2 2.2-2.4" stroke-width="1.6"/><path d="M6 5.5V8.5M6 15.5v3" stroke-width="1.6"/>`,
  },
  "test-tube": {
    label: "Tests",
    group: "clinic",
    draw: (k) => `<path d="M9.5 3v13a2.5 2.5 0 0 0 5 0V3" ${F(k.paper)}/><path d="M9.5 11.5h5V16a2.5 2.5 0 0 1-5 0Z" ${F(k.teal)}/><path d="M8 3h8M9.5 3v13a2.5 2.5 0 0 0 5 0V3"/><circle cx="18" cy="8" r="1.6" ${F(k.coral)}/><circle cx="5.5" cy="13" r="1.1" ${F(k.coral)}/>`,
  },
  pin: {
    label: "Overlay pin",
    group: "clinic",
    draw: (k) => `<path d="M12 21.5s-7-6-7-11.5a7 7 0 0 1 14 0c0 5.5-7 11.5-7 11.5Z" ${F(k.coral)}/><circle cx="12" cy="10" r="3" ${F(k.paper)}/><path d="M11 9.2 12.3 8.5v3.2" stroke-width="1.5"/>`,
  },
  target: {
    label: "Target size",
    group: "clinic",
    draw: (k) => `<rect x="3.5" y="3.5" width="13" height="13" rx="3.5" ${F(k.teal)}/><circle cx="10" cy="10" r="2.2" ${F(k.coral)}/><path d="M3.5 20.5h13M20.5 3.5v13"/><path d="M5 19l-1.5 1.5L5 22M15 19l1.5 1.5L15 22M19 5l1.5-1.5L22 5M19 15l1.5 1.5L22 15" stroke-width="1.5"/>`,
  },
  link: {
    label: "Link",
    group: "clinic",
    draw: (k) => `<rect x="2.5" y="8.5" width="10" height="7" rx="3.5" ${F(k.teal)} transform="rotate(-30 7.5 12)"/><rect x="11.5" y="8.5" width="10" height="7" rx="3.5" ${F(k.coral)} transform="rotate(-30 16.5 12)"/><path d="M9.5 14.5 14.5 9.5" stroke-width="2.2"/>`,
  },
  timer: {
    label: "Timing",
    group: "clinic",
    draw: (k) => `<circle cx="12" cy="13.5" r="7.5" ${F(k.teal)}/><path d="M12 13.5V9.5M12 13.5l2.5 1.5" stroke="${k.ink}"/><path d="M10 2.5h4M12 2.5V6"/><path d="m18.5 6 1.5-1.5" stroke="${k.coral}" stroke-width="2.4"/><circle cx="12" cy="13.5" r="7.5"/>`,
  },
  book: {
    label: "Guides",
    group: "clinic",
    draw: (k) => `<path d="M12 6.5C10 5 7 4.5 3 4.5v14c4 0 7 .5 9 2Z" ${F(k.teal)}/><path d="M12 6.5c2-1.5 5-2 9-2v14c-4 0-7 .5-9 2Z" ${F(k.paper)}/><path d="M12 6.5v14"/><path d="M15 9.5h3M15 12.5h3" stroke="${k.ink}"/><path d="M6 3v4.5l1.3-1 1.3 1V3.8" ${F(k.coral)} stroke-width="1.5"/>`,
  },
  cabinet: {
    label: "Medicine cabinet",
    group: "clinic",
    draw: (k) => `<rect x="3.5" y="3" width="17" height="18" rx="2.5" ${F(k.paper)}/><rect x="3.5" y="3" width="17" height="6" rx="2.5" ${F(k.teal)}/><path d="M3.5 9h17M3.5 15h17"/><path d="M10.5 12h3M10.5 18h3" stroke-width="2.2"/><path d="M11 6h2M12 5v2" stroke="${k.coral}" stroke-width="2.2"/>`,
  },
  sparkle: {
    label: "Healed",
    group: "clinic",
    draw: (k) => `<path d="M10 3.5c.6 4 2.5 5.9 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.6 5.9-2.5 6.5-6.5Z" ${F(k.teal)}/><path d="M18 14c.3 2 1.2 2.9 3.2 3.2-2 .3-2.9 1.2-3.2 3.2-.3-2-1.2-2.9-3.2-3.2 2-.3 2.9-1.2 3.2-3.2Z" ${F(k.coral)}/>`,
  },
  headings: {
    label: "Headings",
    group: "clinic",
    draw: (k) => `<path d="M3.5 5v14M11.5 5v14M3.5 12h8"/><rect x="14.5" y="5.5" width="7" height="3" rx="1.2" ${F(k.teal)}/><rect x="15.8" y="10.5" width="5.7" height="3" rx="1.2" ${F(k.coral)}/><path d="M17 17.5h4.5"/>`,
  },
  landmark: {
    label: "Landmarks",
    group: "clinic",
    draw: (k) => `<path d="M11 21V3.5"/><path d="M11 5h8l2 2.5-2 2.5h-8Z" ${F(k.teal)}/><path d="M11 12H5l-2 2.5L5 17h6Z" ${F(k.coral)}/><path d="M8 21h6"/>`,
  },
  copy: {
    label: "Copy",
    group: "interface",
    draw: (k) => `<rect x="8" y="8" width="12.5" height="12.5" rx="2.5" ${F(k.teal)}/><path d="M16 8V6a2.5 2.5 0 0 0-2.5-2.5h-7A2.5 2.5 0 0 0 4 6v7a2.5 2.5 0 0 0 2.5 2.5H8"/>`,
  },
  sun: {
    label: "Light theme",
    group: "interface",
    draw: (k) => `<circle cx="12" cy="12" r="4.5" ${F(k.yellow ?? k.coral)}/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>`,
  },
  moon: {
    label: "Dark theme",
    group: "interface",
    draw: (k) => `<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" ${F(k.teal)}/><circle cx="17.5" cy="5" r="1.1" ${F(k.coral)}/>`,
  },
  system: {
    label: "System theme",
    group: "interface",
    draw: (k) => `<path d="M3 6a2 2 0 0 1 2-2h7v12.5H5a2 2 0 0 1-2-2Z" ${F(k.teal)}/><rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>`,
  },
};

// Some icons use a yellow fill; give the icon palettes a yellow so they stay duotone plus one.
ICON.light.yellow = "#f7c65a";
ICON.dark.yellow = "#c79a3a";
ICON.var.yellow = "var(--ic-yellow)";

function iconBody(name, k) {
  return `<g fill="none" stroke="${k.ink}" stroke-width="2" ${ROUND}>${ICONS[name].draw(k)}</g>`;
}

export function iconFile(name, mode) {
  const k = ICON[mode];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-labelledby="t">
<title id="t">${ICONS[name].label}</title>
${iconBody(name, k)}
</svg>
`;
}

/** One sprite with every icon as a <symbol>, colored by --ic-* custom properties. */
export function iconSprite() {
  const fallback = ICON.light;
  const k = Object.fromEntries(Object.entries(ICON.var).map(([key, v]) => [key, v.replace(")", `, ${fallback[key]})`)]));
  const symbols = Object.keys(ICONS)
    .map((name) => `<symbol id="${name}" viewBox="0 0 24 24">${themeable(iconBody(name, k))}</symbol>`)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`;
}

/** Markup for an icon on the site: <svg><use href="assets/art/icons.svg#name"></svg>. */
export function icon(name, cls = "ic", label = "") {
  if (!ICONS[name]) throw new Error(`unknown icon ${name}`);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="${cls}" viewBox="0 0 24 24" ${a11y} focusable="false"><use href="assets/art/icons.svg#${name}"/></svg>`;
}

// ------------------------------------------------------------------------- helpers

const plusShape = (x, y, s, fill, k, extra = "") => {
  const a = s / 2;
  const b = s / 5.5;
  return `<path d="M${x - b} ${y - a}h${2 * b}v${a - b}h${a - b}v${2 * b}h${b - a}v${a - b}h${-2 * b}v${b - a}h${b - a}v${-2 * b}h${a - b}Z" fill="${fill}" stroke="${k.ink}" stroke-width="3" ${ROUND} ${extra}/>`;
};

const sparkleShape = (x, y, s, fill, k, cls = "") =>
  `<path class="${cls}" d="M${x} ${y - s}C${x + s * 0.12} ${y - s * 0.12} ${x + s * 0.12} ${y - s * 0.12} ${x + s} ${y}C${x + s * 0.12} ${y + s * 0.12} ${x + s * 0.12} ${y + s * 0.12} ${x} ${y + s}C${x - s * 0.12} ${y + s * 0.12} ${x - s * 0.12} ${y + s * 0.12} ${x - s} ${y}C${x - s * 0.12} ${y - s * 0.12} ${x - s * 0.12} ${y - s * 0.12} ${x} ${y - s}Z" fill="${fill}" stroke="${k.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;

/** A small bandage, centered at 0,0, `w` long. */
const bandageShape = (w, k, sw = 3) => {
  const h = w * 0.32;
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2.2}" fill="${k.plaster}" stroke="${k.ink}" stroke-width="${sw}"/>` +
    `<rect x="${-w / 7}" y="${-h / 2 + 2}" width="${(2 * w) / 7}" height="${h - 4}" rx="2" fill="${k.pad}"/>` +
    `<g fill="${k.ink}" fill-opacity=".45"><circle cx="${-w / 3}" cy="${-h / 6}" r="1.3"/><circle cx="${-w / 3}" cy="${h / 6}" r="1.3"/><circle cx="${w / 3}" cy="${-h / 6}" r="1.3"/><circle cx="${w / 3}" cy="${h / 6}" r="1.3"/></g>`;
};

/** A browser window drawn at x,y with size w,h and a face. `mood`: sick, ok, happy. */
export function browserCharacter(k, { x, y, w, h, mood = "sick", glasses = true, thermometer = true, sw = 4 }) {
  const cx = x + w / 2;
  const bar = Math.round(h * 0.2);
  const eyeY = y + bar + h * 0.3;
  const dx = w * 0.18;
  const r = w * 0.095;
  const parts = [];
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.08}" fill="${k.paper}" stroke="${k.ink}" stroke-width="${sw}"/>`);
  parts.push(`<path d="M${x} ${y + bar}V${y + w * 0.08}a${w * 0.08} ${w * 0.08} 0 0 1 ${w * 0.08} ${-w * 0.08}H${x + w - w * 0.08}a${w * 0.08} ${w * 0.08} 0 0 1 ${w * 0.08} ${w * 0.08}V${y + bar}Z" fill="${k.tealPale}" stroke="${k.ink}" stroke-width="${sw}" stroke-linejoin="round"/>`);
  const dotR = bar * 0.17;
  [k.coral, k.yellow, k.tealSoft].forEach((c, i) => parts.push(`<circle cx="${x + bar * 0.6 + i * bar * 0.55}" cy="${y + bar / 2}" r="${dotR}" fill="${c}" stroke="${k.ink}" stroke-width="${sw * 0.5}"/>`));
  parts.push(`<rect x="${x + bar * 2.3}" y="${y + bar * 0.28}" width="${w - bar * 2.8}" height="${bar * 0.44}" rx="${bar * 0.22}" fill="${k.paper}" stroke="${k.ink}" stroke-width="${sw * 0.55}"/>`);
  // cheeks
  const cheekFill = mood === "sick" ? k.coralSoft : k.coralPale;
  parts.push(`<ellipse cx="${cx - dx * 1.45}" cy="${eyeY + r * 2.1}" rx="${r * 0.75}" ry="${r * 0.42}" fill="${cheekFill}"/><ellipse cx="${cx + dx * 1.45}" cy="${eyeY + r * 2.1}" rx="${r * 0.75}" ry="${r * 0.42}" fill="${cheekFill}"/>`);
  // eyes
  for (const s of [-1, 1]) {
    const ex = cx + s * dx;
    if (mood === "sick") {
      parts.push(`<path d="M${ex - r * 0.7} ${eyeY - r * 0.05}h${r * 1.4}" stroke="${k.ink}" stroke-width="${sw * 0.8}" stroke-linecap="round"/>`);
      parts.push(`<path d="M${ex - r * 0.55} ${eyeY}a${r * 0.55} ${r * 0.55} 0 0 0 ${r * 1.1} 0Z" fill="${k.ink}"/>`);
    } else if (mood === "ok") {
      parts.push(`<circle cx="${ex}" cy="${eyeY}" r="${r * 0.42}" fill="${k.ink}"/>`);
    } else {
      parts.push(`<path d="M${ex - r * 0.6} ${eyeY + r * 0.2}a${r * 0.6} ${r * 0.6} 0 0 1 ${r * 1.2} 0" fill="none" stroke="${k.ink}" stroke-width="${sw * 0.8}" stroke-linecap="round"/>`);
    }
  }
  if (glasses) {
    parts.push(`<g fill="${k.glass}" fill-opacity=".55" stroke="${k.ink}" stroke-width="${sw * 0.85}" ${ROUND}><circle cx="${cx - dx}" cy="${eyeY}" r="${r * 1.45}"/><circle cx="${cx + dx}" cy="${eyeY}" r="${r * 1.45}"/></g>`);
    parts.push(`<path d="M${cx - dx + r * 1.45} ${eyeY - r * 0.2}q${dx - r * 1.45} ${-r * 0.7} ${2 * (dx - r * 1.45)} 0M${cx - dx - r * 1.45} ${eyeY - r * 0.3}l${-r} ${-r * 0.5}M${cx + dx + r * 1.45} ${eyeY - r * 0.3}l${r} ${-r * 0.5}" fill="none" stroke="${k.ink}" stroke-width="${sw * 0.85}" ${ROUND}/>`);
    parts.push(`<path d="M${cx - dx - r * 0.7} ${eyeY - r * 0.75}a${r * 0.9} ${r * 0.9} 0 0 1 ${r * 0.7} ${-r * 0.35}" fill="none" stroke="${k.paper}" stroke-width="${sw * 0.5}" stroke-linecap="round"/>`);
  }
  // mouth
  const my = eyeY + r * 2.6;
  if (mood === "sick") parts.push(`<path d="M${cx - r * 0.9} ${my + r * 0.2}q${r * 0.45} ${-r * 0.5} ${r * 0.9} 0t${r * 0.9} 0" fill="none" stroke="${k.ink}" stroke-width="${sw * 0.8}" ${ROUND}/>`);
  else if (mood === "ok") parts.push(`<path d="M${cx - r * 0.7} ${my}h${r * 1.4}" fill="none" stroke="${k.ink}" stroke-width="${sw * 0.8}" stroke-linecap="round"/>`);
  else parts.push(`<path d="M${cx - r} ${my - r * 0.2}a${r} ${r} 0 0 0 ${r * 2} 0Z" fill="${k.coral}" stroke="${k.ink}" stroke-width="${sw * 0.8}" stroke-linejoin="round"/>`);
  if (thermometer) {
    const tx = cx + r * 0.4;
    parts.push(`<g transform="rotate(-18 ${tx} ${my})"><rect x="${tx}" y="${my - r * 0.38}" width="${r * 5.2}" height="${r * 0.76}" rx="${r * 0.38}" fill="${k.paper}" stroke="${k.ink}" stroke-width="${sw * 0.7}"/>` +
      `<path class="art-mercury" d="M${tx + r * 0.3} ${my}h${r * 2.4}" stroke="${k.coral}" stroke-width="${r * 0.36}" stroke-linecap="round"/>` +
      `<path d="M${tx + r * 3.2} ${my - r * 0.38}v${r * 0.3}M${tx + r * 3.9} ${my - r * 0.38}v${r * 0.3}M${tx + r * 4.6} ${my - r * 0.38}v${r * 0.3}" stroke="${k.ink}" stroke-width="${sw * 0.4}" stroke-linecap="round"/></g>`);
  }
  return parts.join("");
}

// ------------------------------------------------------------------------- hero scene

/**
 * Patch's clinic room, 760 x 600. `mode` is "light", "dark" or "var" (inline on the site,
 * where both the day and the night window are drawn and CSS shows one).
 */
export function clinicScene(mode, { id = "clinic", title = true } = {}) {
  const k = ART[mode];
  const day = mode !== "dark";
  const night = mode !== "light";
  const S = `stroke="${k.ink}" ${ROUND}`;
  const out = [];
  out.push(`<defs><clipPath id="${id}-room"><rect width="760" height="600" rx="40"/></clipPath>${patchGroupDefs(`${id}-patch`, true).replace(/flood-color="[^"]+"/, `flood-color="${k.rim}"`)}</defs>`);
  out.push(`<g clip-path="url(#${id}-room)">`);
  // wall, wainscot, floor
  out.push(`<rect width="760" height="600" fill="${k.wall}"/>`);
  out.push(`<rect y="330" width="760" height="140" fill="${k.wallDeep}"/>`);
  out.push(`<path d="${Array.from({ length: 20 }, (_, i) => `M${20 + i * 38} 342V470`).join("")}M0 400H760" stroke="${k.wallLine}" stroke-width="2"/>`);
  out.push(`<rect y="322" width="760" height="14" fill="${k.paper}" stroke="${k.ink}" stroke-width="3"/>`);
  out.push(`<rect y="470" width="760" height="130" fill="${k.floor}"/>`);
  out.push(`<path d="M0 512H760M0 560H760M120 470V512M420 470V512M640 470V512M60 512V560M300 512V560M560 512V560M200 560V600M480 560V600" stroke="${k.floorDeep}" stroke-width="2.5" stroke-linecap="round"/>`);
  out.push(`<path d="M0 470H760" stroke="${k.ink}" stroke-width="3"/>`);
  // window with curtains
  out.push(`<rect x="40" y="52" width="180" height="186" rx="14" fill="${k.sky}"/>`);
  if (day) {
    out.push(`<g class="art-day"><circle cx="176" cy="96" r="20" fill="${ART.light.moon}" stroke="${k.ink}" stroke-width="3"/>` +
      `<g class="art-cloud"><path d="M66 196a14 14 0 0 1 22-12 18 18 0 0 1 34 4 11 11 0 0 1 4 21H70a12 12 0 0 1-4-13Z" fill="${k.paper}" stroke="${k.ink}" stroke-width="3" ${ROUND}/></g></g>`);
  }
  if (night) {
    out.push(`<g class="art-night"><path d="M186 78a22 22 0 1 0 12 34 18 18 0 0 1-12-34Z" fill="${ART.dark.moon}" stroke="${k.ink}" stroke-width="3" ${ROUND}/>` +
      [[72, 84, 6], [104, 116, 4.5], [70, 186, 5], [178, 188, 4], [150, 70, 3.5]].map(([x, y, s], i) => sparkleShape(x, y, s, ART.dark.moon, { ink: "none" }, `art-star art-star-${i}`)).join("") + `</g>`);
  }
  out.push(`<path d="M125 52V238M40 145H220" stroke="${k.paper}" stroke-width="10"/><path d="M120 52V140M130 52V140M120 150V238M130 150V238M40 140H120M130 140H220M40 150H120M130 150H220" stroke="${k.ink}" stroke-width="2.5"/>`);
  out.push(`<rect x="40" y="52" width="180" height="186" rx="14" fill="none" stroke="${k.ink}" stroke-width="4"/>`);
  out.push(`<rect x="28" y="236" width="204" height="14" rx="5" fill="${k.paper}" stroke="${k.ink}" stroke-width="3"/>`);
  out.push(`<path d="M18 42H244" stroke="${k.ink}" stroke-width="5" stroke-linecap="round"/>`);
  out.push(`<path d="M26 44q30 90 6 200l38 4q20-110-8-204Z" fill="${k.coral}" ${S} stroke-width="3.5"/><path d="M40 60q14 80 4 176" fill="none" stroke="${k.coralSoft}" stroke-width="4" stroke-linecap="round"/>`);
  out.push(`<path d="M234 44q-30 90-6 200l-38 4q-20-110 8-204Z" fill="${k.coral}" ${S} stroke-width="3.5"/><path d="M220 60q-14 80-4 176" fill="none" stroke="${k.coralSoft}" stroke-width="4" stroke-linecap="round"/>`);
  // potted plant on the sill
  out.push(`<g ${S} stroke-width="3"><path d="M150 236c-6-18-22-24-30-38 14 2 26 12 30 30M152 236c2-20 14-32 28-36-4 14-14 26-26 36M151 236c-2-16 0-30 6-40 6 12 4 28-4 40" fill="${k.tealSoft}"/><path d="M136 214h32l-4 22h-24Z" fill="${k.coral}"/><path d="M134 214h36" /></g>`);
  // eye chart: E, A11Y, MED, IC
  out.push(`<path d="M312 40 284 58M312 40l28 18" fill="none" ${S} stroke-width="2.5"/><circle cx="312" cy="40" r="5" fill="${k.metalDark}" ${S} stroke-width="2.5"/>`);
  out.push(`<rect x="262" y="56" width="100" height="196" rx="8" fill="${k.paper}" ${S} stroke-width="3"/>`);
  out.push(`<g fill="${k.ink}" font-family="${DISPLAY}" font-weight="700" text-anchor="middle"><text x="312" y="112" font-size="44">E</text><text x="312" y="150" font-size="26" letter-spacing="2">A11Y</text><text x="312" y="180" font-size="19" letter-spacing="3">MED</text><text x="312" y="204" font-size="14" letter-spacing="4">IC</text></g>`);
  out.push(`<path d="M278 218h68" stroke="${k.coral}" stroke-width="3" stroke-linecap="round"/><path d="M284 232h56" stroke="${k.teal}" stroke-width="3" stroke-linecap="round"/>`);
  // wall clock
  out.push(`<g><circle cx="440" cy="128" r="40" fill="${k.paper}" ${S} stroke-width="4"/><circle cx="440" cy="128" r="32" fill="none" stroke="${k.tealPale}" stroke-width="5"/>` +
    `<path d="M440 100v6M440 150v6M412 128h6M462 128h6" ${S} stroke-width="3"/>` +
    `<path class="art-hour" d="M440 128 452 118" ${S} stroke-width="4"/><path class="art-minute" d="M440 128V104" ${S} stroke-width="3"/><circle cx="440" cy="128" r="3.5" fill="${k.coral}" ${S} stroke-width="2"/></g>`);
  // heart monitor on a wall arm
  out.push(`<rect x="604" y="168" width="16" height="44" fill="${k.metalDark}" ${S} stroke-width="3"/><rect x="590" y="206" width="44" height="12" rx="4" fill="${k.metal}" ${S} stroke-width="3"/>`);
  out.push(`<rect x="530" y="58" width="166" height="116" rx="16" fill="${k.metal}" ${S} stroke-width="4"/><rect x="543" y="70" width="140" height="78" rx="9" fill="${k.screen}" ${S} stroke-width="3"/>`);
  out.push(`<path d="M549 114H578L586 98 595 128 604 86 612 120 618 114H676" fill="none" stroke="${k.trace}" stroke-opacity=".22" stroke-width="2.5" ${ROUND}/><path class="art-ekg" d="M549 114H578L586 98 595 128 604 86 612 120 618 114H676" fill="none" stroke="${k.trace}" stroke-width="3" ${ROUND}/>`);
  out.push(`<path class="art-beat" d="M668 84s-7-4-7-9a3.6 3.6 0 0 1 7-1.2 3.6 3.6 0 0 1 7 1.2c0 5-7 9-7 9Z" fill="${k.coral}"/>`);
  out.push(`<text x="552" y="88" font-family="${MONO}" font-size="12" font-weight="700" fill="${k.trace}">72</text><text x="552" y="141" font-family="${MONO}" font-size="9" fill="${k.trace}" fill-opacity=".8">WCAG 2.2</text>`);
  out.push(`<circle cx="560" cy="160" r="4.5" fill="${k.coral}" ${S} stroke-width="2"/><circle cx="576" cy="160" r="4.5" fill="${k.yellow}" ${S} stroke-width="2"/><circle cx="592" cy="160" r="4.5" fill="${k.tealSoft}" ${S} stroke-width="2"/><path d="M640 160h40" ${S} stroke-width="3"/>`);
  // shadows on the floor
  out.push(`<ellipse cx="520" cy="552" rx="200" ry="14" fill="${k.shadow}" fill-opacity=".1"/><ellipse cx="160" cy="556" rx="120" ry="10" fill="${k.shadow}" fill-opacity=".1"/>`);
  // IV stand with a drip that feeds the patient alt text
  out.push(`<g ${S}><rect x="718" y="176" width="9" height="380" rx="4.5" fill="${k.metal}" stroke-width="3"/><path d="M700 182h44" stroke-width="4"/><path d="M698 560h50" stroke-width="5"/><circle cx="702" cy="566" r="5" fill="${k.metalDark}" stroke-width="2.5"/><circle cx="744" cy="566" r="5" fill="${k.metalDark}" stroke-width="2.5"/>` +
    `<path d="M704 186h36v54a12 12 0 0 1-12 12h-12a12 12 0 0 1-12-12Z" fill="${k.glass}" fill-opacity=".9" stroke-width="3"/><path d="M706 212h32v28a10 10 0 0 1-10 10h-12a10 10 0 0 1-10-10Z" fill="${k.tealSoft}" stroke="none"/>` +
    `<rect x="710" y="194" width="24" height="14" rx="3" fill="${k.paper}" stroke-width="2"/><text x="722" y="205" font-family="${MONO}" font-size="10" font-weight="700" fill="${k.ink}" stroke="none" text-anchor="middle">alt</text>` +
    `<rect x="718" y="252" width="8" height="18" rx="3" fill="${k.glass}" stroke-width="2.5"/></g>`);
  out.push(`<circle class="art-drip" cx="722" cy="262" r="2.6" fill="${k.teal}"/>`);
  out.push(`<path d="M722 270c0 60-50 40-96 66" fill="none" stroke="${k.ink}" stroke-width="2.5" stroke-linecap="round"/>`);
  // the stretcher
  out.push(`<g ${S}><path d="M372 424V528M672 424V528" stroke-width="7"/><path d="M372 504H672" stroke-width="4"/>` +
    `<circle cx="372" cy="536" r="13" fill="${k.metalDark}" stroke-width="4"/><circle cx="372" cy="536" r="4" fill="${k.paper}" stroke-width="2"/><circle cx="672" cy="536" r="13" fill="${k.metalDark}" stroke-width="4"/><circle cx="672" cy="536" r="4" fill="${k.paper}" stroke-width="2"/>` +
    `<rect x="322" y="404" width="392" height="24" rx="11" fill="${k.metal}" stroke-width="4"/><path d="M332 404V350a14 14 0 0 1 14-14h0a14 14 0 0 1 14 14V404" fill="${k.metal}" stroke-width="4"/>` +
    `<rect x="334" y="378" width="376" height="32" rx="15" fill="${k.paper}" stroke-width="4"/></g>`);
  // pillow
  out.push(`<rect x="356" y="344" width="84" height="44" rx="20" fill="${k.paper}" ${S} stroke-width="4" transform="rotate(-10 398 366)"/><path d="M372 360q20 6 44-4" fill="none" stroke="${k.tealPale}" stroke-width="4" stroke-linecap="round" transform="rotate(-10 398 366)"/>`);
  // the patient: a browser window sitting up against the pillow
  out.push(`<g class="art-breathe"><g transform="rotate(-8 492 320)">${browserCharacter(k, { x: 392, y: 228, w: 204, h: 162, mood: "sick" })}` +
    `<path class="art-sweat" d="M590 268q7 10 0 15q-7-5 0-15Z" fill="${k.tealSoft}" stroke="${k.ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<g transform="translate(424 248) rotate(-30)">${bandageShape(34, k, 2.5)}</g></g></g>`);
  // blanket
  out.push(`<path d="M430 374q90-26 282-6l2 44q-140 14-288 4Z" fill="${k.teal}" ${S} stroke-width="4"/><path d="M468 372q8 20 2 42M512 366q8 24 2 48" fill="none" stroke="${k.tealSoft}" stroke-width="5" stroke-linecap="round"/><path d="M430 374q90-26 282-6" fill="none" stroke="${k.paper}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 10"/>`);
  // bandaged buttons resting on the blanket
  out.push(`<g transform="rotate(-6 600 380)"><rect x="566" y="366" width="64" height="26" rx="13" fill="${k.coral}" ${S} stroke-width="3.5"/><path d="M582 379h32" stroke="${k.paper}" stroke-width="4" stroke-linecap="round"/><g transform="translate(598 379) rotate(28)">${bandageShape(40, k, 2.5)}</g></g>`);
  out.push(`<g transform="rotate(8 668 384)"><rect x="642" y="372" width="52" height="24" rx="12" fill="${k.yellow}" ${S} stroke-width="3.5"/><path d="M656 384h24" stroke="${k.ink}" stroke-width="3" stroke-linecap="round" stroke-opacity=".5"/><g transform="translate(668 384) rotate(-32)">${bandageShape(34, k, 2.5)}</g></g>`);
  // Patch the otter paramedic
  out.push(`<g class="art-bob"><g transform="translate(4 282) scale(.72)">${patchGroup(`${id}-patch`, true)}</g></g>`);
  // a few floating get-well marks
  out.push(`<g class="art-float">${plusShape(278, 296, 22, k.coral, k)}${sparkleShape(508, 210, 10, k.yellow, k)}${plusShape(380, 286, 14, k.tealSoft, k)}</g>`);
  out.push(`</g><rect x="1.5" y="1.5" width="757" height="597" rx="39" fill="none" stroke="${k.ink}" stroke-width="3"/>`);
  const head = title
    ? `<title id="${id}-title">Patch, the a11ymedic otter paramedic, in his clinic. A sick browser window sits on the stretcher with a thermometer, glasses for low vision and bandaged buttons, next to a heart monitor, an eye chart that reads A11Y MEDIC and an IV bag of alt text.</title>`
    : "";
  return { head, body: out.join("\n") };
}

const ANIM_CSS = `@media (prefers-reduced-motion: no-preference){
.art-ekg{stroke-dasharray:150 300;animation:art-ekg 2.4s linear infinite}
.art-beat{transform-box:fill-box;transform-origin:center;animation:art-beat 1.2s ease-in-out infinite}
.art-bob{animation:art-bob 3.6s ease-in-out infinite}
.art-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:art-breathe 4.2s ease-in-out infinite}
.art-sweat{animation:art-sweat 3s ease-in infinite}
.art-drip{animation:art-drip 2.2s ease-in infinite}
.art-cloud{animation:art-cloud 9s ease-in-out infinite alternate}
.art-star{transform-box:fill-box;transform-origin:center;animation:art-twinkle 2.8s ease-in-out infinite}
.art-star-1,.art-star-3{animation-delay:1.1s}
.art-minute{transform-origin:440px 128px;animation:art-spin 30s linear infinite}
.art-mercury{animation:art-mercury 2.6s ease-in-out infinite}
.art-float{animation:art-bob 5s ease-in-out infinite}}
@keyframes art-ekg{from{stroke-dashoffset:450}to{stroke-dashoffset:0}}
@keyframes art-beat{0%,100%{transform:scale(1)}15%{transform:scale(1.3)}30%{transform:scale(1)}}
@keyframes art-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes art-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.02)}}
@keyframes art-sweat{0%,60%{transform:translateY(0);opacity:1}100%{transform:translateY(18px);opacity:0}}
@keyframes art-drip{0%{transform:translateY(-6px);opacity:0}30%{opacity:1}100%{transform:translateY(10px);opacity:0}}
@keyframes art-cloud{from{transform:translateX(-6px)}to{transform:translateX(10px)}}
@keyframes art-twinkle{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.55);opacity:.6}}
@keyframes art-spin{to{transform:rotate(360deg)}}
@keyframes art-mercury{0%,100%{stroke-dasharray:6 100}50%{stroke-dasharray:22 100}}`;

export const ART_ANIMATION_CSS = ANIM_CSS;

function sceneFile(mode) {
  const { head, body } = clinicScene(mode, { id: `clinic-${mode}` });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 600" width="760" height="600" role="img" aria-labelledby="clinic-${mode}-title">
${head}
<style>${ANIM_CSS}</style>
${body}
</svg>
`;
}

// ------------------------------------------------------------------------- spots
// 240 x 180, a soft blob behind a small scene, ink strokes 3.

const blob = (k) => `<path d="M38 40C66 6 150 2 196 26c40 22 44 78 26 108-20 34-78 44-126 36C46 162 10 130 12 94 13 70 22 58 38 40Z" fill="${k.blob}"/>`;

export const SPOTS = {
  "how-to-fix-color-contrast": {
    alt: "A color swatch fan with a low contrast card being lifted to a darker, readable shade, and a contrast dial",
    draw: (k) => `${blob(k)}
<g stroke="${k.ink}" stroke-width="3" ${ROUND}>
<g transform="rotate(-24 70 150)"><rect x="50" y="40" width="40" height="110" rx="8" fill="${k.paper}"/><rect x="56" y="48" width="28" height="22" rx="4" fill="${k.coralPale}"/></g>
<g transform="rotate(-8 90 150)"><rect x="70" y="36" width="40" height="114" rx="8" fill="${k.paper}"/><rect x="76" y="44" width="28" height="22" rx="4" fill="${k.coralSoft}"/></g>
<g transform="rotate(10 110 150)"><rect x="90" y="36" width="40" height="114" rx="8" fill="${k.paper}"/><rect x="96" y="44" width="28" height="22" rx="4" fill="${k.coral}"/><path d="M100 82h20M100 94h14" stroke="${k.ink}"/></g>
<circle cx="176" cy="74" r="34" fill="${k.paper}"/><path d="M176 40a34 34 0 0 0 0 68Z" fill="${k.teal}"/><circle cx="176" cy="74" r="34" fill="none"/>
<path d="M176 74l16-14" stroke-width="4"/><circle cx="176" cy="74" r="5" fill="${k.coral}"/>
<rect x="148" y="122" width="62" height="26" rx="13" fill="${k.tealPale}"/></g>
<text x="179" y="140" font-family="${MONO}" font-size="13" font-weight="700" fill="${k.ink}" text-anchor="middle">4.5:1</text>
${sparkleShape(214, 30, 8, k.yellow, k)}`,
  },
  "alt-text-best-practices": {
    alt: "A framed photo of hills and a sun with a label tag that describes it, and a speech bubble reading it aloud",
    draw: (k) => `${blob(k)}
<g stroke="${k.ink}" stroke-width="3" ${ROUND}>
<rect x="34" y="36" width="116" height="90" rx="10" fill="${k.paper}"/>
<path d="M34 106l30-30 24 22 18-14 44 38v4a10 10 0 0 1-10 10H44a10 10 0 0 1-10-10Z" fill="${k.tealSoft}"/>
<circle cx="118" cy="62" r="11" fill="${k.yellow}"/>
<path d="M150 104q22 4 30 20" fill="none"/>
<path d="M166 120h40a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6h-40l-12-17Z" fill="${k.coralPale}"/><circle cx="168" cy="137" r="3.5" fill="${k.paper}"/>
<path d="M176 132h26M176 142h18" />
<path d="M168 34h44a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-18l-12 12V74h-14a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10Z" fill="${k.paper}"/>
<path d="M172 48h36M172 60h24" stroke="${k.teal}" stroke-width="4"/></g>`,
  },
  "accessible-form-labels": {
    alt: "A sign up form where a name tag sticker is being stuck onto a text field so it finally has a label",
    draw: (k) => `${blob(k)}
<g stroke="${k.ink}" stroke-width="3" ${ROUND}>
<rect x="40" y="28" width="124" height="128" rx="12" fill="${k.paper}"/>
<path d="M56 50h40" stroke-width="4"/>
<rect x="56" y="60" width="92" height="22" rx="7" fill="${k.tealPale}"/>
<rect x="56" y="98" width="92" height="22" rx="7" fill="${k.paper}" stroke-dasharray="6 6"/>
<rect x="56" y="132" width="52" height="14" rx="7" fill="${k.coral}"/>
<path d="M66 71v.1" stroke-width="4"/>
<g transform="rotate(-12 170 100)"><rect x="132" y="80" width="78" height="44" rx="8" fill="${k.paper}"/><path d="M132 96V88a8 8 0 0 1 8-8h62a8 8 0 0 1 8 8v8Z" fill="${k.coral}"/><path d="M146 110h48" stroke="${k.teal}" stroke-width="4"/></g></g>
<path d="M112 100q-4 10 6 14" fill="none" stroke="${k.ink}" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>
${sparkleShape(208, 56, 9, k.yellow, k)}${sparkleShape(30, 128, 7, k.tealSoft, k)}`,
  },
  "accessibility-testing-in-ci": {
    alt: "Pages riding a conveyor belt under a scanner arch with a stethoscope, one coming out with a bandage",
    draw: (k) => `${blob(k)}
<g stroke="${k.ink}" stroke-width="3" ${ROUND}>
<rect x="18" y="122" width="204" height="18" rx="9" fill="${k.metal}"/>
${[38, 80, 160, 202].map((x) => `<circle cx="${x}" cy="131" r="4.5" fill="${k.paper}"/>`).join("")}
<path d="M92 122V48a28 28 0 0 1 56 0V122" fill="none" stroke-width="5"/>
<path d="M92 122V48a28 28 0 0 1 56 0V122" fill="none" stroke="${k.tealSoft}" stroke-width="2"/>
<circle cx="120" cy="34" r="9" fill="${k.coral}"/>
<path d="M120 43v18" /><circle cx="120" cy="66" r="7" fill="${k.teal}"/>
<g transform="rotate(-4 50 100)"><rect x="30" y="80" width="40" height="42" rx="7" fill="${k.paper}"/><path d="M38 92h16M38 102h24" stroke-width="2.5"/></g>
<rect x="100" y="84" width="40" height="38" rx="7" fill="${k.paper}"/><path d="M108 96h16M108 106h24" stroke-width="2.5"/>
<g transform="rotate(5 190 100)"><rect x="170" y="80" width="40" height="42" rx="7" fill="${k.paper}"/><path d="m180 102 6 6 12-12" stroke="${k.teal}" stroke-width="4"/></g></g>
<g transform="translate(118 112) rotate(-20)">${bandageShape(30, k, 2.5)}</g>
<path d="M214 152h-60" stroke="${k.ink}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 9"/>`,
  },
  "not-found": {
    alt: "An empty stretcher with a blanket and a question mark where the patient should be",
    draw: (k) => `${blob(k)}
<g stroke="${k.ink}" stroke-width="3" ${ROUND}>
<path d="M56 120v34M190 120v34" stroke-width="5"/><circle cx="56" cy="158" r="7" fill="${k.metalDark}"/><circle cx="190" cy="158" r="7" fill="${k.metalDark}"/>
<rect x="30" y="106" width="186" height="16" rx="8" fill="${k.metal}"/>
<rect x="38" y="90" width="170" height="20" rx="10" fill="${k.paper}"/>
<rect x="44" y="72" width="44" height="22" rx="10" fill="${k.paper}" transform="rotate(-8 66 83)"/>
<path d="M96 92q50-14 112-2l2 18q-60 8-118 2Z" fill="${k.teal}"/>
<path d="M136 34a16 16 0 1 1 18 16c-4 1-6 4-6 8v4" fill="none" stroke="${k.coral}" stroke-width="7"/>
<circle cx="148" cy="74" r="4" fill="${k.coral}" stroke="none"/></g>`,
  },
};

export function spot(name, mode, { title = false, id = name } = {}) {
  const s = SPOTS[name];
  const k = ART[mode];
  const a11y = title ? `role="img" aria-labelledby="${id}-t"` : 'aria-hidden="true" focusable="false"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180" ${a11y}>${title ? `<title id="${id}-t">${s.alt}</title>` : ""}${s.draw(k)}</svg>`;
}

// ------------------------------------------------------------------------- stamp

export function dischargedStamp(mode, { title = true } = {}) {
  const c = mode === "dark" ? "#f0806d" : mode === "light" ? "#c4412d" : "var(--a-stamp)";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 120" width="260" height="120" ${title ? 'role="img" aria-labelledby="stamp-t"' : 'aria-hidden="true" focusable="false"'}>${title ? '<title id="stamp-t">Discharged: the page is healthy</title>' : ""}
<g transform="rotate(-7 130 60)" fill="none" stroke="${c}" ${ROUND}>
<rect x="12" y="16" width="236" height="88" rx="16" stroke-width="5"/>
<rect x="22" y="26" width="216" height="68" rx="10" stroke-width="2"/>
<text x="130" y="72" fill="${c}" stroke="none" font-family="${DISPLAY}" font-size="34" font-weight="700" textLength="184" lengthAdjust="spacingAndGlyphs" text-anchor="middle">DISCHARGED</text>
<text x="130" y="88" fill="${c}" stroke="none" font-family="${MONO}" font-size="10" font-weight="700" textLength="120" lengthAdjust="spacingAndGlyphs" text-anchor="middle">A11YMEDIC CLINIC</text>
<path d="M40 44h40M180 44h40" stroke-width="2.5"/>
<path d="M126 36h8v-6M130 30v12" stroke-width="0"/>
</g></svg>`;
}

// ------------------------------------------------------------------------- banner

function bannerFile(mode) {
  const k = ART[mode];
  const bg = mode === "dark" ? "#102a2f" : "#fbf5ea";
  const text = mode === "dark" ? "#f3ead9" : "#1d3a40";
  const muted = mode === "dark" ? "#b8c9c6" : "#4f6266";
  const teal = mode === "dark" ? "#5fd6cb" : "#0a6b6d";
  const coral = mode === "dark" ? "#ff9a87" : "#b8432f";
  const { body } = clinicScene(mode, { id: `banner-${mode}`, title: false });
  const chips = [["61 WCAG 2.2 rules", 0, 214, 150], ["Plain language", 230, 184, 120], ["The exact fix", 430, 172, 108]];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 440" width="1280" height="440" role="img" aria-labelledby="banner-${mode}-t">
<title id="banner-${mode}-t">a11ymedic: the accessibility clinic for websites. Find accessibility problems and get the exact fix. Patch the otter paramedic treats a sick browser window.</title>
<style>${ANIM_CSS}</style>
<rect width="1280" height="440" rx="28" fill="${bg}"/>
<g transform="translate(724 20) scale(.6667)">${body}</g>
<text x="60" y="96" font-family="${MONO}" font-size="20" font-weight="700" letter-spacing="3" fill="${coral}">THE ACCESSIBILITY CLINIC FOR WEBSITES</text>
<text x="56" y="200" font-family="${DISPLAY}" font-size="112" font-weight="700" textLength="390" lengthAdjust="spacingAndGlyphs" fill="${text}">a11y<tspan fill="${teal}">medic</tspan></text>
<text x="60" y="262" font-family="'Atkinson Hyperlegible Next', 'Segoe UI', Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="${muted}">Find accessibility problems. <tspan fill="${coral}">Get the exact fix.</tspan></text>
<g font-family="'Atkinson Hyperlegible Next', 'Segoe UI', Helvetica, Arial, sans-serif" font-size="19" font-weight="700">
${chips.map(([label, x, w, tl], i) => `<g transform="translate(${60 + x} 316)"><rect width="${w}" height="46" rx="23" fill="${mode === "dark" ? "#15353b" : "#fffdf8"}" stroke="${text}" stroke-width="2.5"/><circle cx="26" cy="23" r="7" fill="${[k.teal, k.coral, k.yellow][i]}" stroke="${text}" stroke-width="2"/><text x="44" y="30" fill="${text}" textLength="${tl}" lengthAdjust="spacingAndGlyphs">${label}</text></g>`).join("\n")}
</g>
</svg>
`;
}

// ------------------------------------------------------------------------- inline (site)

const DARK_SCOPES = [':root[data-theme="dark"]', '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"])'];

/** The stylesheet the site loads for the inline art: palette tokens, day and night, motion. */
export function artStylesheet() {
  const { light, dark } = artCss();
  return `/* Generated by scripts/art/clinic.mjs: tokens for the inline clinic art and icons. */
:root { ${light} --a-stamp: #c4412d; }
${DARK_SCOPES[0]} { ${dark} --a-stamp: #f0806d; }
${DARK_SCOPES[1]} { ${dark} --a-stamp: #f0806d; } }
.art-night { display: none; }
:root[data-theme="dark"] .art-day { display: none; }
:root[data-theme="dark"] .art-night { display: inline; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .art-day { display: none; }
  :root:not([data-theme="light"]) .art-night { display: inline; }
}
${ANIM_CSS}
`;
}

export const inline = {
  scene(id = "clinic-hero", cls = "cl-scene") {
    const { head, body } = clinicScene("var", { id });
    return themeable(`<svg class="${cls}" viewBox="0 0 760 600" role="img" aria-labelledby="${id}-title" focusable="false">${head}${body}</svg>`);
  },
  spot(name, cls = "cl-spot") {
    return themeable(spot(name, "var").replace("<svg ", `<svg class="${cls}" `).replace(' xmlns="http://www.w3.org/2000/svg"', "").replace(/ width="240" height="180"/, ""));
  },
  stamp(cls = "cl-stamp") {
    return dischargedStamp("var", { title: false }).replace("<svg ", `<svg class="${cls}" `).replace(' xmlns="http://www.w3.org/2000/svg"', "").replace(/ width="260" height="120"/, "");
  },
  patient(mood, cls = "cl-patient") {
    const k = ART.var;
    return themeable(`<svg class="${cls}" viewBox="0 0 132 108" aria-hidden="true" focusable="false">${browserCharacter(k, { x: 6, y: 6, w: 120, h: 96, mood, glasses: mood !== "happy", thermometer: mood === "sick", sw: 3 })}</svg>`);
  },
};

// ------------------------------------------------------------------------- write

function write(rel, content) {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export function writeArt() {
  const base = "docs/assets/art";
  for (const mode of ["light", "dark"]) {
    write(`${base}/clinic-${mode}.svg`, sceneFile(mode));
    write(`${base}/banner-${mode}.svg`, bannerFile(mode));
    write(`${base}/discharged-${mode}.svg`, `${dischargedStamp(mode).replace("<svg ", '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')}\n`);
    for (const name of Object.keys(SPOTS)) write(`${base}/spots/${name}-${mode}.svg`, `${spot(name, mode, { title: true })}\n`);
    for (const name of Object.keys(ICONS)) write(`${base}/icons/${mode}/${name}.svg`, iconFile(name, mode));
  }
  write(`${base}/icons.svg`, iconSprite());
  write("docs/art.css", artStylesheet());
  return { icons: Object.keys(ICONS).length, spots: Object.keys(SPOTS).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const n = writeArt();
  console.log(`wrote the clinic scene, banner, stamp, ${n.spots} spots and ${n.icons} icons (light and dark) to docs/assets/art/`);
}
