import { describe, expect, it } from "vitest";

import { isLabelSubgraphIndexable } from "@/lib/label-subgraph-indexable";

describe("isLabelSubgraphIndexable", () => {
  it("should return false for labels containing subgraph-unindexable characters", () => {
    expect(isLabelSubgraphIndexable("test\0")).toBe(false);
    expect(isLabelSubgraphIndexable("test.")).toBe(false);
    expect(isLabelSubgraphIndexable("test[")).toBe(false);
    expect(isLabelSubgraphIndexable("test]")).toBe(false);
  });

  it("should return false for unknown label", () => {
    expect(isLabelSubgraphIndexable(null)).toBe(false);
  });

  it("should return true for labels without subgraph-unindexable characters", () => {
    expect(isLabelSubgraphIndexable("test")).toBe(true);
    expect(isLabelSubgraphIndexable("example")).toBe(true);
    expect(isLabelSubgraphIndexable("21🚀bingo")).toBe(true);
  });

  it("should return true for empty label", () => {
    expect(isLabelSubgraphIndexable("")).toBe(true);
  });
});
