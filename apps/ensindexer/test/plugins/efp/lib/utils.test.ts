import { parseEvmAddress, parseListTokenId } from "@/plugins/efp/lib/utils";
import { describe, expect, it } from "vitest";

describe("EFP utils", () => {
  describe("normalizeAddress", () => {
    it("should parse a valid EVM address", () => {
      const evmAddress = "0x5289fE5daBC021D02FDDf23d4a4DF96F4E0F17EF";

      expect(parseEvmAddress(evmAddress)).toBe("0x5289fe5dabc021d02fddf23d4a4df96f4e0f17ef");
    });

    it("should throw an error for an invalid EVM address", () => {
      const invalidEvmAddress = "0x12345";

      expect(() => parseEvmAddress(invalidEvmAddress)).toThrowError(`Address "0x12345" is invalid.

- Address must be a hex value of 20 bytes (40 hex characters).
- Address must match its checksum counterpart.`);
    });
  });

  describe("parseListTokenId", () => {
    it("should parse a valid List Token ID", () => {
      const listTokenId = "1234567890123456789012345678901234567890123456789012345678901234567890";
      const parsedListTokenId = parseListTokenId(listTokenId);
      expect(parsedListTokenId).toBe(
        1234567890123456789012345678901234567890123456789012345678901234567890n,
      );
    });

    it("should throw an error for an invalid List Token ID", () => {
      const invalidListTokenId = "invalid-token-id";
      expect(() => parseListTokenId(invalidListTokenId)).toThrowError(
        `List Token ID "invalid-token-id" is invalid. It must be a string representation of uint256 value.`,
      );
    });

    it("should throw an error for a negative List Token ID", () => {
      const negativeListTokenId =
        "-1234567890123456789012345678901234567890123456789012345678901234567890";
      expect(() => parseListTokenId(negativeListTokenId)).toThrowError(
        `List Token ID "-1234567890123456789012345678901234567890123456789012345678901234567890" is invalid. It must be a non-negative value.`,
      );
    });
  });
});
