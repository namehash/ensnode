import type { LabelHash } from "@ensnode/utils";
import { describe, expect, it } from "vitest";

import { labelHashToBytes } from "./label-utils";

describe("labelHashToBytes", () => {
  // Valid case for reference
  it("should convert a valid 32-byte hex string", () => {
    const validHash =
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" as LabelHash;
    expect(() => labelHashToBytes(validHash)).not.toThrow();
  });

  // Test case: labelHash without 0x prefix
  it("should throw error when labelHash does not begin with 0x", () => {
    const noPrefix = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // Testing invalid input
    expect(() => labelHashToBytes(noPrefix as LabelHash)).toThrow(
      "Invalid labelHash length 64 characters (expected 66)",
    );
  });

  // Test case: labelHash with 1x prefix
  it("should throw error when labelHash begins with 1x", () => {
    const onePrefix = "1x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // Testing invalid input
    expect(() => labelHashToBytes(onePrefix as LabelHash)).toThrow("Labelhash must be 0x-prefixed");
  });

  // Test case: mixed-case labelHash characters
  it("should throw error when labelHash contains mixed case characters", () => {
    const mixedCase =
      "0x0123456789aBcDeF0123456789abcdef0123456789abcdef0123456789abcdef" as LabelHash;
    expect(() => labelHashToBytes(mixedCase)).toThrow("Labelhash must be in lowercase");
  });

  // Test case: 63 hex digits
  it("should throw error when hash is 63 hex digits", () => {
    const hash63 = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde" as LabelHash;
    expect(() => labelHashToBytes(hash63)).toThrow(
      "Invalid labelHash length 65 characters (expected 66)",
    );
  });

  // Test case: 62 hex digits
  it("should throw error when labelHash is 62 hex digits", () => {
    const hash62 = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd" as LabelHash;
    expect(() => labelHashToBytes(hash62)).toThrow(
      "Invalid labelHash length 64 characters (expected 66)",
    );
  });

  // Test case: 65 hex digits
  it("should throw error when labelHash is 65 hex digits", () => {
    const hash65 =
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefa" as LabelHash;
    expect(() => labelHashToBytes(hash65)).toThrow(
      "Invalid labelHash length 67 characters (expected 66)",
    );
  });
});
