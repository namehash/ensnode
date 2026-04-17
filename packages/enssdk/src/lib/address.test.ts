import { describe, expect, it } from "vitest";

import { asNormalizedAddress, isNormalizedAddress, toNormalizedAddress } from "./address";

describe("isNormalizedAddress", () => {
  it("should return true for a lowercase address", () => {
    expect(isNormalizedAddress("0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf")).toBe(true);
  });

  it("should return true for the zero address", () => {
    expect(isNormalizedAddress("0x0000000000000000000000000000000000000000")).toBe(true);
  });

  it("should return false for a checksummed address", () => {
    expect(isNormalizedAddress("0x6bD421B6e762d6AD89780EB54B9255f9ab5840BF")).toBe(false);
  });

  it("should return false for a short hex string", () => {
    expect(isNormalizedAddress("0xdeaf")).toBe(false);
  });

  it("should return false for a non-hex string", () => {
    expect(isNormalizedAddress("not-an-address")).toBe(false);
  });
});

describe("toNormalizedAddress", () => {
  it("should convert a checksummed address to lowercase", () => {
    expect(toNormalizedAddress("0x6bD421B6e762d6AD89780EB54B9255f9ab5840BF")).toBe(
      "0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf",
    );
  });

  it("should return an already-lowercase address unchanged", () => {
    expect(toNormalizedAddress("0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf")).toBe(
      "0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf",
    );
  });

  it("should normalize the zero address", () => {
    expect(toNormalizedAddress("0x0000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000",
    );
  });

  it("should throw for a partial address", () => {
    expect(() => toNormalizedAddress("0xdeaf")).toThrow(/does not represent an EVM Address/);
  });

  it("should throw for a non-hex string", () => {
    expect(() => toNormalizedAddress("not-an-address")).toThrow(
      /does not represent an EVM Address/,
    );
  });
});

describe("asNormalizedAddress", () => {
  it("should return the address if already normalized", () => {
    expect(asNormalizedAddress("0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf")).toBe(
      "0x6bd421b6e762d6ad89780eb54b9255f9ab5840bf",
    );
  });

  it("should return the zero address", () => {
    expect(asNormalizedAddress("0x0000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000",
    );
  });

  it("should throw for a checksummed address", () => {
    expect(() => asNormalizedAddress("0x6bD421B6e762d6AD89780EB54B9255f9ab5840BF")).toThrow(
      "Not a NormalizedAddress",
    );
  });

  it("should throw for a short hex string", () => {
    expect(() => asNormalizedAddress("0xdeaf")).toThrow("Not a NormalizedAddress");
  });
});
