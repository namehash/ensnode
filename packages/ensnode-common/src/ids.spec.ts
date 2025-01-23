import { namehash, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { makeEventId, makeResolverId } from "./ids";

describe("ids", () => {
  describe("makeResolverId", () => {
    it("should match snapshot", () => {
      expect(makeResolverId(zeroAddress, namehash("vitalik.eth"))).toMatchSnapshot();
    });
  });

  describe("makeEventId", () => {
    it("should match snapshot", () => {
      expect(makeEventId(123n, 456, 1)).toMatchSnapshot();
      expect(makeEventId(123n, 456)).toMatchSnapshot();
    });
  });
});
