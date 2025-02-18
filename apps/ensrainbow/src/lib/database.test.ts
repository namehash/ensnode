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

      const testData = [
        { label: "vitalik", labelhash: labelhash("vitalik") },
        { label: "ethereum", labelhash: labelhash("ethereum") },
      ];

      try {
        // Add test records using batch
        const batch = db.batch();
        for (const { label, labelhash } of testData) {
          batch.put(labelHashToBytes(labelhash), label);
        }
        // Add count
        batch.put(LABELHASH_COUNT_KEY, testData.length.toString());
        await batch.write();

        const isValid = await db.validate();
        expect(isValid).toBe(true);
      } finally {
        await db.close();
      }
    });

    it("should detect invalid labelhash format", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add records using batch
        const batch = db.batch();
        // Add labelhash count key
        batch.put(LABELHASH_COUNT_KEY, "1");
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
        // Add records using batch
        const batch = db.batch();
        // Add labelhash count key
        batch.put(LABELHASH_COUNT_KEY, "1");
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
        // Add record using batch
        const batch = db.batch();
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        batch.put(labelHashToBytes(vitalikLabelhash), label);
        await batch.write();

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect incorrect count", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add records using batch
        const batch = db.batch();
        // Add record
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        batch.put(labelHashToBytes(vitalikLabelhash), label);
        // Add incorrect count
        batch.put(LABELHASH_COUNT_KEY, "2");
        await batch.write();

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect when ingestion is in progress", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add records using batch
        const batch = db.batch();
        // Add a valid record
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        batch.put(labelHashToBytes(vitalikLabelhash), label);
        // Add correct count
        batch.put(LABELHASH_COUNT_KEY, "1");
        // Set ingestion in progress flag
        batch.put(INGESTION_IN_PROGRESS_KEY, "true");
        await batch.write();

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

        // Add record using batch
        const batch = db.batch();
        batch.put(labelHashBytes, labelWithNull);
        await batch.write();

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
