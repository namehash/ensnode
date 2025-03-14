import { IntegerOutOfRangeError, hexToBytes, labelhash, namehash, toBytes, zeroHash } from "viem";
import { describe, expect, it } from "vitest";
import {
  type LabelByReverseAddressArgs,
  decodeDNSPacketBytes,
  isLabelIndexable,
  labelByReverseAddress,
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
    expect(makeSubnodeNamehash(namehash("base.eth"), labelhash("test🚀"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});

describe("labelByReverseAddress", () => {
  const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const reverseAddressSubname = "d8da6bf26964af9d7eed9e03e53415d37aa96045";

  const validArgs = {
    labelhash: labelhash(reverseAddressSubname),
    maybeReverseAddress: address,
  } satisfies LabelByReverseAddressArgs;

  describe("arguments validation", () => {
    it("should throw if sender address is not a valid EVM address", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          maybeReverseAddress: "0x123",
        }),
      ).toThrowError(
        "Invalid reverse address: '0x123'. Must a valid EVM address, start with '0x' and be 42 characters long",
      );
    });

    it("should throw if labelhash is not a valid Labelhash", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          labelhash: "0x123",
        }),
      ).toThrowError("Invalid labelhash: '0x123'. Must start with '0x' and be 66 characters long.");
    });
  });

  describe("label healing", () => {
    it("should return null if the label cannot be healed", () => {
      const notMatchingLabelhash = labelhash("test.eth");
      expect(
        labelByReverseAddress({
          ...validArgs,
          labelhash: notMatchingLabelhash,
        }),
      ).toBe(null);
    });

    it("should return the label if the label can be healed", () => {
      expect(labelByReverseAddress(validArgs)).toBe(reverseAddressSubname);
    });
  });
});
