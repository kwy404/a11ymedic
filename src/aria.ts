/** WAI-ARIA 1.2 data used by the rules: roles, attributes, value types and role requirements. */

const words = (s: string): string[] => s.split(/\s+/).filter(Boolean);

export const ABSTRACT_ROLES = new Set(
  words("command composite input landmark range roletype section sectionhead select structure widget window"),
);

export const ROLES = new Set(
  words(`alert alertdialog application article banner blockquote button caption cell checkbox code columnheader combobox
  comment complementary contentinfo definition deletion dialog directory document emphasis feed figure form generic grid
  gridcell group heading img image insertion link list listbox listitem log main mark marquee math menu menubar menuitem
  menuitemcheckbox menuitemradio meter navigation none note option paragraph presentation progressbar radio radiogroup
  region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status strong subscript suggestion
  superscript switch tab table tablist tabpanel term textbox time timer toolbar tooltip tree treegrid treeitem
  doc-abstract doc-acknowledgments doc-afterword doc-appendix doc-backlink doc-biblioentry doc-bibliography doc-biblioref
  doc-chapter doc-colophon doc-conclusion doc-cover doc-credit doc-credits doc-dedication doc-endnote doc-endnotes
  doc-epigraph doc-epilogue doc-errata doc-example doc-footnote doc-foreword doc-glossary doc-glossref doc-index
  doc-introduction doc-noteref doc-notice doc-pagebreak doc-pagefooter doc-pageheader doc-pagelist doc-part doc-preface
  doc-prologue doc-pullquote doc-qna doc-subtitle doc-tip doc-toc graphics-document graphics-object graphics-symbol`),
);

export type AriaType =
  | "boolean"
  | "tristate"
  | "true-false-undefined"
  | "token"
  | "tokens"
  | "idref"
  | "idrefs"
  | "integer"
  | "number"
  | "string";

export interface AriaAttribute {
  type: AriaType;
  values?: string[];
  global?: boolean;
}

const A = (type: AriaType, values?: string, global = false): AriaAttribute =>
  values ? { type, values: words(values), global } : { type, global };

export const ARIA_ATTRIBUTES: Record<string, AriaAttribute> = {
  "aria-activedescendant": A("idref"),
  "aria-atomic": A("boolean", undefined, true),
  "aria-autocomplete": A("token", "inline list both none"),
  "aria-braillelabel": A("string", undefined, true),
  "aria-brailleroledescription": A("string", undefined, true),
  "aria-busy": A("boolean", undefined, true),
  "aria-checked": A("tristate"),
  "aria-colcount": A("integer"),
  "aria-colindex": A("integer"),
  "aria-colindextext": A("string"),
  "aria-colspan": A("integer"),
  "aria-controls": A("idrefs", undefined, true),
  "aria-current": A("token", "page step location date time true false", true),
  "aria-describedby": A("idrefs", undefined, true),
  "aria-description": A("string", undefined, true),
  "aria-details": A("idrefs", undefined, true),
  "aria-disabled": A("boolean", undefined, true),
  "aria-dropeffect": A("tokens", "copy execute link move none popup", true),
  "aria-errormessage": A("idrefs", undefined, true),
  "aria-expanded": A("true-false-undefined"),
  "aria-flowto": A("idrefs", undefined, true),
  "aria-grabbed": A("true-false-undefined", undefined, true),
  "aria-haspopup": A("token", "false true menu listbox tree grid dialog", true),
  "aria-hidden": A("true-false-undefined", undefined, true),
  "aria-invalid": A("token", "grammar false spelling true", true),
  "aria-keyshortcuts": A("string", undefined, true),
  "aria-label": A("string", undefined, true),
  "aria-labelledby": A("idrefs", undefined, true),
  "aria-level": A("integer"),
  "aria-live": A("token", "assertive off polite", true),
  "aria-modal": A("boolean"),
  "aria-multiline": A("boolean"),
  "aria-multiselectable": A("boolean"),
  "aria-orientation": A("token", "horizontal vertical undefined"),
  "aria-owns": A("idrefs", undefined, true),
  "aria-placeholder": A("string"),
  "aria-posinset": A("integer"),
  "aria-pressed": A("tristate"),
  "aria-readonly": A("boolean"),
  "aria-relevant": A("tokens", "additions removals text all", true),
  "aria-required": A("boolean"),
  "aria-roledescription": A("string", undefined, true),
  "aria-rowcount": A("integer"),
  "aria-rowindex": A("integer"),
  "aria-rowindextext": A("string"),
  "aria-rowspan": A("integer"),
  "aria-selected": A("true-false-undefined"),
  "aria-setsize": A("integer"),
  "aria-sort": A("token", "ascending descending none other"),
  "aria-valuemax": A("number"),
  "aria-valuemin": A("number"),
  "aria-valuenow": A("number"),
  "aria-valuetext": A("string"),
};

/** Attributes a role must have when it is set explicitly (ARIA 1.2). */
export const REQUIRED_ATTRIBUTES: Record<string, string[]> = {
  checkbox: ["aria-checked"],
  combobox: ["aria-expanded"],
  heading: ["aria-level"],
  menuitemcheckbox: ["aria-checked"],
  menuitemradio: ["aria-checked"],
  meter: ["aria-valuenow"],
  radio: ["aria-checked"],
  scrollbar: ["aria-controls", "aria-valuenow"],
  slider: ["aria-valuenow"],
  switch: ["aria-checked"],
};

/** Roles that only make sense inside one of the listed parent roles. */
export const REQUIRED_PARENT: Record<string, string[]> = {
  listitem: ["list", "directory"],
  option: ["listbox", "group"],
  tab: ["tablist"],
  menuitem: ["menu", "menubar", "group"],
  menuitemcheckbox: ["menu", "menubar", "group"],
  menuitemradio: ["menu", "menubar", "group"],
  treeitem: ["tree", "group"],
  row: ["table", "grid", "treegrid", "rowgroup"],
  rowgroup: ["table", "grid", "treegrid"],
  cell: ["row"],
  gridcell: ["row"],
  columnheader: ["row"],
  rowheader: ["row"],
};

/** Roles whose accessible name can come from their content. */
export const NAME_FROM_CONTENT = new Set(
  words(`button cell checkbox columnheader comment gridcell heading link menuitem menuitemcheckbox menuitemradio option
  radio row rowheader sectionhead switch tab tooltip treeitem doc-backlink doc-biblioref doc-glossref doc-noteref`),
);

/** Roles that must not be named with aria-label or aria-labelledby (ARIA 1.2 "naming prohibited"). */
export const NAME_PROHIBITED = new Set(
  words(`caption code deletion emphasis generic insertion mark paragraph presentation none strong subscript suggestion
  superscript term time`),
);

export const LANDMARK_ROLES = new Set(words("banner complementary contentinfo form main navigation region search"));

export const WIDGET_ROLES = new Set(
  words(`button checkbox combobox gridcell link listbox menu menubar menuitem menuitemcheckbox menuitemradio option
  progressbar radio radiogroup scrollbar searchbox slider spinbutton switch tab tablist textbox tree treegrid treeitem`),
);

/** Checks a single attribute value against its ARIA type. Returns false when the value is invalid. */
export function isValidAriaValue(name: string, value: string): boolean {
  const def = ARIA_ATTRIBUTES[name];
  if (!def) return false;
  const v = value.trim().toLowerCase();
  switch (def.type) {
    case "boolean":
      return v === "true" || v === "false";
    case "tristate":
      return v === "true" || v === "false" || v === "mixed" || v === "undefined";
    case "true-false-undefined":
      return v === "true" || v === "false" || v === "undefined";
    case "token":
      return def.values!.includes(v);
    case "tokens":
      return v.split(/\s+/).every((t) => def.values!.includes(t));
    case "integer":
      return /^-?\d+$/.test(v);
    case "number":
      return v !== "" && Number.isFinite(Number(v));
    case "idref":
    case "idrefs":
    case "string":
      return true;
  }
}

/** Levenshtein distance, used to suggest the attribute name that was probably meant. */
export function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length]!;
}

/** The closest valid aria-* attribute name, when there is exactly one within two edits. */
export function suggestAriaAttribute(name: string): string | null {
  const hits = Object.keys(ARIA_ATTRIBUTES)
    .map((k) => [k, editDistance(name, k)] as const)
    .filter(([, d]) => d <= 2)
    .sort((x, y) => x[1] - y[1]);
  if (!hits.length) return null;
  if (hits.length > 1 && hits[0]![1] === hits[1]![1]) return null;
  return hits[0]![0];
}

/** Closest valid role for a misspelled one (within two edits), or null. */
export function suggestRole(role: string): string | null {
  let best: string | null = null;
  let bestD = 3;
  for (const r of ROLES) {
    const d = editDistance(role, r);
    if (d < bestD) {
      best = r;
      bestD = d;
    }
  }
  return best;
}
