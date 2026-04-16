import { describe, expect, it } from "vitest";

import {
  parseEncodedLabelHash,
  parseLabelHash,
  parseLabelHashOrEncodedLabelHash,
} from "./parse-labelhash";

describe("parseLabelHash", () => {
  it("normalizes a valid 64-char labelHash with 0x prefix", () => {
    expect(
      parseLabelHash("0x0000000000000000000000000000000000000000000000000000000000000000"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("adds 0x prefix when missing (64 hex chars)", () => {
    expect(parseLabelHash("0000000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("pads a 63-char hex string to 64 chars (0x prefix present)", () => {
    expect(
      parseLabelHash("0x000000000000000000000000000000000000000000000000000000000000000"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("pads a 63-char hex string to 64 chars (no 0x prefix)", () => {
    expect(parseLabelHash("000000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("normalizes uppercase hex to lowercase (64 chars)", () => {
    expect(parseLabelHash("A000000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0xa000000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("pads and normalizes uppercase hex (63 chars)", () => {
    expect(parseLabelHash("A00000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0x0a00000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("normalizes a known labelhash (vitalik, uppercase input)", () => {
    expect(
      parseLabelHash("0xAf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"),
    ).toBe("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc");
  });

  it("normalizes a known labelhash (vitalik, no 0x prefix)", () => {
    expect(parseLabelHash("af2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc")).toBe(
      "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
    );
  });

  it("throws for non-hex characters", () => {
    expect(() =>
      parseLabelHash("0xG000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(Error);
  });

  it("throws for too short input (e.g. 5 hex chars)", () => {
    expect(() => parseLabelHash("0x00000")).toThrow(Error);
  });

  it("throws for too long input (65 hex chars)", () => {
    expect(() =>
      parseLabelHash("0x00000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(Error);
  });

  it("throws for 62-char hex (even, but wrong length)", () => {
    expect(() =>
      parseLabelHash("0x00000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(Error);
  });

  it("throws for uppercase 0X prefix", () => {
    expect(() =>
      parseLabelHash("0X0000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(Error);
  });

  it("throws for empty string", () => {
    expect(() => parseLabelHash("")).toThrow(Error);
  });
});

describe("parseEncodedLabelHash", () => {
  it("normalizes a valid encoded labelHash with 64 hex chars", () => {
    expect(
      parseEncodedLabelHash("[0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("normalizes an encoded labelHash with 0x prefix inside brackets", () => {
    expect(
      parseEncodedLabelHash("[0x0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("pads a 63-char encoded labelHash (no 0x prefix inside)", () => {
    expect(
      parseEncodedLabelHash("[000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("pads a 63-char encoded labelHash (0x prefix inside)", () => {
    expect(
      parseEncodedLabelHash("[0x000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("normalizes uppercase encoded labelHash (64 chars)", () => {
    expect(
      parseEncodedLabelHash("[A000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0xa000000000000000000000000000000000000000000000000000000000000000");
  });

  it("pads and normalizes uppercase encoded labelHash (63 chars)", () => {
    expect(
      parseEncodedLabelHash("[A00000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0a00000000000000000000000000000000000000000000000000000000000000");
  });

  it("normalizes a known encoded labelhash (vitalik)", () => {
    expect(
      parseEncodedLabelHash("[af2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc]"),
    ).toBe("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc");
  });

  it("throws when missing opening bracket", () => {
    expect(() =>
      parseEncodedLabelHash("0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(Error);
  });

  it("throws when missing closing bracket", () => {
    expect(() =>
      parseEncodedLabelHash("[0000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(Error);
  });

  it("throws when missing both brackets", () => {
    expect(() =>
      parseEncodedLabelHash("0000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(Error);
  });

  it("throws for 62 hex chars inside brackets (too short, even length)", () => {
    expect(() =>
      parseEncodedLabelHash("[00000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(Error);
  });

  it("throws for 65 hex chars inside brackets (too long)", () => {
    expect(() =>
      parseEncodedLabelHash("[00000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(Error);
  });

  it("throws for uppercase 0X prefix inside brackets", () => {
    expect(() =>
      parseEncodedLabelHash("[0X0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(Error);
  });

  it("throws for invalid content inside brackets", () => {
    expect(() => parseEncodedLabelHash("[00000]")).toThrow(Error);
    expect(() =>
      parseEncodedLabelHash("[0xG000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(Error);
  });

  it("throws for empty string", () => {
    expect(() => parseEncodedLabelHash("")).toThrow(Error);
  });

  it("throws for empty brackets", () => {
    expect(() => parseEncodedLabelHash("[]")).toThrow(Error);
  });
});

describe("parseLabelHashOrEncodedLabelHash", () => {
  it("parses a plain labelHash", () => {
    expect(
      parseLabelHashOrEncodedLabelHash(
        "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
      ),
    ).toBe("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc");
  });

  it("parses an encoded labelHash", () => {
    expect(
      parseLabelHashOrEncodedLabelHash(
        "[af2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc]",
      ),
    ).toBe("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc");
  });

  it("normalizes a plain labelHash missing 0x prefix", () => {
    expect(
      parseLabelHashOrEncodedLabelHash(
        "af2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
      ),
    ).toBe("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc");
  });

  it("normalizes a plain labelHash with uppercase chars", () => {
    expect(
      parseLabelHashOrEncodedLabelHash(
        "0xAf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
      ),
    ).toBe("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc");
  });

  it("throws for invalid input", () => {
    expect(() => parseLabelHashOrEncodedLabelHash("0xinvalid")).toThrow(Error);
  });
});
