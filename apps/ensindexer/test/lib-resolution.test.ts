import { describe, expect, it } from "vitest";

import { makeRecordsResponseFromIndexedRecords } from "@/lib/lib-resolution";
import type { IndexedResolverRecords, ResolverRecordsSelection } from "@/lib/lib-resolution";
import type { CoinType } from "@ensnode/ensnode-sdk";

describe("lib-resolution", () => {
  describe("makeRecordsResponseFromIndexedRecords", () => {
    const mockRecords: IndexedResolverRecords = {
      name: "test.eth",
      addressRecords: [
        { coinType: 60n, address: "0x123" },
        { coinType: 1001n, address: "0x456" },
      ],
      textRecords: [
        { key: "com.twitter", value: "@test" },
        { key: "avatar", value: "ipfs://..." },
      ],
    };

    it("should return name record when requested", () => {
      const selection: ResolverRecordsSelection = { name: true };
      const result = makeRecordsResponseFromIndexedRecords(selection, mockRecords);
      expect(result).toEqual({ name: { name: "test.eth" } });
    });

    it("should return address records when requested", () => {
      const selection: ResolverRecordsSelection = { addresses: [60, 1001] };
      const result = makeRecordsResponseFromIndexedRecords(selection, mockRecords);
      expect(result).toEqual({
        addresses: {
          60: "0x123",
          1001: "0x456",
        },
      });
    });

    it("should return text records when requested", () => {
      const selection: ResolverRecordsSelection = { texts: ["com.twitter", "avatar"] };
      const result = makeRecordsResponseFromIndexedRecords(selection, mockRecords);
      expect(result).toEqual({
        texts: {
          "com.twitter": "@test",
          avatar: "ipfs://...",
        },
      });
    });

    it("should return null for missing records", () => {
      const selection: ResolverRecordsSelection = {
        addresses: [1 as CoinType],
        texts: ["missing"],
      };
      const result = makeRecordsResponseFromIndexedRecords(selection, mockRecords);
      expect(result).toEqual({
        addresses: {
          1: null,
        },
        texts: {
          missing: null,
        },
      });
    });

    it("should handle multiple record types in one selection", () => {
      const selection: ResolverRecordsSelection = {
        name: true,
        addresses: [60],
        texts: ["com.twitter"],
      };
      const result = makeRecordsResponseFromIndexedRecords(selection, mockRecords);
      expect(result).toEqual({
        name: { name: "test.eth" },
        addresses: {
          60: "0x123",
        },
        texts: {
          "com.twitter": "@test",
        },
      });
    });
  });
});
