import { expect } from "vitest";
import { toHaveNoViolations, type MatcherOptions } from "./matchers";

expect.extend({ toHaveNoViolations });

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveNoViolations(options?: MatcherOptions): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(options?: MatcherOptions): unknown;
  }
}

export { toHaveNoViolations };
export type { MatcherOptions };
