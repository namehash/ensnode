import { tmpdir } from "os";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ENSRainbowDB } from "@/lib/database";
import { validateCommand } from "./validate-command";

describe("Validate Command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-validate"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should throw an error when validating an empty/uninitialized database", async () => {
    await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
  });

  it("should succeed for valid database", async () => {
    const db = await ENSRainbowDB.create(tempDir);

    try {
      // Add a valid record
      const label = "vitalik";
      await db.setPrecalculatedRainbowRecordCount(1);
      await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
      await db.markIngestionFinished();
      await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
      await db.setNamespace("test-namespace");
      await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
      await db.setHighestLabelSet(0);
      await expect(validateCommand({ dataDir: tempDir })).rejects.toThrow();
      await db.addRainbowRecord(label, 0);
      await db.close();

      await expect(validateCommand({ dataDir: tempDir })).resolves.not.toThrow();
    } finally {
      // Clean up in case the test fails
      try {
        await db.close();
      } catch {
        // Ignore errors during cleanup
      }
    }
  });
});
