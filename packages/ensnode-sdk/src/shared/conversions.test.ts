import { describe, expect, it } from "vitest";
import {
  deserializeBlockRef,
  deserializeChainId,
  deserializeDatetime,
  deserializeUrl,
} from "./deserialize";
import { serializeChainId, serializeDatetime, serializeUrl } from "./serialize";
import type { BlockRef } from "./types";

describe("ENSIndexer: Shared", () => {
  describe("serialization", () => {
    it("can serialize ChainId into its string representation", () => {
      expect(serializeChainId(8543)).toBe("8543");
    });

    it("can serialize Datetime into an ISO 8601 string representation", () => {
      const datetime = new Date(Date.UTC(2020, 1, 2, 2, 22, 59, 123));

      expect(serializeDatetime(datetime)).toBe("2020-02-02T02:22:59.123Z");
    });

    it("can serialize URL into its string representation", () => {
      const url = new URL("https://admin.ensnode.io/status");

      url.searchParams.set("ensnode", "https://indexer.alpha.ensnode.io");

      expect(serializeUrl(url)).toBe(
        "https://admin.ensnode.io/status?ensnode=https%3A%2F%2Findexer.alpha.ensnode.io",
      );
    });
  });

  describe("deserialization", () => {
    it("can deserialize BlockRef", () => {
      // arrange
      const serializedBlockRef = {
        timestamp: 1754390708,
        number: 123,
      } satisfies BlockRef;

      // act
      const result = deserializeBlockRef(serializedBlockRef);

      // assert
      expect(result).toStrictEqual(serializedBlockRef);
    });

    it("refuses to deserialize SerializedBlockRef for invalid input", () => {
      expect(() =>
        deserializeBlockRef(
          {
            timestamp: 21.5,
            number: 123,
          } satisfies BlockRef,
          "Block Ref",
        ),
      ).toThrowError(`Cannot deserialize BlockRef:
✖ Block Ref.timestamp must be an integer.
  → at timestamp`);
    });

    it("can deserialize ChainId from its string representation", () => {
      expect(deserializeChainId("8543")).toStrictEqual(8543);
    });

    it("refuses to deserialize ChainId for invalid input", () => {
      expect(() => deserializeChainId("-8543")).toThrowError(`Cannot deserialize ChainId:
✖ The numeric value represented by Chain ID String must be a positive integer (>0).`);

      expect(() => deserializeChainId("8543.5")).toThrowError(`Cannot deserialize ChainId:
✖ The numeric value represented by Chain ID String must be an integer.`);

      expect(() => deserializeChainId("vitalik")).toThrowError(`Cannot deserialize ChainId:
✖ Chain ID String must represent a positive integer (>0).`);
    });

    it("can deserialize Datetime from an ISO 8601 string representation", () => {
      const resultDatetime = new Date(Date.UTC(2020, 1, 2, 2, 22, 59, 123));

      expect(deserializeDatetime("2020-02-02T02:22:59.123Z")).toStrictEqual(resultDatetime);
    });

    it("refuses to deserialize Datetime for invalid input", () => {
      expect(() =>
        deserializeDatetime("202-02-02T02:22:59.123Z"),
      ).toThrowError(`Cannot deserialize Datetime:
✖ Datetime string must be a string in ISO 8601 format.`);

      expect(() =>
        deserializeDatetime(123 as unknown as string),
      ).toThrowError(`Cannot deserialize Datetime:
✖ Datetime string must be a string in ISO 8601 format.`);
    });

    it("can deserialize URL from its string representation", () => {
      const serializedUrl =
        "https://admin.ensnode.io/status?ensnode=https%3A%2F%2Findexer.alpha.ensnode.io";

      const resultUrl = new URL("https://admin.ensnode.io/status");

      resultUrl.searchParams.set("ensnode", "https://indexer.alpha.ensnode.io");

      expect(deserializeUrl(serializedUrl)).toStrictEqual(resultUrl);
    });

    it("refuses to deserialize URL for invalid input", () => {
      const errorMessage = `Cannot deserialize URL:
✖ Value must be a valid URL string (e.g., http://localhost:8080 or https://example.com).`;
      expect(() => deserializeUrl("example.com")).toThrowError(errorMessage);

      expect(() => deserializeUrl("https://")).toThrowError(errorMessage);

      expect(() => deserializeUrl("//example.com")).toThrowError(errorMessage);
    });
  });
});
