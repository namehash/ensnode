import { makeEventId, makeRegistrationId, makeResolverId } from "@/lib/ids";
import { labelhash, namehash, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

describe("ids", () => {
  describe("makeResolverId", () => {
    it("should match snapshot", () => {
      expect(makeResolverId(zeroAddress, namehash("vitalik.eth"))).toEqual(
        "0x0000000000000000000000000000000000000000-0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      );
    });
  });

  describe("makeEventId", () => {
    it("should include token id if available", () => {
      expect(makeEventId(undefined, 123n, 456, 1)).toEqual("123-456-1");
      expect(makeEventId(undefined, 123n, 456)).toEqual("123-456");
    });

    it("should include prefix when provided", () => {
      expect(makeEventId("linea.eth", 123n, 456)).toEqual("linea.eth-123-456");
    });

    it("should not include prefix if not provided", () => {
      expect(makeEventId(undefined, 123n, 456)).toEqual("123-456");
    });
  });

  describe("makeRegistrationId", () => {
    it("should use labelHash when plugin name is `root` to ensure subgraph compatibility", () => {
      expect(makeRegistrationId("root", labelhash("vitalik"), namehash("vitalik.eth"))).toEqual(
        labelhash("vitalik"),
      );
    });

    it("should use node when plugin name is not `root`", () => {
      expect(
        makeRegistrationId("lineanames", labelhash("vitalik"), namehash("vitalik.linea.eth")),
      ).toEqual(namehash("vitalik.linea.eth"));
    });
  });
});
