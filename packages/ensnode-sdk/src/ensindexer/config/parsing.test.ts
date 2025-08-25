import { describe, expect, it } from "vitest";
import { parseNonNegativeInteger } from "./parsing";

describe("parseNonNegativeInteger", () => {
  it("should return a valid non-negative integer", () => {
    expect(parseNonNegativeInteger("0")).toBe(0);
    expect(parseNonNegativeInteger("42")).toBe(42);
    expect(parseNonNegativeInteger("1000000")).toBe(1000000);
  });

  it("should throw an error for negative numbers", () => {
    expect(() => parseNonNegativeInteger("-5")).toThrow("is not a non-negative integer");
  });

  it("should throw an error for floating-point numbers", () => {
    expect(() => parseNonNegativeInteger("3.14")).toThrow("is not an integer");
    expect(() => parseNonNegativeInteger("0.5")).toThrow("is not an integer");
  });

  it("should throw an error for special numbers", () => {
    expect(() => parseNonNegativeInteger("NaN")).toThrow("is not a valid number");
    expect(() => parseNonNegativeInteger("Infinity")).toThrow("is not a finite number");
  });

  it("should throw an error for empty strings", () => {
    expect(() => parseNonNegativeInteger("")).toThrow("Input cannot be empty");
    expect(() => parseNonNegativeInteger(" ")).toThrow("Input cannot be empty");
  });

  it("should throw an error for invalid strings", () => {
    expect(() => parseNonNegativeInteger("42abc")).toThrow("is not a valid number");
    expect(() => parseNonNegativeInteger("abc42")).toThrow("is not a valid number");
  });

  it("should throw an error for negative zero", () => {
    expect(() => parseNonNegativeInteger("-0")).toThrow(
      "Negative zero is not a valid non-negative integer",
    );
  });
});
