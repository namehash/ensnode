import { describe, expect, it } from "vitest";

import { EXPECTATION, type Expectation, isExpectation } from "../cases/expectation";
import type { TestCase } from "../cases/types";

export function runSuite<Api>(adapter: Api, cases: TestCase<Api>[]): void {
  describe(`suite (${cases.length} cases)`, () => {
    it.each(cases)("$id - $description", async (testCase) => {
      const actual = await testCase.call(adapter);
      if (isExpectation(testCase.expected)) {
        assertExpectation(actual, testCase.expected);
      } else {
        expect(actual).toMatchObject(testCase.expected as object);
      }
    });
  });
}

function assertExpectation(actual: unknown, e: Expectation): void {
  switch (e[EXPECTATION]) {
    case "partial":
      expect(actual).toMatchObject(e.value as object);
      return;
    case "equals":
      expect(actual).toEqual(e.value);
      return;
    case "arrayContains":
      expect(actual).toEqual(expect.arrayContaining(e.items));
      return;
  }
}
