import { hexToBigInt, labelhash, namehash } from "viem";
import { describe, expect, it } from "vitest";
import { decodeTokenIdToLabelhash, decodeTokenIdToNode } from "../src/lib/ens-helpers";

describe("ens-helpers", () => {
  describe("decodeTokenIdToLabelhash", () => {
    it("should decode a tokenId to a labelhash", () => {
      const decoded = labelhash("example");
      const encoded = hexToBigInt(decoded, { size: 32 });
      expect(decodeTokenIdToLabelhash(encoded)).toEqual(decoded);
    });
  });

  describe("decodeTokenIdToNode", () => {
    it("should decode a tokenId to a node", () => {
      const decoded = namehash("example.eth");
      const encoded = hexToBigInt(decoded, { size: 32 });
      expect(decodeTokenIdToNode(encoded)).toEqual(decoded);
    });
  });
});
