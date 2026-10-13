import { toHaveNoViolations, type MatcherOptions } from "./matchers";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(options?: MatcherOptions): R;
    }
  }
}

const g = globalThis as unknown as { expect?: { extend(m: object): void } };
if (g.expect && typeof g.expect.extend === "function") g.expect.extend({ toHaveNoViolations });

export { toHaveNoViolations };
export type { MatcherOptions };
