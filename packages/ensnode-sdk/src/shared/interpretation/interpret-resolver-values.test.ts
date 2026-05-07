import type { Hex } from "enssdk";
import { zeroHash } from "viem";
import { describe, expect, it } from "vitest";

import {
  interpretContenthashValue,
  interpretDnszonehashValue,
  interpretPubkeyValue,
} from "./interpret-resolver-values";

describe("interpretContenthashValue", () => {
  it("returns null for empty bytes sentinel", () => {
    expect(interpretContenthashValue("0x")).toBeNull();
  });

  it("returns the raw hex for a non-empty value", () => {
    expect(interpretContenthashValue("0xdeadbeef" as Hex)).toBe("0xdeadbeef");
  });
});

describe("interpretDnszonehashValue", () => {
  it("returns null for empty bytes sentinel", () => {
    expect(interpretDnszonehashValue("0x")).toBeNull();
  });

  it("returns the raw hex for a non-empty value", () => {
    expect(interpretDnszonehashValue("0xcafe" as Hex)).toBe("0xcafe");
  });
});

describe("interpretPubkeyValue", () => {
  it("returns null when both x and y are zeroHash", () => {
    expect(interpretPubkeyValue(zeroHash, zeroHash)).toBeNull();
  });

  it("returns { x, y } when both are set", () => {
    const x = `0x${"11".repeat(32)}` as Hex;
    const y = `0x${"22".repeat(32)}` as Hex;
    expect(interpretPubkeyValue(x, y)).toEqual({ x, y });
  });

  it("treats only-x-set as a present value (not a deletion)", () => {
    const x = `0x${"11".repeat(32)}` as Hex;
    // Invariant guards this case on the write side; the interpreter itself preserves whatever
    // it's given so long as it's not the full (zeroHash, zeroHash) sentinel.
    expect(interpretPubkeyValue(x, zeroHash)).toEqual({ x, y: zeroHash });
  });
});
