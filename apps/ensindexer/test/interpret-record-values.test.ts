import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
} from "@/lib/interpret-record-values";
import { describe, expect, it } from "vitest";

describe("interpretNameRecordValue", () => {
  it("returns null for empty string", () => {
    expect(interpretNameRecordValue("")).toBeNull();
  });

  it("returns null for non-normalized name", () => {
    expect(interpretNameRecordValue("NotNormalized.eth")).toBeNull();
  });

  it("returns value for normalized name", () => {
    expect(interpretNameRecordValue("vitalik.eth")).toBe("vitalik.eth");
  });
});

describe("interpretAddressRecordValue", () => {
  it("returns null for empty string", () => {
    expect(interpretAddressRecordValue("")).toBeNull();
  });

  it("returns null for '0x'", () => {
    expect(interpretAddressRecordValue("0x")).toBeNull();
  });

  it("returns as-is for non-EVM address", () => {
    expect(interpretAddressRecordValue("someNonEvmAddress")).toBe("someNonEvmAddress");
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

  it("interprets null-byte-containing string as deletion", () => {
    expect(interpretAddressRecordValue("example\u0000")).toBeNull();
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
