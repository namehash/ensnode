import { describe, expect, it } from "vitest";
import { isLabelSubgraphValid } from "./subgraph-label-valid";

describe("isLabelSubgraphValid", () => {
  it("should return false for labels containing subgraph-invalid characters", () => {
    expect(isLabelSubgraphValid("test\0")).toBe(false);
    expect(isLabelSubgraphValid("test.")).toBe(false);
    expect(isLabelSubgraphValid("test[")).toBe(false);
    expect(isLabelSubgraphValid("test]")).toBe(false);
  });

  it("should return false for unknown label", () => {
    expect(isLabelSubgraphValid(null)).toBe(false);
  });

  it("should return true for labels without subgraph-invalid characters", () => {
    expect(isLabelSubgraphValid("test")).toBe(true);
    expect(isLabelSubgraphValid("example")).toBe(true);
    expect(isLabelSubgraphValid("21🚀bingo")).toBe(true);
  });

  it("should return true for empty label", () => {
    expect(isLabelSubgraphValid("")).toBe(true);
  });
});
