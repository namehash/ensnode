import { tmpdir } from "os";
import { join } from "path";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import { mkdtemp, rm } from "fs/promises";
import { labelhash } from "viem";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LABELHASH_COUNT_KEY, createDatabase } from "../lib/database";
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
    const db = await createDatabase(tempDir);

    try {
      // Add a valid record
      const label = "vitalik";
      const vitalikLabelhash = labelhash(label);
      await db.put(labelHashToBytes(vitalikLabelhash), label);
      await db.put(LABELHASH_COUNT_KEY, "1");
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
