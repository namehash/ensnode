import type { LabelHash } from "@ensnode/ensnode-sdk";
import { labelHashToBytes } from "@ensnode/ensnode-sdk";
import { labelhash } from "viem";
import { describe, expect, it } from "vitest";

import { buildRainbowRecord } from "./rainbow-record";

describe("buildRainbowRecord", () => {
  it("should parse a valid line", () => {
    const label = "test-label";
    const validLabelHash = labelhash(label);
    const line = `${validLabelHash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(validLabelHash as LabelHash));
  });

  it("should handle labels with special characters", () => {
    const label = "test🚀label";
    const validLabelHash = labelhash(label);
    const line = `${validLabelHash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(validLabelHash as LabelHash));
  });

  it("should throw on invalid line format", () => {
    const invalidLine = "just-one-column";
    expect(() => buildRainbowRecord(invalidLine)).toThrow("Invalid line format");
  });

  it("should throw on invalid labelHash format", () => {
    const invalidLine = "not-a-hash\tsome-label";
    expect(() => buildRainbowRecord(invalidLine)).toThrow("Invalid labelHash length");
  });

  it("should handle a labelHash that does not match the label", () => {
    const label = "test-label";
    const wrongLabelHash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const line = `${wrongLabelHash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(wrongLabelHash as LabelHash));
  });
});
