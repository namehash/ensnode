import { tmpdir } from "os";
import { join } from "path";
import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import { mkdtemp, rm } from "fs/promises";
import { labelhash } from "viem";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLogger } from "../utils/logger.js";
import {
  INGESTION_IN_PROGRESS_KEY,
  LABELHASH_COUNT_KEY,
  createDatabase,
  validate,
} from "./database.js";

describe("Database", () => {
  let tempDir: string;
  let log = createLogger("error");

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-database"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("validate", () => {
    it("should detect an empty database", async () => {
      const db = await createDatabase(tempDir);
      try {
        const isValid = await validate(db, log);
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should validate a database with valid records", async () => {
      const db = await createDatabase(tempDir);

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

        const isValid = await validate(db, log);
        expect(isValid).toBe(true);
      } finally {
        await db.close();
      }
    });

    it("should detect invalid labelhash format", async () => {
      const db = await createDatabase(tempDir);

      try {
        // Add labelhash count key
        await db.put(LABELHASH_COUNT_KEY, "1");

        // Add record with invalid labelhash format
        const invalidLabelhash = new Uint8Array([1, 2, 3]); // Too short
        await db.put(invalidLabelhash, "test");

        const isValid = await validate(db, log);
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect labelhash mismatch", async () => {
      const db = await createDatabase(tempDir);

      try {
        // Add labelhash count key
        await db.put(LABELHASH_COUNT_KEY, "1");

        // Add record with mismatched labelhash
        const label = "vitalik";
        const wrongLabelhash = labelhash("ethereum");
        await db.put(labelHashToBytes(wrongLabelhash), label);

        const isValid = await validate(db, log);
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect missing count key", async () => {
      const db = await createDatabase(tempDir);

      try {
        // Add record without count
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        await db.put(labelHashToBytes(vitalikLabelhash), label);

        const isValid = await validate(db, log);
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should detect incorrect count", async () => {
      const db = await createDatabase(tempDir);

      try {
        // Add record
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        await db.put(labelHashToBytes(vitalikLabelhash), label);

        // Add incorrect count
        await db.put(LABELHASH_COUNT_KEY, "2");

        const isValid = await validate(db, log);
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });

    it("should throw when ingestion is in progress", async () => {
      const db = await createDatabase(tempDir);

      try {
        // Add a valid record
        const label = "vitalik";
        const vitalikLabelhash = labelhash(label);
        await db.put(labelHashToBytes(vitalikLabelhash), label);

        // Add correct count
        await db.put(LABELHASH_COUNT_KEY, "1");

        // Set ingestion in progress flag
        await db.put(INGESTION_IN_PROGRESS_KEY, "true");

        const isValid = await validate(db, log);
        expect(isValid).toBe(false);
      } finally {
        await db.close();
      }
    });
  });
});
