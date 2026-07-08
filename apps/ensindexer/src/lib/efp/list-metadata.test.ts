import { describe, expect, it } from "vitest";

import { interpretMetadataValue } from "./list-metadata";

describe("interpretMetadataValue", () => {
  it("returns the lower-cased address for an exactly-20-byte value", () => {
    expect(interpretMetadataValue(`0x${"AB".repeat(20)}`)).toBe(`0x${"ab".repeat(20)}`);
  });

  it("returns null for an empty value", () => {
    expect(interpretMetadataValue("0x")).toBeNull();
  });

  it("returns null for a value shorter than 20 bytes", () => {
    expect(interpretMetadataValue(`0x${"ab".repeat(10)}`)).toBeNull();
  });

  it("returns null for a value longer than 20 bytes (e.g. an abi-encoded address)", () => {
    expect(interpretMetadataValue(`0x${"ab".repeat(32)}`)).toBeNull();
  });
});
