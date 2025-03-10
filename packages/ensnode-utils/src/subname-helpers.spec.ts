import { IntegerOutOfRangeError, hexToBytes, labelhash, namehash, toBytes, zeroHash } from "viem";
import { describe, expect, it } from "vitest";
import {
  type LabelhashByReverseAddressArgs,
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
  const vitalikEthResolvedAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const vitalikEthNormalizedAddress = "d8da6bf26964af9d7eed9e03e53415d37aa96045";
  // `namehash('addr.reverse')`
  const addReverseRootNode = "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2";

  const validArgs = {
    // labelhash for `d8da6bf26964af9d7eed9e03e53415d37aa96045`
    labelhash: "0x535bdae9bb214b3cc583b53384464999f2f7f48625f160728c63e73e766ff71e",
    senderAddress: vitalikEthResolvedAddress,
    parentNode: addReverseRootNode,
    reverseRootNode: addReverseRootNode,
  } satisfies LabelhashByReverseAddressArgs;

  describe("arguments validation", () => {
    it("should throw if sender address is not a valid EVM address", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          senderAddress: "0x123",
        }),
      ).toThrowError(
        "Invalid sender address: 0x123. Must start with '0x' and be 42 characters long.",
      );
    });

    it("should throw if labelhash is not a valid hash", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          labelhash: "0x123",
        }),
      ).toThrowError("Invalid labelhash: 0x123. Must start with '0x' be 66 characters long.");
    });

    it("should throw if parent node is not a valid namehash", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          parentNode: "0x123",
        }),
      ).toThrowError("Invalid parent node: 0x123. Must start with '0x' be 66 characters long.");
    });

    it("should throw if reverse root node is provided and is not a valid namehash", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          reverseRootNode: "0x123",
        }),
      ).toThrowError(
        "Invalid reverse root node: 0x123. If provided, it must start with '0x' be 66 characters long.",
      );
    });

    it("should not throw if reverse root node is not provided", () => {
      expect(() =>
        labelByReverseAddress({
          ...validArgs,
          reverseRootNode: undefined,
        }),
      ).not.toThrow();
    });
  });

  describe("label healing", () => {
    it("should return null if the label cannot be healed", () => {
      expect(
        labelByReverseAddress({
          ...validArgs,
          labelhash: labelhash("test.eth"),
        }),
      ).toBe(null);
    });

    it("should return the label if the label can be healed", () => {
      expect(labelByReverseAddress(validArgs)).toBe(vitalikEthNormalizedAddress);
    });
  });
});
