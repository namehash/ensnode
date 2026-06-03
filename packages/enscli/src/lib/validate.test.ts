import { describe, expect, it } from "vitest";

import { assertCleanIdentifier } from "./validate";

describe("assertCleanIdentifier", () => {
  it("accepts ordinary ENS names and labels", () => {
    expect(() => assertCleanIdentifier("vitalik.eth", "name")).not.toThrow();
    expect(() => assertCleanIdentifier("vitalik", "label")).not.toThrow();
    expect(() => assertCleanIdentifier("[abcd1234]", "labelhash")).not.toThrow();
  });

  it.each(["vitalik?.eth", "vitalik#.eth", "name%2e", "a\tb", "a\nb"])(
    "rejects hallucinated/forbidden characters: %j",
    (value) => {
      expect(() => assertCleanIdentifier(value, "name")).toThrow(/forbidden characters/);
    },
  );
});
