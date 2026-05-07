import { asLiteralLabel, type LiteralLabel } from "enssdk";
import { describe, expect, it } from "vitest";

import { isLabelSubgraphIndexable } from "./is-label-subgraph-indexable";

describe("isLabelSubgraphIndexable", () => {
  it("should return false for labels containing subgraph-unindexable characters", () => {
    expect(isLabelSubgraphIndexable(asLiteralLabel("test\0"))).toBe(false);
    expect(isLabelSubgraphIndexable(asLiteralLabel("test."))).toBe(false);
    expect(isLabelSubgraphIndexable(asLiteralLabel("test["))).toBe(false);
    expect(isLabelSubgraphIndexable(asLiteralLabel("test]"))).toBe(false);
  });

  it("should return false for unknown label", () => {
    expect(isLabelSubgraphIndexable(null)).toBe(false);
  });

  it("should return true for labels without subgraph-unindexable characters", () => {
    expect(isLabelSubgraphIndexable(asLiteralLabel("test"))).toBe(true);
    expect(isLabelSubgraphIndexable(asLiteralLabel("example"))).toBe(true);
    expect(isLabelSubgraphIndexable(asLiteralLabel("21🚀bingo"))).toBe(true);

    // unnormalized
    expect(isLabelSubgraphIndexable(asLiteralLabel("ABC"))).toBe(true);
    expect(isLabelSubgraphIndexable(asLiteralLabel("abc|xyz"))).toBe(true);
  });

  it("should return true for empty label", () => {
    expect(isLabelSubgraphIndexable("" as LiteralLabel)).toBe(true);
  });
});
