import { asLiteralName } from "enssdk";
import { type Hex, toHex } from "viem";
import { describe, expect, it } from "vitest";

import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
} from "./interpret-record-values";

describe("interpretNameRecordValue", () => {
  it("returns null for empty string", () => {
    expect(interpretNameRecordValue(asLiteralName(""))).toBeNull();
  });

  it("returns null for non-normalized name", () => {
    expect(interpretNameRecordValue(asLiteralName("NotNormalized.eth"))).toBeNull();
  });

  it("returns value for normalized name", () => {
    expect(interpretNameRecordValue(asLiteralName("vitalik.eth"))).toBe("vitalik.eth");
  });
});

describe("interpretAddressRecordValue", () => {
  it("returns null for empty string (type override)", () => {
    expect(interpretAddressRecordValue("" as Hex)).toBeNull();
  });

  it("returns null for '0x'", () => {
    expect(interpretAddressRecordValue("0x")).toBeNull();
  });

  it("returns null for non-hex values (type override)", () => {
    expect(interpretAddressRecordValue("someNonHexString" as Hex)).toBeNull();
  });

  it("returns lowercase hex for non-EVM address bytes", () => {
    expect(interpretAddressRecordValue(`0x${"05ab".repeat(20).toUpperCase()}`)).toBe(
      `0x${"05ab".repeat(20)}`,
    );
  });

  it("returns null for zeroAddress", () => {
    expect(interpretAddressRecordValue("0x0000000000000000000000000000000000000000")).toBeNull();
  });

  it("returns lowercase address for valid EVM address", () => {
    expect(interpretAddressRecordValue("0x52908400098527886E0F7030069857D2E4169EE7")).toBe(
      "0x52908400098527886e0f7030069857d2e4169ee7",
    );
    expect(interpretAddressRecordValue("0x52908400098527886e0f7030069857d2e4169ee7")).toBe(
      "0x52908400098527886e0f7030069857d2e4169ee7",
    );
  });

  it("represents null-bytes correctly", () => {
    expect(interpretAddressRecordValue(toHex("\u0000"))).toBe("0x00");
  });
});

describe("interpretTextRecordKey", () => {
  it("ignores empty string", () => {
    expect(interpretTextRecordKey("")).toBeNull();
  });

  it("ignores null bytes", () => {
    expect(interpretTextRecordKey("hello\u0000world")).toBeNull();
  });

  it("otherwise works", () => {
    expect(interpretTextRecordKey("hello")).toBe("hello");
  });
});

describe("interpretTextRecordValue", () => {
  it("returns null for empty string", () => {
    expect(interpretTextRecordValue("")).toBeNull();
  });

  it("interprets null-byte-containing string as deletion", () => {
    expect(interpretTextRecordValue("example\u0000")).toBeNull();
  });

  it("otherwise works", () => {
    expect(interpretTextRecordValue("hello")).toBe("hello");
  });
});
