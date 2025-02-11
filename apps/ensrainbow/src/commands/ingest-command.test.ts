import { promises as fs } from "fs";
import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import { labelhash } from "viem";
/// <reference types="vitest" />
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "../lib/database";
import type { ENSRainbowDB } from "../lib/database";

describe("Ingest Command Tests", () => {
  let db: ENSRainbowDB;

  beforeAll(async () => {
    db = await createDatabase("test-data");
  });

  beforeEach(async () => {
    // Clear database before each test
    for await (const key of db.keys()) {
      await db.del(key);
    }
  });

  afterAll(async () => {
    await db.close();
    // Remove test database directory
    await fs.rm("test-data", { recursive: true, force: true });
  });

  describe("LevelDB operations", () => {
    it("should handle values containing null bytes", async () => {
      const labelWithNull = "test\0label";
      const labelWithNullLabelhash = labelhash(labelWithNull);
      const labelHashBytes = labelHashToBytes(labelWithNullLabelhash);

      await db.put(labelHashBytes, labelWithNull);
      const retrieved = await db.get(labelHashBytes);
      expect(retrieved).toBe(labelWithNull);
    });
  });
});
