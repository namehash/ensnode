import { IntegerOutOfRangeError, hexToBytes, labelhash, namehash, toBytes, zeroHash } from "viem";
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

  it("should handle previously bugged name", () => {
    // this `name` from tx 0x2138cdf5fbaeabc9cc2cd65b0a30e4aea47b3961f176d4775869350c702bd401
    expect(decodeDNSPacketBytes(hexToBytes("0x0831323333333232310365746800"))).toEqual([
      "12333221",
      "12333221.eth",
    ]);
  });
});

describe("uint256ToHex32", () => {
  it("should convert bigint to hex string", () => {
    expect(() => uint256ToHex32(-1n)).toThrow(IntegerOutOfRangeError);
    expect(uint256ToHex32(0n)).toBe(zeroHash);
    expect(uint256ToHex32(2n ** 256n - 1n)).toBe(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    );
    expect(() => uint256ToHex32(2n ** 256n)).toThrow(IntegerOutOfRangeError);
  });
});

describe("makeSubnodeNamehash", () => {
  it("should return the correct namehash for a subnode", () => {
    expect(makeSubnodeNamehash(namehash("base.eth"), labelhash("test🚀"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});
