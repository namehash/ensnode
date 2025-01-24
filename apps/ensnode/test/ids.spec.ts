import { namehash, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { makeEventId, makeResolverId } from "../src/lib/ids";

describe("ids", () => {
  describe("makeResolverId", () => {
    it("should match snapshot", () => {
      expect(makeResolverId(zeroAddress, namehash("vitalik.eth"))).toEqual(
        "0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      );
    });
  });

  describe("makeEventId", () => {
    it("should match snapshot", () => {
      expect(makeEventId(123n, 456, 1)).toEqual("123-456-1");
      expect(makeEventId(123n, 456)).toEqual("123-456");
    });
  });
});
