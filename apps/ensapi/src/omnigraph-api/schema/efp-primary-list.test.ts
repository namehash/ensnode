import { describe, expect, it } from "vitest";

import { decodePrimaryListTokenId } from "./efp-primary-list";

describe("decodePrimaryListTokenId", () => {
  it("decodes a well-formed 32-byte uint256 value to a decimal token id", () => {
    // abi.encodePacked(uint256 1)
    expect(decodePrimaryListTokenId(`0x${"0".repeat(63)}1` as `0x${string}`)).toBe("1");
    // max uint256
    expect(decodePrimaryListTokenId(`0x${"f".repeat(64)}` as `0x${string}`)).toBe(
      ((1n << 256n) - 1n).toString(),
    );
  });

  it("returns null for values that are not exactly 32 bytes", () => {
    expect(decodePrimaryListTokenId("0x")).toBeNull();
    expect(decodePrimaryListTokenId("0x01")).toBeNull(); // 1 byte: must not coerce to token 1
    expect(decodePrimaryListTokenId(`0x${"0".repeat(62)}1` as `0x${string}`)).toBeNull(); // 31 bytes
    expect(decodePrimaryListTokenId(`0x${"00".repeat(33)}` as `0x${string}`)).toBeNull(); // 33 bytes
  });
});
