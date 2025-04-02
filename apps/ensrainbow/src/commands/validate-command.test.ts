import { tmpdir } from "os";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { validateCommand } from "@/commands/validate-command";
import { ENSRainbowDB } from "@/lib/database";

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
      await db.addRainbowRecord(label);
      await db.setPrecalculatedRainbowRecordCount(1);
      await db.markIngestionFinished();
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
