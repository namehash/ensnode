import type { DomainId } from "enssdk";
import { describe, expect, it } from "vitest";

import { type DomainCursor, DomainCursors } from "./domain-cursor";

describe("DomainCursor", () => {
  describe("roundtrip encode/decode", () => {
    it("roundtrips with a string value (NAME ordering)", () => {
      const cursor: DomainCursor = {
        id: "0xabc" as DomainId,
        by: "NAME",
        dir: "ASC",
        value: "example",
      };
      expect(DomainCursors.decode(DomainCursors.encode(cursor))).toEqual(cursor);
    });

    it("roundtrips with a bigint value (REGISTRATION_TIMESTAMP ordering)", () => {
      const cursor: DomainCursor = {
        id: "0xabc" as DomainId,
        by: "REGISTRATION_TIMESTAMP",
        dir: "DESC",
        value: 1234567890n,
      };
      expect(DomainCursors.decode(DomainCursors.encode(cursor))).toEqual(cursor);
    });

    it("roundtrips with a bigint value (REGISTRATION_EXPIRY ordering)", () => {
      const cursor: DomainCursor = {
        id: "0xdef" as DomainId,
        by: "REGISTRATION_EXPIRY",
        dir: "ASC",
        value: 9999999999n,
      };
      expect(DomainCursors.decode(DomainCursors.encode(cursor))).toEqual(cursor);
    });

    it("roundtrips with a null value", () => {
      const cursor: DomainCursor = {
        id: "0xabc" as DomainId,
        by: "REGISTRATION_TIMESTAMP",
        dir: "ASC",
        value: null,
      };
      expect(DomainCursors.decode(DomainCursors.encode(cursor))).toEqual(cursor);
    });
  });

  describe("decode error handling", () => {
    it("throws on garbage input", () => {
      expect(() => DomainCursors.decode("not-valid-base64!!!")).toThrow("Invalid cursor");
    });

    it("throws on valid base64 but invalid json", () => {
      const notJson = Buffer.from("not json", "utf8").toString("base64");
      expect(() => DomainCursors.decode(notJson)).toThrow("Invalid cursor");
    });

    it("throws on empty string", () => {
      expect(() => DomainCursors.decode("")).toThrow("Invalid cursor");
    });
  });
});
