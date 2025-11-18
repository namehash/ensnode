import { describe, expect, it } from "vitest";

import { isLabelHash } from "./labelhash";

describe("isLabelHash", () => {
  // Test case: valid labelHash
  it("should convert a valid 32-byte hex string", () => {
    const validHash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    expect(isLabelHash(validHash)).toBe(true);
  });

  // Test case: labelHash without 0x prefix
  it("should throw error when labelHash does not begin with 0x", () => {
    const noPrefix = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // Testing invalid input
    expect(isLabelHash(noPrefix)).toBe(false);
  });

  // Test case: labelHash with 1x prefix
  it("should throw error when labelHash begins with 1x", () => {
    const onePrefix = "1x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // Testing invalid input
    expect(isLabelHash(onePrefix)).toBe(false);
  });

  // Test case: mixed-case labelHash characters
  it("should throw error when labelHash contains mixed case characters", () => {
    const mixedCase = "0x0123456789aBcDeF0123456789abcdef0123456789abcdef0123456789abcdef";
    expect(isLabelHash(mixedCase)).toBe(false);
  });

  // Test case: 65 hex digits
  it("should throw error when hash is 65 hex digits", () => {
    const hash65 = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde";
    expect(isLabelHash(hash65)).toBe(false);
  });

  // Test case: 67 hex digits
  it("should throw error when labelHash is 67 hex digits", () => {
    const hash67 = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefa";
    expect(isLabelHash(hash67)).toBe(false);
  });
});
