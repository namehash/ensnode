import { labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import type { Labelhash } from "@ensnode/utils";
import { labelhash } from "viem";
import { describe, expect, it } from "vitest";

import { buildRainbowRecord } from "./rainbow-record";

describe("buildRainbowRecord", () => {
  it("should parse a valid line", () => {
    const label = "test-label";
    const validLabelhash = labelhash(label);
    const line = `${validLabelhash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(validLabelhash as Labelhash));
  });

  it("should handle labels with special characters", () => {
    const label = "test🚀label";
    const validLabelhash = labelhash(label);
    const line = `${validLabelhash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(validLabelhash as Labelhash));
  });

  it("should throw on invalid line format", () => {
    const invalidLine = "just-one-column";
    expect(() => buildRainbowRecord(invalidLine)).toThrow("Invalid line format");
  });

  it("should throw on invalid labelhash format", () => {
    const invalidLine = "not-a-hash\tsome-label";
    expect(() => buildRainbowRecord(invalidLine)).toThrow("Invalid labelhash length");
  });

  it("should handle a labelhash that does not match the label", () => {
    const label = "test-label";
    const wrongLabelhash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const line = `${wrongLabelhash}\t${label}`;

    const record = buildRainbowRecord(line);
    expect(record.label).toBe(label);
    expect(record.labelHash).toEqual(labelHashToBytes(wrongLabelhash as Labelhash));
  });
});
