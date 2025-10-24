import { describe, expect, it } from "vitest";

import { bigintMax } from "@/lib/lib-helpers";

describe("helpers", () => {
  describe("bigintMax", () => {
    it("should return the maximum bigint value", () => {
      expect(bigintMax(1n, 2n, 3n)).toBe(3n);
    });
  });
});
