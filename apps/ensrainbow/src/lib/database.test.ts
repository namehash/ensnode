import { tmpdir } from "os";
import { join } from "path";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import { ClassicLevel } from "classic-level";
import { mkdtemp, rm } from "fs/promises";
import { ByteArray, labelhash } from "viem";
import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import {
  ENSRainbowDB,
  IngestionStatus,
  SCHEMA_VERSION,
  SYSTEM_KEY_INGESTION_STATUS,
  SYSTEM_KEY_PRECALCULATED_RAINBOW_RECORD_COUNT,
  SYSTEM_KEY_SCHEMA_VERSION,
  isRainbowRecordKey,
  isSystemKey,
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

        await db.setPrecalculatedRainbowRecordCount(testDataLabels.length);

        await db.markIngestionFinished();

        const isValid = await db.validate();
        expect(isValid).toBe(true);
      } finally {
        await db.close();
      }
    });

    it("should detect invalid labelhash format", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Set precalculated rainbow record count key
        db.setPrecalculatedRainbowRecordCount(1);

        // Add records using batch
        const batch = db.batch();
        // Add rainbow record with invalid labelhash format
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
        // Set precalculated rainbow record count key
        db.setPrecalculatedRainbowRecordCount(1);

        // Add records using batch
        const batch = db.batch();
        // Add rainbow record with mismatched labelhash
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
        // Add incorrect precalculated rainbow record count
        db.setPrecalculatedRainbowRecordCount(2);

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect when ingestion is unfinished", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add a valid record
        const label = "vitalik";
        await db.addRainbowRecord(label);
        // Set precalculated rainbow record count key
        db.setPrecalculatedRainbowRecordCount(1);
        // Set ingestion unfinished flag
        await db.markIngestionUnfinished();

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect when ingestion has never been started", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add a valid record
        const label = "vitalik";
        await db.addRainbowRecord(label);
        // Set precalculated rainbow record count key
        db.setPrecalculatedRainbowRecordCount(1);
        // Don't set any ingestion status

        const isValid = await db.validate();
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should validate successfully when ingestion is marked as done", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add a valid record
        const label = "vitalik";
        await db.addRainbowRecord(label);
        // Set precalculated rainbow record count key
        db.setPrecalculatedRainbowRecordCount(1);
        // Mark ingestion as done
        await db.markIngestionFinished();

        const isValid = await db.validate();
        expect(isValid).toBe(true);
      } finally {
        await db.close();
      }
    });

    it("should skip labelhash verification in lite mode", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        // Add rainbow record with mismatched labelhash (would fail in full validation)
        const label = "vitalik";
        const wrongLabelhash = labelhash("ethereum");
        const batch = db.batch();
        batch.put(labelHashToBytes(wrongLabelhash), label);
        await batch.write();
        await db.setPrecalculatedRainbowRecordCount(1);
        await db.markIngestionFinished();

        // Should pass in lite mode despite hash mismatch
        const isValidLite = await db.validate({ lite: true });
        expect(isValidLite).toBe(true);

        // Should fail in full validation mode
        const isValidFull = await db.validate();
        expect(isValidFull).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect absence of count key", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        await db.addRainbowRecord("test");

        // Should fail in lite mode due to invalid format
        const isValid = await db.validate({ lite: true });
        expect(isValid).toBe(false);

        // Should fail in full validation mode
        const isValidFull = await db.validate();
        expect(isValidFull).toBe(false);
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

        const retrieved = await db.getLabel(labelHashBytes);
        expect(retrieved).toBe(labelWithNull);
      } finally {
        await db.close();
      }
    });
  });

  describe("getIngestionStatus", () => {
    it("should return Unstarted when no status is set", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        const status = await db.getIngestionStatus();
        expect(status).toBe(IngestionStatus.Unstarted);
      } finally {
        await db.close();
      }
    });

    it("should return Unfinished when status is set to Unfinished", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        await db.markIngestionUnfinished();
        const status = await db.getIngestionStatus();
        expect(status).toBe(IngestionStatus.Unfinished);
      } finally {
        await db.close();
      }
    });

    it("should return Finished when status is set to Finished", async () => {
      const db = await ENSRainbowDB.create(tempDir);

      try {
        await db.markIngestionFinished();
        const status = await db.getIngestionStatus();
        expect(status).toBe(IngestionStatus.Finished);
      } finally {
        await db.close();
      }
    });

    it("should throw an error when an invalid status is found in the database", async () => {
      let ensDb: ENSRainbowDB | null = null;

      try {
        // Create an ENSRainbowDB instance
        ensDb = await ENSRainbowDB.create(tempDir);

        // Use batch to write an invalid status to the database
        const batch = ensDb.batch();
        batch.put(SYSTEM_KEY_INGESTION_STATUS, "invalid_status");
        await batch.write();

        // The method should throw an error
        await expect(ensDb.getIngestionStatus()).rejects.toThrow(
          'Invalid ingestion status: "invalid_status". Valid values are: unstarted, unfinished, finished',
        );
      } finally {
        // Close the database if it was opened
        if (ensDb) {
          await ensDb.close();
        }
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

const TEST_DB_PATH = "test-db";

describe("schema version", () => {
  test("new database has correct schema version", async () => {
    const db = await ENSRainbowDB.create(TEST_DB_PATH);
    try {
      const version = await db.getDatabaseSchemaVersion();
      expect(version).toBe(SCHEMA_VERSION);
    } finally {
      await db.close();
      await rm(TEST_DB_PATH, { recursive: true, force: true });
    }
  });

  test("can set and get schema version", async () => {
    const db = await ENSRainbowDB.create(TEST_DB_PATH);
    try {
      // Test setting a new version
      const newVersion = SCHEMA_VERSION + 1;
      await db.setDatabaseSchemaVersion(newVersion);
      const version = await db.getDatabaseSchemaVersion();
      expect(version).toBe(newVersion);
    } finally {
      await db.close();
      await rm(TEST_DB_PATH, { recursive: true, force: true });
    }
  });

  test("rejects invalid schema versions", async () => {
    const db = await ENSRainbowDB.create(TEST_DB_PATH);
    try {
      // Test negative version
      await expect(db.setDatabaseSchemaVersion(-1)).rejects.toThrow("Invalid schema version");

      // Test non-integer version
      await expect(db.setDatabaseSchemaVersion(1.5)).rejects.toThrow("Invalid schema version");
    } finally {
      await db.close();
      await rm(TEST_DB_PATH, { recursive: true, force: true });
    }
  });

  test("validate fails if schema version doesn't match", async () => {
    const db = await ENSRainbowDB.create(TEST_DB_PATH);
    try {
      // Set a different schema version
      await db.setDatabaseSchemaVersion(SCHEMA_VERSION + 1);

      // Validation should fail due to version mismatch
      const isValid = await db.validate();
      expect(isValid).toBe(false);

      const isValidLite = await db.validate({ lite: true });
      expect(isValidLite).toBe(false);
    } finally {
      await db.close();
      await rm(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
});

describe("isRainbowRecordKey", () => {
  test("returns true for 32-byte ByteArray", () => {
    const thirtyTwoByteArray = new Uint8Array(32).fill(1);
    expect(isRainbowRecordKey(thirtyTwoByteArray)).toBe(true);
  });

  test("returns false for ByteArray with length other than 32", () => {
    const thirtyOneByteArray = new Uint8Array(31).fill(1);
    const thirtyThreeByteArray = new Uint8Array(33).fill(1);
    const emptyByteArray = new Uint8Array(0);

    expect(isRainbowRecordKey(thirtyOneByteArray)).toBe(false);
    expect(isRainbowRecordKey(thirtyThreeByteArray)).toBe(false);
    expect(isRainbowRecordKey(emptyByteArray)).toBe(false);
  });
});

describe("isSystemKey", () => {
  test("returns true for all system keys", () => {
    // Use the exported system keys
    expect(isSystemKey(SYSTEM_KEY_PRECALCULATED_RAINBOW_RECORD_COUNT)).toBe(true);
    expect(isSystemKey(SYSTEM_KEY_INGESTION_STATUS)).toBe(true);
    expect(isSystemKey(SYSTEM_KEY_SCHEMA_VERSION)).toBe(true);
  });

  test("returns false for rainbow record keys (32-byte ByteArray)", () => {
    const rainbowRecordKey = new Uint8Array(32).fill(1);
    expect(isSystemKey(rainbowRecordKey)).toBe(false);
  });

  test("returns false for non-system keys with length other than 32", () => {
    // Create a non-system key with length other than 32
    const nonSystemKey = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    expect(isSystemKey(nonSystemKey)).toBe(false);
  });
});
