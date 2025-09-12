import { Address, IntegerOutOfRangeError, labelhash, namehash, zeroHash } from "viem";
import { describe, expect, it } from "vitest";

import {
  makeSubdomainNode,
  maybeHealLabelByReverseAddress,
  uint256ToHex32,
} from "./subname-helpers";

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
    expect(makeSubdomainNode(labelhash("test🚀"), namehash("base.eth"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});

describe("labelByReverseAddress", () => {
  const address: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const reverseAddressSubname = "d8da6bf26964af9d7eed9e03e53415d37aa96045";
  const labelHash = labelhash(reverseAddressSubname);

  describe("arguments validation", () => {
    it("should throw if sender address is not a valid EVM address", () => {
      expect(() => maybeHealLabelByReverseAddress(labelHash, "0x123")).toThrow(/Invalid address/i);
    });

    it("should throw if labelHash is not a valid LabelHash", () => {
      expect(() => maybeHealLabelByReverseAddress("0x123", address)).toThrowError(
        /Invalid labelHash/i,
      );
    });
  });

  describe("label healing", () => {
    it("should return null if the label cannot be healed", () => {
      const notMatchingLabelHash = labelhash("test.eth");
      expect(maybeHealLabelByReverseAddress(notMatchingLabelHash, address)).toBe(null);
    });

    it("should return the label if the label can be healed", () => {
      expect(maybeHealLabelByReverseAddress(labelHash, address)).toBe(reverseAddressSubname);
    });
  });
});
