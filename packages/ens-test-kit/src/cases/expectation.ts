export const EXPECTATION = Symbol.for("ens-test-kit.expectation");

export type Expectation =
  | { [EXPECTATION]: "partial"; value: unknown }
  | { [EXPECTATION]: "equals"; value: unknown }
  | { [EXPECTATION]: "arrayContains"; items: unknown[] };

export const expectation = {
  partial(value: unknown): Expectation {
    return { [EXPECTATION]: "partial", value };
  },
  equals(value: unknown): Expectation {
    return { [EXPECTATION]: "equals", value };
  },
  arrayContains(...items: unknown[]): Expectation {
    return { [EXPECTATION]: "arrayContains", items };
  },
};

export function isExpectation(value: unknown): value is Expectation {
  if (typeof value !== "object" || value === null) return false;
  const marker = (value as Record<symbol, unknown>)[EXPECTATION];
  return marker === "partial" || marker === "equals" || marker === "arrayContains";
}
