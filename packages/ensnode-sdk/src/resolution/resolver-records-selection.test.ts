import { describe, expect, it } from "vitest";
import { isSelectionEmpty } from "./resolver-records-selection";

describe("isSelectionEmpty", () => {
  it("returns true for completely empty selection", () => {
    expect(isSelectionEmpty({})).toBe(true);
  });

  it("returns true if name is false", () => {
    expect(isSelectionEmpty({ name: false })).toBe(true);
  });

  it("returns true if addresses and texts are empty arrays and name is falsy", () => {
    expect(isSelectionEmpty({ addresses: [], texts: [], name: false })).toBe(true);
  });

  it("returns false if name is true", () => {
    expect(isSelectionEmpty({ name: true })).toBe(false);
  });

  it("returns false if addresses is non-empty", () => {
    expect(isSelectionEmpty({ addresses: [60] })).toBe(false);
  });

  it("returns false if texts is non-empty", () => {
    expect(isSelectionEmpty({ texts: ["email"] })).toBe(false);
  });

  it("returns false if multiple fields are non-empty", () => {
    expect(isSelectionEmpty({ name: true, addresses: [60], texts: ["email"] })).toBe(false);
  });
});
