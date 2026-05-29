import { describe, expect, it } from "vitest";

import { parseListStorageLocation } from "./parse-list-storage-location";

describe("parseListStorageLocation", () => {
  it("decodes a well-formed 86-byte onchain (locationType=1) payload", () => {
    const chainIdHex = (8453).toString(16).padStart(64, "0");
    const addressHex = "ab".repeat(20);
    const slotHex = "cd".repeat(32);
    const payload = `0x0101${chainIdHex}${addressHex}${slotHex}` as `0x${string}`;

    expect(parseListStorageLocation(payload)).toEqual({
      version: 1,
      chainId: 8453n,
      contractAddress: `0x${addressHex}` as `0x${string}`,
      slot: `0x${slotHex}` as `0x${string}`,
    });
  });

  it("lower-cases the decoded contract address and slot", () => {
    const chainIdHex = (1).toString(16).padStart(64, "0");
    const payload = `0x0101${chainIdHex}${"AB".repeat(20)}${"CD".repeat(32)}` as `0x${string}`;

    expect(parseListStorageLocation(payload)).toEqual({
      version: 1,
      chainId: 1n,
      contractAddress: `0x${"ab".repeat(20)}` as `0x${string}`,
      slot: `0x${"cd".repeat(32)}` as `0x${string}`,
    });
  });

  it("returns null for short, nullish, or non-hex inputs", () => {
    expect(parseListStorageLocation(null)).toBeNull();
    expect(parseListStorageLocation(undefined)).toBeNull();
    expect(parseListStorageLocation("0x")).toBeNull();
    expect(parseListStorageLocation("not-hex")).toBeNull();
    expect(parseListStorageLocation(`0x${"11".repeat(50)}`)).toBeNull(); // 50 bytes < 86 bytes
  });

  it("returns null for any non-onchain locationType (EFP defines only type 1)", () => {
    const tail = "00".repeat(84); // 84 bytes of body, well-formed length
    // locationType = 0x02 — the offline/HTTP variant is NOT part of the EFP spec.
    expect(parseListStorageLocation(`0x0102${tail}` as `0x${string}`)).toBeNull();
    // locationType = 0xff — reserved/unknown.
    expect(parseListStorageLocation(`0x01ff${tail}` as `0x${string}`)).toBeNull();
  });

  it("returns null for unsupported versions (only version 1 is defined)", () => {
    const chainIdHex = (1).toString(16).padStart(64, "0");
    // version = 0x02 — a future schema must not remap the list via the v1 decoder.
    const payload = `0x0201${chainIdHex}${"ab".repeat(20)}${"cd".repeat(32)}` as `0x${string}`;
    expect(parseListStorageLocation(payload)).toBeNull();
  });

  it("returns null for overlong payloads (must be exactly 86 bytes)", () => {
    const chainIdHex = (1).toString(16).padStart(64, "0");
    // 86 well-formed bytes + 1 trailing byte = 87 bytes.
    const overlong = `0x0101${chainIdHex}${"ab".repeat(20)}${"cd".repeat(32)}ff` as `0x${string}`;
    expect(parseListStorageLocation(overlong)).toBeNull();
  });
});
