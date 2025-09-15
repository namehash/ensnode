import { IntegerOutOfRangeError, labelhash, namehash, zeroHash } from "viem";
import { describe, expect, it } from "vitest";

import { makeSubdomainNode, uint256ToHex32 } from "./subname-helpers";

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

describe("makeSubdomainNode", () => {
  it("should return the correct namehash for a subnode", () => {
    expect(makeSubdomainNode(labelhash("test🚀"), namehash("base.eth"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});
