import { describe, expect, it } from "vitest";

import { decodePrimaryListTokenId } from "./primary-list";

describe("decodePrimaryListTokenId", () => {
  it("decodes a well-formed 32-byte uint256 value to a token id", () => {
    // abi.encodePacked(uint256 1)
    expect(decodePrimaryListTokenId(`0x${"0".repeat(63)}1`)).toBe(1n);
    // max uint256
    expect(decodePrimaryListTokenId(`0x${"f".repeat(64)}`)).toBe((1n << 256n) - 1n);
  });

  it("returns null for values that are not exactly 32 bytes", () => {
    expect(decodePrimaryListTokenId("0x")).toBeNull();
    expect(decodePrimaryListTokenId("0x01")).toBeNull(); // 1 byte: must not coerce to token 1
    expect(decodePrimaryListTokenId(`0x${"0".repeat(61)}1`)).toBeNull(); // 31 bytes: must not coerce to token 1
    expect(decodePrimaryListTokenId(`0x${"00".repeat(33)}`)).toBeNull(); // 33 bytes
  });
});
