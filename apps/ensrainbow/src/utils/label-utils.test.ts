import type { Labelhash } from "ensnode-utils/types";
import { describe, expect, it } from "vitest";
import { labelHashToBytes } from "./label-utils";

describe("labelHashToBytes", () => {
  // Valid case for reference
  it("should convert a valid 32-byte hex string", () => {
    const validHash =
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" as Labelhash;
    expect(() => labelHashToBytes(validHash)).not.toThrow();
  });

  // Test case: labelhash without 0x prefix
  it("should throw error when labelhash does not begin with 0x", () => {
    const noPrefix = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // @ts-expect-error - Testing invalid input
    expect(() => labelHashToBytes(noPrefix)).toThrow(
      "Invalid labelhash length 64 characters (expected 66)",
    );
  });

  // Test case: labelhash with 1x prefix
  it("should throw error when labelhash begins with 1x", () => {
    const onePrefix = "1x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // @ts-expect-error - Testing invalid input
    expect(() => labelHashToBytes(onePrefix)).toThrow("Labelhash must be 0x-prefixed");
  });

  // Test case: mixed-case labelhash characters
  it("should throw error when labelhash contains mixed case characters", () => {
    const mixedCase =
      "0x0123456789aBcDeF0123456789abcdef0123456789abcdef0123456789abcdef" as Labelhash;
    expect(() => labelHashToBytes(mixedCase)).toThrow("Labelhash must be in lowercase");
  });

  // Test case: 63 hex digits
  it("should throw error when hash is 63 hex digits", () => {
    const hash63 = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde" as Labelhash;
    expect(() => labelHashToBytes(hash63)).toThrow(
      "Invalid labelhash length 65 characters (expected 66)",
    );
  });

  // Test case: 62 hex digits
  it("should throw error when labelhash is 62 hex digits", () => {
    const hash62 = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd" as Labelhash;
    expect(() => labelHashToBytes(hash62)).toThrow(
      "Invalid labelhash length 64 characters (expected 66)",
    );
  });

  // Test case: 65 hex digits
  it("should throw error when labelhash is 65 hex digits", () => {
    const hash65 =
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefa" as Labelhash;
    expect(() => labelHashToBytes(hash65)).toThrow(
      "Invalid labelhash length 67 characters (expected 66)",
    );
  });
});
