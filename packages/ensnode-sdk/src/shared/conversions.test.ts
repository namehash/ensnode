import { describe, expect, it } from "vitest";
import { deserializeChainId, deserializeDatetime, deserializeUrl } from "./deserialize";
import { serializeChainId, serializeDatetime, serializeUrl } from "./serialize";

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
      const url = new URL("https://admin.ensnode.io");

      url.searchParams.set("connection", "https://indexer.alpha.ensnode.io");

      expect(serializeUrl(url)).toBe(
        "https://admin.ensnode.io/?connection=https%3A%2F%2Findexer.alpha.ensnode.io",
      );
    });
  });

  describe("deserialization", () => {
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
        "https://admin.ensnode.io/?connection=https%3A%2F%2Findexer.alpha.ensnode.io";

      const resultUrl = new URL("https://admin.ensnode.io");

      resultUrl.searchParams.set("connection", "https://indexer.alpha.ensnode.io");

      expect(deserializeUrl(serializedUrl)).toStrictEqual(resultUrl);
    });

    it("refuses to deserialize URL for invalid input", () => {
      expect(() => deserializeUrl("example.com")).toThrowError(/must be a valid URL string/i);
      expect(() => deserializeUrl("https://")).toThrowError(/must be a valid URL string/i);
      expect(() => deserializeUrl("//example.com")).toThrowError(/must be a valid URL string/i);
    });
  });
});
