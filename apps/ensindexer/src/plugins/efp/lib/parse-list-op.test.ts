import { describe, expect, it } from "vitest";

import { parseListOp, parseRecord, parseTagOp, slotToBytes32 } from "./parse-list-op";

const A20 = "0x".padEnd(42, "a"); // 0xaaa…aaa (20 bytes)

describe("parseListOp", () => {
  it("decodes version, opcode, and data payload", () => {
    // version=0x01, opcode=0x01 (ADD_RECORD), data = recordVersion(01) + recordType(01) + 20-byte address
    const op = `0x01010101${A20.slice(2)}` as `0x${string}`;
    expect(parseListOp(op)).toEqual({
      version: 1,
      opcode: 1,
      data: `0x0101${A20.slice(2)}` as `0x${string}`,
    });
  });

  it("returns null for non-hex, too-short, empty, or nullish input", () => {
    expect(parseListOp(null)).toBeNull();
    expect(parseListOp(undefined)).toBeNull();
    expect(parseListOp("")).toBeNull();
    expect(parseListOp("0x")).toBeNull();
    expect(parseListOp("0x01")).toBeNull(); // only version, no opcode
    expect(parseListOp("hello")).toBeNull();
  });
});

describe("parseRecord", () => {
  it("decodes an address record (recordType=1) and truncates to 20 bytes", () => {
    // recordVersion=01, recordType=01, address=20 bytes of 0xaa, then junk
    const data = `0x0101${"aa".repeat(20)}deadbeef` as `0x${string}`;
    expect(parseRecord(data)).toEqual({
      version: 1,
      recordType: 1,
      recordData: `0x${"aa".repeat(20)}` as `0x${string}`,
    });
  });

  it("returns null when an address record is shorter than 20 bytes", () => {
    const data = `0x0101${"aa".repeat(10)}` as `0x${string}`;
    expect(parseRecord(data)).toBeNull();
  });

  it("keeps the full body for non-address record types", () => {
    const data = ("0x0102" + "01020304") as `0x${string}`;
    expect(parseRecord(data)).toEqual({
      version: 1,
      recordType: 2,
      recordData: "0x01020304",
    });
  });

  it("returns null for unparseable input", () => {
    expect(parseRecord(null)).toBeNull();
    expect(parseRecord("0x")).toBeNull();
  });
});

describe("parseTagOp", () => {
  it("splits the 22-byte record prefix from the UTF-8 tag", () => {
    // record = recordVersion(01) + recordType(01) + 20 bytes address
    const recordPrefixHex = `0101${"aa".repeat(20)}`;
    const tagBytes = Buffer.from("top8", "utf8").toString("hex");
    const data = `0x${recordPrefixHex}${tagBytes}` as `0x${string}`;

    expect(parseTagOp(data)).toEqual({
      record: `0x${recordPrefixHex}` as `0x${string}`,
      tag: "top8",
    });
  });

  it("strips NUL bytes inside the decoded tag (api-v2 parity)", () => {
    const recordPrefixHex = `0101${"bb".repeat(20)}`;
    // 'a' (0x61) + NUL (0x00) + 'b' (0x62)
    const tagBytes = "610062";
    const data = `0x${recordPrefixHex}${tagBytes}` as `0x${string}`;
    expect(parseTagOp(data)?.tag).toBe("ab");
  });

  it("returns null for inputs shorter than the record prefix", () => {
    expect(parseTagOp("0x0101")).toBeNull();
    expect(parseTagOp(null)).toBeNull();
  });
});

describe("slotToBytes32", () => {
  it("zero-pads small slot values to 32 bytes", () => {
    expect(slotToBytes32(0n)).toBe(`0x${"0".repeat(64)}`);
    expect(slotToBytes32(1n)).toBe(`0x${"0".repeat(63)}1`);
  });

  it("preserves full-width slot values", () => {
    const max = (1n << 256n) - 1n;
    expect(slotToBytes32(max)).toBe(`0x${"f".repeat(64)}`);
  });
});
