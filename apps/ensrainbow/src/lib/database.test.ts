import { tmpdir } from "os";
import { join } from "path";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk";
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

      const testDataLabels = ["vitalik", "ethereum"];

      try {
        for (const label of testDataLabels) {
          await db.addRainbowRecord(label);
        }

        await db.setRainbowRecordCount(testDataLabels.length);

        const isValid = await db.validate();
        expect(isValid).toBe(true);
      } finally {
        await db.close();
      }
    });

    it("should detect invalid labelhash format", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Set labelhash count key
        db.setRainbowRecordCount(1);

        // Add records using batch
        const batch = db.batch();
        // Add record with invalid labelhash format
        const invalidLabelhash = new Uint8Array([1, 2, 3]); // Too short
        batch.put(invalidLabelhash, "test");
        await batch.write();

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect labelhash mismatch", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Set labelhash count key
        db.setRainbowRecordCount(1);

        // Add records using batch
        const batch = db.batch();
        // Add record with mismatched labelhash
        const label = "vitalik";
        const wrongLabelhash = labelhash("ethereum");
        batch.put(labelHashToBytes(wrongLabelhash), label);
        await batch.write();

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect missing count key", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add record
        const label = "vitalik";
        await db.addRainbowRecord(label);

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
        await db.addRainbowRecord(label);
        // Add incorrect count
        db.setRainbowRecordCount(2);

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
        await db.addRainbowRecord(label);
        // Set labelhash count key
        db.setRainbowRecordCount(1);
        // Set ingestion in progress flag
        await db.markIngestionStarted();

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

        // Add record
        await db.addRainbowRecord(labelWithNull);

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

  it("invalid inputs throw errors", () => {
    // Non-integer numbers
    expect(() => parseNonNegativeInteger("3.14")).toThrow("is not an integer");
    expect(() => parseNonNegativeInteger("0.5")).toThrow("is not an integer");

    // Negative numbers
    expect(() => parseNonNegativeInteger("-5")).toThrow("is not a non-negative integer");
    expect(() => parseNonNegativeInteger("-0")).toThrow(
      "Negative zero is not a valid non-negative integer",
    );

    // Non-numeric strings
    expect(() => parseNonNegativeInteger("abc")).toThrow("is not a valid number");
    expect(() => parseNonNegativeInteger("")).toThrow("Input cannot be empty");
    expect(() => parseNonNegativeInteger(" ")).toThrow("Input cannot be empty");

    // Mixed content
    expect(() => parseNonNegativeInteger("42abc")).toThrow("is not a valid number");
    expect(() => parseNonNegativeInteger("abc42")).toThrow("is not a valid number");
  });
});
