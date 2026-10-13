import type { Rule } from "../engine";
import type { RuleMeta } from "../types";
import { ariaRules } from "./aria";
import { contrastRules } from "./contrast";
import { documentRules } from "./document";
import { formRules } from "./forms";
import { imageRules } from "./images";
import { keyboardRules } from "./keyboard";
import { mediaRules } from "./media";
import { nameRules } from "./names";
import { structureRules } from "./structure";

/** Every rule, in the order they run. */
export const RULES: Rule[] = [
  ...imageRules,
  ...nameRules,
  ...formRules,
  ...contrastRules,
  ...documentRules,
  ...structureRules,
  ...ariaRules,
  ...keyboardRules,
  ...mediaRules,
];

/** Rule metadata without the implementation, for docs and reports. */
export function ruleList(): RuleMeta[] {
  return RULES.map(({ run: _run, ...meta }) => meta);
}
