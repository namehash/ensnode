import { describe, expect, it } from "vitest";

import type { DomainId } from "@ensnode/ensnode-sdk";

import { DomainCursor } from "./domain-cursor";

describe("DomainCursor", () => {
  describe("roundtrip encode/decode", () => {
    it("roundtrips with a string value (NAME ordering)", () => {
      const cursor: DomainCursor = {
        id: "0xabc" as DomainId,
        by: "NAME",
        dir: "ASC",
        value: "example",
      };
      expect(DomainCursor.decode(DomainCursor.encode(cursor))).toEqual(cursor);
    });

    it("roundtrips with a bigint value (REGISTRATION_TIMESTAMP ordering)", () => {
      const cursor: DomainCursor = {
        id: "0xabc" as DomainId,
        by: "REGISTRATION_TIMESTAMP",
        dir: "DESC",
        value: 1234567890n,
      };
      expect(DomainCursor.decode(DomainCursor.encode(cursor))).toEqual(cursor);
    });

    it("roundtrips with a bigint value (REGISTRATION_EXPIRY ordering)", () => {
      const cursor: DomainCursor = {
        id: "0xdef" as DomainId,
        by: "REGISTRATION_EXPIRY",
        dir: "ASC",
        value: 9999999999n,
      };
      expect(DomainCursor.decode(DomainCursor.encode(cursor))).toEqual(cursor);
    });

    it("roundtrips with a null value", () => {
      const cursor: DomainCursor = {
        id: "0xabc" as DomainId,
        by: "REGISTRATION_TIMESTAMP",
        dir: "ASC",
        value: null,
      };
      expect(DomainCursor.decode(DomainCursor.encode(cursor))).toEqual(cursor);
    });
  });

  describe("decode error handling", () => {
    it("throws on garbage input", () => {
      expect(() => DomainCursor.decode("not-valid-base64!!!")).toThrow("Invalid cursor");
    });

    it("throws on valid base64 but invalid json", () => {
      const notJson = Buffer.from("not json", "utf8").toString("base64");
      expect(() => DomainCursor.decode(notJson)).toThrow("Invalid cursor");
    });

    it("throws on empty string", () => {
      expect(() => DomainCursor.decode("")).toThrow("Invalid cursor");
    });
  });
});
