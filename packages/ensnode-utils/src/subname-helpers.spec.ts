import { IntegerOutOfRangeError, labelhash, namehash, toBytes, zeroHash } from "viem";
import { describe, expect, it } from "vitest";
import {
  decodeDNSPacketBytes,
  isLabelIndexable,
  isUnknownLabel,
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

  it("should return true for unknown labels", () => {
    expect(
      isLabelIndexable("[72c29f4186361a46935e4e9c3af71d1cf73cac00186fceb1cd1945ed9ed3dec1]"),
    ).toBe(true);
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

describe("isUnknownLabel", () => {
  it("should return true for unknown labels", () => {
    expect(
      isUnknownLabel("[72c29f4186361a46935e4e9c3af71d1cf73cac00186fceb1cd1945ed9ed3dec1]"),
    ).toBe(true);
  });

  it("should return false for non-unknown labels", () => {
    expect(isUnknownLabel("test")).toBe(false);
    expect(isUnknownLabel("test\0")).toBe(false);
    expect(isUnknownLabel("test.")).toBe(false);
    expect(isUnknownLabel("test[")).toBe(false);
    expect(isUnknownLabel("test]")).toBe(false);
    expect(isUnknownLabel("[test]")).toBe(false);
    expect(
      isUnknownLabel("[72c29f4186361a46935e4e9c3af71d1cf73cac00186fceb1cd1945ed9ed3dec]"),
    ).toBe(false);
    expect(
      isUnknownLabel("0x72c29f4186361a46935e4e9c3af71d1cf73cac00186fceb1cd1945ed9ed3dec1"),
    ).toBe(false);
    expect(isUnknownLabel("21🚀bingo")).toBe(false);
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
