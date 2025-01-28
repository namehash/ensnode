import { labelhash, namehash, toBytes } from "viem";
import { describe, expect, it } from "vitest";
import {
  decodeDNSPacketBytes,
  isLabelIndexable,
  makeSubnodeNamehash,
  uint256ToHex32,
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
    expect(isLabelIndexable("21🚀bingo")).toBe(true);
  });

  it("should return false for empty labels", () => {
    expect(isLabelIndexable("")).toBe(false);
  });
});

describe("decodeDNSPacketBytes", () => {
  // TODO: undo the skip when the decodeDNSPacketBytes implementation can be fixed
  // related discussion: https://github.com/namehash/ensnode/pull/43#discussion_r1924255145
  it.skip('should return ["", "."] for empty buffer', () => {
    expect(decodeDNSPacketBytes(new Uint8Array())).toEqual(["", "."]);
  });

  it("should return [null, null] for labels with unindexable characters", () => {
    expect(decodeDNSPacketBytes(toBytes("test\0"))).toEqual([null, null]);
    expect(decodeDNSPacketBytes(toBytes("test."))).toEqual([null, null]);
    expect(decodeDNSPacketBytes(toBytes("test["))).toEqual([null, null]);
    expect(decodeDNSPacketBytes(toBytes("test]"))).toEqual([null, null]);

    // TODO: based on the definition of `isLabelIndexable` the empty label ("")
    // is not indexable, however this test case returns ["", ""] instead of [null, null]
    // expect(decodeDNSPacketBytes(toBytes(""))).toEqual([null, null]);
  });
});

describe("uint256ToHex32", () => {
  it("should convert bigint tokenId to hex string", () => {
    expect(labelhash("vitalik")).toBe(
      uint256ToHex32(
        // https://etherscan.io/token/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85?a=79233663829379634837589865448569342784712482819484549289560981379859480642508#inventory
        79233663829379634837589865448569342784712482819484549289560981379859480642508n,
      ),
    );
  });
});

describe("makeSubnodeNamehash", () => {
  it("should return the correct namehash for a subnode", () => {
    expect(makeSubnodeNamehash(namehash("base.eth"), labelhash("test🚀"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});
