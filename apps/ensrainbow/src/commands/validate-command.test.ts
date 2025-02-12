import { tmpdir } from "os";
import { join } from "path";
import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import { mkdtemp, rm } from "fs/promises";
import { labelhash } from "viem";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INGESTION_IN_PROGRESS_KEY, LABELHASH_COUNT_KEY, createDatabase } from "../lib/database.js";
import { validateCommand } from "./validate-command.js";

describe("Validate Command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-validate"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should detect an empty database", async () => {
    const db = await createDatabase(tempDir);
    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
  });

  it("should validate a database with valid records", async () => {
    const db = await createDatabase(tempDir);

    const testData = [
      { label: "vitalik", labelhash: labelhash("vitalik") },
      { label: "ethereum", labelhash: labelhash("ethereum") },
    ];

    // Add test records
    for (const { label, labelhash } of testData) {
      await db.put(labelHashToBytes(labelhash), label);
    }

    // Add count
    await db.put(LABELHASH_COUNT_KEY, testData.length.toString());

    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).resolves.not.toThrow();
  });

  it("should detect invalid labelhash format", async () => {
    const db = await createDatabase(tempDir);

    // Add labelhash count key
    await db.put(LABELHASH_COUNT_KEY, "1");

    // Add record with invalid labelhash format
    const invalidLabelhash = new Uint8Array([1, 2, 3]); // Too short
    await db.put(invalidLabelhash, "test");

    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
  });

  it("should detect labelhash mismatch", async () => {
    const db = await createDatabase(tempDir);

    // Add labelhash count key
    await db.put(LABELHASH_COUNT_KEY, "1");

    // Add record with mismatched labelhash
    const label = "vitalik";
    const wrongLabelhash = labelhash("ethereum");
    await db.put(labelHashToBytes(wrongLabelhash), label);

    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
  });

  it("should detect missing count key", async () => {
    const db = await createDatabase(tempDir);

    // Add record without count
    const label = "vitalik";
    const vitalikLabelhash = labelhash(label);
    await db.put(labelHashToBytes(vitalikLabelhash), label);

    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
  });

  it("should detect incorrect count", async () => {
    const db = await createDatabase(tempDir);

    // Add record
    const label = "vitalik";
    const vitalikLabelhash = labelhash(label);
    await db.put(labelHashToBytes(vitalikLabelhash), label);

    // Add incorrect count
    await db.put(LABELHASH_COUNT_KEY, "2");

    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
  });

  it("should detect when ingestion is in progress", async () => {
    const db = await createDatabase(tempDir);

    // Add a valid record
    const label = "vitalik";
    const vitalikLabelhash = labelhash(label);
    await db.put(labelHashToBytes(vitalikLabelhash), label);

    // Add correct count
    await db.put(LABELHASH_COUNT_KEY, "1");

    // Set ingestion in progress flag
    await db.put(INGESTION_IN_PROGRESS_KEY, "true");

    await db.close();

    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow(
      "Database is in an invalid state: ingestion in progress flag is set",
    );
  });
});
