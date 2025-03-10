import { describe, expect, it } from "vitest";
import {
  EncodedLabelhash,
  InvalidLabelhashError,
  parseEncodedLabelhash,
  parseLabelhash,
} from "./utils";

describe("parseLabelhash", () => {
  it("should normalize a valid labelhash", () => {
    // 64 zeros
    expect(parseLabelhash("0000000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );

    // 64 zeros with 0x prefix
    expect(
      parseLabelhash("0x0000000000000000000000000000000000000000000000000000000000000000"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");

    // 63 zeros
    expect(parseLabelhash("000000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );

    // 63 zeros with 0x prefix
    expect(
      parseLabelhash("0x000000000000000000000000000000000000000000000000000000000000000"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");

    // 64 characters
    expect(parseLabelhash("A000000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0xa000000000000000000000000000000000000000000000000000000000000000",
    );

    // 63 characters
    expect(parseLabelhash("A00000000000000000000000000000000000000000000000000000000000000")).toBe(
      "0x0a00000000000000000000000000000000000000000000000000000000000000",
    );
  });

  it("should throw for invalid labelhash", () => {
    // Invalid characters
    expect(() =>
      parseLabelhash("0xG000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(InvalidLabelhashError);

    // Too short
    expect(() => parseLabelhash("0x00000")).toThrow(InvalidLabelhashError);

    // Too long
    expect(() =>
      parseLabelhash("0x00000000000000000000000000000000000000000000000000000000000000000"),
    ).toThrow(InvalidLabelhashError);
  });
});

describe("parseEncodedLabelhash", () => {
  it("should normalize a valid encoded labelhash", () => {
    // 64 zeros
    expect(
      parseEncodedLabelhash("[0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");

    // 64 zeros with 0x prefix
    expect(
      parseEncodedLabelhash("[0x0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");

    // 63 zeros
    expect(
      parseEncodedLabelhash("[000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");

    // 63 zeros with 0x prefix
    expect(
      parseEncodedLabelhash("[0x000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");

    // 64 characters
    expect(
      parseEncodedLabelhash("[A000000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0xa000000000000000000000000000000000000000000000000000000000000000");

    // 64 characters with 0x prefix
    expect(
      parseEncodedLabelhash("[A00000000000000000000000000000000000000000000000000000000000000]"),
    ).toBe("0x0a00000000000000000000000000000000000000000000000000000000000000");
  });

  it("should throw for invalid encoded labelhash", () => {
    // Not enclosed in brackets
    expect(() =>
      parseEncodedLabelhash(
        "0000000000000000000000000000000000000000000000000000000000000000" as EncodedLabelhash,
      ),
    ).toThrow(InvalidLabelhashError);
    expect(() =>
      parseEncodedLabelhash(
        "[0000000000000000000000000000000000000000000000000000000000000000" as EncodedLabelhash,
      ),
    ).toThrow(InvalidLabelhashError);
    expect(() =>
      parseEncodedLabelhash(
        "0000000000000000000000000000000000000000000000000000000000000000]" as EncodedLabelhash,
      ),
    ).toThrow(InvalidLabelhashError);

    // 62 zeros - too short
    expect(() =>
      parseEncodedLabelhash("[00000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(InvalidLabelhashError);

    // 65 zeros - too long
    expect(() =>
      parseEncodedLabelhash("[00000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(InvalidLabelhashError);

    // wrong 0X prefix
    expect(() =>
      parseEncodedLabelhash("[0X0000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(InvalidLabelhashError);

    // Invalid content
    expect(() => parseEncodedLabelhash("[00000]")).toThrow(InvalidLabelhashError);
    expect(() =>
      parseEncodedLabelhash("[0xG000000000000000000000000000000000000000000000000000000000000000]"),
    ).toThrow(InvalidLabelhashError);
  });
});
