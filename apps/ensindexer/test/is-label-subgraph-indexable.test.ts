import { LiteralLabel } from "@ensnode/ensnode-sdk";
import { describe, expect, it } from "vitest";

import { isLabelSubgraphIndexable } from "@/lib/is-label-subgraph-indexable";

describe("isLabelSubgraphIndexable", () => {
  it("should return false for labels containing subgraph-unindexable characters", () => {
    expect(isLabelSubgraphIndexable("test\0" as LiteralLabel)).toBe(false);
    expect(isLabelSubgraphIndexable("test." as LiteralLabel)).toBe(false);
    expect(isLabelSubgraphIndexable("test[" as LiteralLabel)).toBe(false);
    expect(isLabelSubgraphIndexable("test]" as LiteralLabel)).toBe(false);
  });

  it("should return false for unknown label", () => {
    expect(isLabelSubgraphIndexable(null)).toBe(false);
  });

  it("should return true for labels without subgraph-unindexable characters", () => {
    expect(isLabelSubgraphIndexable("test" as LiteralLabel)).toBe(true);
    expect(isLabelSubgraphIndexable("example" as LiteralLabel)).toBe(true);
    expect(isLabelSubgraphIndexable("21🚀bingo" as LiteralLabel)).toBe(true);

    // unnormalized
    expect(isLabelSubgraphIndexable("ABC" as LiteralLabel)).toBe(true);
    expect(isLabelSubgraphIndexable("abc|xyz" as LiteralLabel)).toBe(true);
  });

  it("should return true for empty label", () => {
    expect(isLabelSubgraphIndexable("" as LiteralLabel)).toBe(true);
  });
});
