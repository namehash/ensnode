import {
  Address,
  IntegerOutOfRangeError,
  hexToBytes,
  labelhash,
  namehash,
  toBytes,
  zeroHash,
} from "viem";
import { describe, expect, it } from "vitest";

import {
  decodeDNSPacketBytes,
  isLabelIndexable,
  makeSubnode,
  maybeHealLabelByReverseAddress,
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

  it("should return false for unhealable lablelhash", () => {
    expect(isLabelIndexable(null)).toBe(false);
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
    expect(makeSubnode(labelhash("test🚀"), namehash("base.eth"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});

describe("labelByReverseAddress", () => {
  const address: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const reverseAddressSubname = "d8da6bf26964af9d7eed9e03e53415d37aa96045";

  const validArgs = {
    labelHash: labelhash(reverseAddressSubname),
    maybeReverseAddress: address,
  };

  describe("arguments validation", () => {
    it("should throw if sender address is not a valid EVM address", () => {
      expect(() =>
        maybeHealLabelByReverseAddress({
          ...validArgs,
          maybeReverseAddress: "0x123",
        }),
      ).toThrowError(/Invalid reverse address/i);
    });

    it("should throw if labelHash is not a valid LabelHash", () => {
      expect(() =>
        maybeHealLabelByReverseAddress({
          ...validArgs,
          labelHash: "0x123",
        }),
      ).toThrowError(/Invalid labelHash/i);
    });
  });

  describe("label healing", () => {
    it("should return null if the label cannot be healed", () => {
      const notMatchingLabelHash = labelhash("test.eth");
      expect(
        maybeHealLabelByReverseAddress({
          ...validArgs,
          labelHash: notMatchingLabelHash,
        }),
      ).toBe(null);
    });

    it("should return the label if the label can be healed", () => {
      expect(maybeHealLabelByReverseAddress(validArgs)).toBe(reverseAddressSubname);
    });
  });
});
