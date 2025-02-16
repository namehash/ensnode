import { tmpdir } from "os";
import { join } from "path";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import { mkdtemp, rm } from "fs/promises";
import { labelhash } from "viem";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ENSRainbowDB,
  INGESTION_IN_PROGRESS_KEY,
  LABELHASH_COUNT_KEY,
  parseNonNegativeInteger,
} from "./database";

describe("Database", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-database"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("validate", () => {
    it("should detect an empty database", async () => {
      const db = await ENSRainbowDB.create(tempDir);
      try {
        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should validate a database with valid records", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      const testData = [
        { label: "vitalik", labelhash: labelhash("vitalik") },
        { label: "ethereum", labelhash: labelhash("ethereum") },
      ];

      try {
        // Add test records
        for (const { label, labelhash } of testData) {
          await db.put(labelHashToBytes(labelhash), label);
        }

        // Add count
        await db.put(LABELHASH_COUNT_KEY, testData.length.toString());

        const isValid = await db.validate();
        expect(isValid).toBe(true);
      } finally {
        await db.close();
      }
    });

    it("should detect invalid labelhash format", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add labelhash count key
        await db.put(LABELHASH_COUNT_KEY, "1");

        // Add record with invalid labelhash format
        const invalidLabelhash = new Uint8Array([1, 2, 3]); // Too short
        await db.put(invalidLabelhash, "test");

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect labelhash mismatch", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add labelhash count key
        await db.put(LABELHASH_COUNT_KEY, "1");

        // Add record with mismatched labelhash
        const label = "vitalik";
        const wrongLabelhash = labelhash("ethereum");
        await db.put(labelHashToBytes(wrongLabelhash), label);

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect missing count key", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add record without count
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        await db.put(labelHashToBytes(vitalikLabelhash), label);

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect incorrect count", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add record
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        await db.put(labelHashToBytes(vitalikLabelhash), label);

        // Add incorrect count
        await db.put(LABELHASH_COUNT_KEY, "2");

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect when ingestion is in progress", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add a valid record
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        await db.put(labelHashToBytes(vitalikLabelhash), label);

        // Add correct count
        await db.put(LABELHASH_COUNT_KEY, "1");

        // Set ingestion in progress flag
        await db.put(INGESTION_IN_PROGRESS_KEY, "true");

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });
  });

  describe("LevelDB operations", () => {
    it("should handle values containing null bytes", async () => {
      const db = await ENSRainbowDB.create(tempDir);
      try {
        const labelWithNull = "test\0label";
        const labelWithNullLabelhash = labelhash(labelWithNull);
        const labelHashBytes = labelHashToBytes(labelWithNullLabelhash);

        await db.put(labelHashBytes, labelWithNull);
        const retrieved = await db.get(labelHashBytes);
        expect(retrieved).toBe(labelWithNull);
      } finally {
        await db.close();
      }
    });
  });
});

describe("parseNonNegativeInteger", () => {
  it("valid non-negative integers", () => {
    expect(parseNonNegativeInteger("0")).toBe(0);
    expect(parseNonNegativeInteger("42")).toBe(42);
    expect(parseNonNegativeInteger("1000000")).toBe(1000000);
  });

  it("invalid inputs return null", () => {
    // Non-integer numbers
    expect(parseNonNegativeInteger("3.14")).toBeNull();
    expect(parseNonNegativeInteger("0.5")).toBeNull();

    // Negative numbers
    expect(parseNonNegativeInteger("-5")).toBeNull();
    expect(parseNonNegativeInteger("-0")).toBeNull();

    // Non-numeric strings
    expect(parseNonNegativeInteger("abc")).toBeNull();
    expect(parseNonNegativeInteger("")).toBeNull();
    expect(parseNonNegativeInteger(" ")).toBeNull();

    // Mixed content
    expect(parseNonNegativeInteger("42abc")).toBeNull();
    expect(parseNonNegativeInteger("abc42")).toBeNull();
  });
});
