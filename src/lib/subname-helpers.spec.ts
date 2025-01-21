import { namehash } from "viem";
import { describe, expect, it } from "vitest";
import {
  decodeDNSPacketBytes,
  isLabelIndexable,
  makeSubnodeNamehash,
  tokenIdToLabel,
} from "./subname-helpers";

describe("isLabelIndexable", () => {
  it("should return false for labels containing unindexable characters", () => {
    expect(isLabelIndexable("test\0")).toBe(false);
    expect(isLabelIndexable("test.")).toBe(false);
    expect(isLabelIndexable("test[")).toBe(false);
    expect(isLabelIndexable("test]")).toBe(false);
  });

  it("should return true for labels without unindexable characters", () => {
    expect(isLabelIndexable("test")).toBe(true);
    expect(isLabelIndexable("example")).toBe(true);
  });

  it("should return false for empty labels", () => {
    expect(isLabelIndexable("")).toBe(false);
  });
});

describe("decodeDNSPacketBytes", () => {
  it('should return ["", "."] for empty buffer', () => {
    expect(decodeDNSPacketBytes(new Uint8Array())).toEqual(["", "."]);
  });

  it("should return [null, null] for labels with unindexable characters", () => {
    const buf = new Uint8Array([116, 101, 115, 116, 0]); // 'test\0'
    expect(decodeDNSPacketBytes(buf)).toEqual([null, null]);
  });
});

describe("tokenIdToLabel", () => {
  it("should convert bigint tokenId to hex string", () => {
    const tokenId = BigInt("1234567890123456789012345678901234567890");
    expect(tokenIdToLabel(tokenId)).toBe(
      "0x00000000000000000000000000000003a0c92075c0dbf3b8acbc5f96ce3f0ad2",
    );
  });
});

describe("makeSubnodeNamehash", () => {
  it("should return the correct namehash for a subnode", () => {
    const node = makeSubnodeNamehash(namehash("base.eth"), tokenIdToLabel(123n));

    expect(node).toBe("0x292d643265e3e6744a5cfadd92c12ca2a65695266118b64f5c4eff14a40d805d");
  });
});
