import { tmpdir } from "os";
import { join } from "path";
import { mkdtemp, rm, stat, writeFile } from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCLI } from "@/cli";
import { ENSRainbowDB } from "@/lib/database";
import { type LabelSetId, type LabelSetVersion, labelHashToBytes } from "@ensnode/ensnode-sdk";
import { labelhash } from "viem";
import { convertCsvCommand } from "./convert-csv-command";

// Path to test fixtures
const TEST_FIXTURES_DIR = join(__dirname, "..", "..", "test", "fixtures");

describe("convert-csv-command", () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "test");
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-csv-test-"));
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("CSV conversion and ingestion", () => {
    it("should convert single column CSV and successfully ingest into database", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "output_1col.ensrainbow");
      const dataDir = join(tempDir, "db_1col");

      // Convert CSV to ensrainbow format
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-csv-one-col" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      // Verify the output file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Ingest the converted file into database
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      expect(recordsCount).toBe(11);
      expect((await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("123"))))?.label).toBe(
        "123",
      );
      expect(await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("1234")))).toBe(null);
      await db.close();
    });

    it("should convert two column CSV with provided hashes and ingest successfully", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_2col.csv");
      const outputFile = join(tempDir, "output_2col.ensrainbow");
      const dataDir = join(tempDir, "db_2col");

      // Convert CSV to ensrainbow format
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-csv-two-col" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      // Verify the output file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Ingest the converted file into database
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      expect(recordsCount).toBe(10);
      expect(
        (await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("test123"))))?.label,
      ).toBe("test123");
      expect(await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("1234")))).toBe(null);
      await db.close();
    });

    it("should fail when CSV has inconsistent column count", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_invalid_first.csv");
      const outputFile = join(tempDir, "output_invalid.ensrainbow");

      // Convert CSV to ensrainbow format (should fail on inconsistent columns)
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-csv-invalid" as LabelSetId,
          labelSetVersion: 0 as LabelSetVersion,
        }),
      ).rejects.toThrow(/CSV conversion failed due to invalid data/);
    });

    it("should handle CSV with special characters, emojis, unicode, and quoted fields", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_special_chars.csv");
      const outputFile = join(tempDir, "output_special.ensrainbow");
      const dataDir = join(tempDir, "db_special");

      // Convert CSV to ensrainbow format
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-csv-special" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      // Verify output file was created
      const outputStats = await stat(outputFile);
      expect(outputStats.isFile()).toBe(true);
      expect(outputStats.size).toBeGreaterThan(0);

      // Ingest the converted file into database
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      expect(recordsCount).toBe(10);
      const labels = [
        "🔥emoji-label🚀",
        'special"quotes"inside',
        "label with newline\n character", // new line
        "label-with-null\0byte", // null byte
      ];
      for (const label of labels) {
        expect(
          (await db.getVersionedRainbowRecord(labelHashToBytes(labelhash(label))))?.label,
        ).toBe(label);
      }
      expect(await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("1234")))).toBe(null);
      await db.close();
    });

    it("should fail when CSV contains invalid labelhash format", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_invalid_hash.csv");
      const outputFile = join(tempDir, "output_invalid_hash.ensrainbow");

      // Convert CSV to ensrainbow format (should fail on invalid hash format)
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-csv-invalid-hash" as LabelSetId,
          labelSetVersion: 0 as LabelSetVersion,
        }),
      ).rejects.toThrow(/CSV conversion failed due to invalid data/);
    });
  });

  describe("Error handling", () => {
    it("should throw error for non-existent input file", async () => {
      const inputFile = join(tempDir, "non-existent.csv");
      const outputFile = join(tempDir, "output.ensrainbow");

      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-missing" as LabelSetId,
          labelSetVersion: 0 as LabelSetVersion,
        }),
      ).rejects.toThrow();
    });
  });

  describe("CLI integration", () => {
    it("should work through the full CLI pipeline", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "cli_output.ensrainbow");
      const dataDir = join(tempDir, "cli_db");

      const cli = createCLI({ exitProcess: false });

      // Test convert-csv command through CLI
      await cli.parse([
        "convert-csv",
        "--input-file",
        inputFile,
        "--output-file",
        outputFile,
        "--label-set-id",
        "test-cli-csv",
        "--label-set-version",
        "0",
      ]);

      // Verify file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Test ingestion through CLI
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      // Verify database was created
      const dbStats = await stat(dataDir);
      expect(dbStats.isDirectory()).toBe(true);
    });
  });

  describe("Filtering functionality", () => {
    it("should filter out labels that already exist in the database", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "output_filtered.ensrainbow");
      const dataDir = join(tempDir, "db_filtered");

      // First, create an initial database with some labels
      const initialOutputFile = join(tempDir, "initial.ensrainbow");
      await convertCsvCommand({
        inputFile,
        outputFile: initialOutputFile,
        labelSetId: "test-filtering" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      // Ingest the initial file
      const cli = createCLI({ exitProcess: false });
      await cli.parse([
        "ingest-ensrainbow",
        "--input-file",
        initialOutputFile,
        "--data-dir",
        dataDir,
      ]);

      // Verify initial database
      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const initialCount = await db.getPrecalculatedRainbowRecordCount();
      expect(initialCount).toBe(11);
      await db.close();

      // Now convert the same CSV file again, but with filtering enabled
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-filtering" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion, // Use same version as initial
        existingDbPath: dataDir,
        silent: true,
      });

      // Verify the filtered output file was created
      const outputStats = await stat(outputFile);
      expect(outputStats.isFile()).toBe(true);

      // The filtered file should be smaller than the original since it excludes existing labels
      const initialStats = await stat(initialOutputFile);
      expect(outputStats.size).toBeLessThan(initialStats.size);

      // Verify that the filtered file contains fewer records
      const filteredDataDir = join(tempDir, "db_filtered_result");
      await cli.parse([
        "ingest-ensrainbow",
        "--input-file",
        outputFile,
        "--data-dir",
        filteredDataDir,
      ]);

      const filteredDb = await ENSRainbowDB.open(filteredDataDir);
      expect(await filteredDb.validate()).toBe(true);
      const filteredCount = await filteredDb.getPrecalculatedRainbowRecordCount();
      expect(filteredCount).toBe(0); // All labels should be filtered out since they already exist
      await filteredDb.close();
    });

    it("should filter out duplicate labels within the same conversion", async () => {
      // Create a CSV file with duplicate labels
      const csvContent = "label1\nlabel2\nlabel1\nlabel3\nlabel2\nlabel4";
      const inputFile = join(tempDir, "duplicates.csv");
      await writeFile(inputFile, csvContent);

      const outputFile = join(tempDir, "output_no_duplicates.ensrainbow");

      // Convert CSV with duplicate filtering
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-duplicates" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      // Verify the output file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Ingest and verify only unique labels were processed
      const dataDir = join(tempDir, "db_no_duplicates");
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);

      // Should have 4 unique labels (label1, label2, label3, label4)
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      expect(recordsCount).toBe(4);

      // Verify specific labels exist
      expect(
        (await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("label1"))))?.label,
      ).toBe("label1");
      expect(
        (await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("label2"))))?.label,
      ).toBe("label2");
      expect(
        (await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("label3"))))?.label,
      ).toBe("label3");
      expect(
        (await db.getVersionedRainbowRecord(labelHashToBytes(labelhash("label4"))))?.label,
      ).toBe("label4");

      await db.close();
    });

    it("should handle non-existent database path gracefully", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "output_no_db.ensrainbow");
      const nonExistentDbPath = join(tempDir, "non-existent-db");

      // Should not throw error even with non-existent database path
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-no-db" as LabelSetId,
          labelSetVersion: 0 as LabelSetVersion,
          existingDbPath: nonExistentDbPath,
        }),
      ).resolves.not.toThrow();

      // Verify the output file was still created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should work through CLI with existing database path", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "cli_output_with_db.ensrainbow");
      const dataDir = join(tempDir, "cli_db_with_filtering");

      // First create a database
      const initialOutputFile = join(tempDir, "initial_cli.ensrainbow");
      const cli = createCLI({ exitProcess: false });

      await cli.parse([
        "convert-csv",
        "--input-file",
        inputFile,
        "--output-file",
        initialOutputFile,
        "--label-set-id",
        "test-cli-filtering",
        "--label-set-version",
        "0",
      ]);

      await cli.parse([
        "ingest-ensrainbow",
        "--input-file",
        initialOutputFile,
        "--data-dir",
        dataDir,
      ]);

      // Now test CLI with existing database path
      await cli.parse([
        "convert-csv",
        "--input-file",
        inputFile,
        "--output-file",
        outputFile,
        "--label-set-id",
        "test-cli-filtering",
        "--label-set-version",
        "1",
        "--existing-db-path",
        dataDir,
      ]);

      // Verify file was created
      const stats = await stat(outputFile);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });
});

  describe("Streaming performance", () => {
    it("should handle small CSV files efficiently", async () => {
      const inputFile = join(tempDir, "small_test.csv");
      const outputFile = join(tempDir, "output_small.ensrainbow");
      const dataDir = join(tempDir, "db_small");

      // Create a CSV with 100 records to test streaming
      const records = [];
      for (let i = 0; i < 100; i++) {
        records.push(`label${i}`);
      }
      await writeFile(inputFile, records.join("\n"));

      const startTime = Date.now();

      // Convert CSV
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-small" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      const conversionTime = Date.now() - startTime;

      // Should complete conversion quickly (less than 2 seconds for 100 records)
      expect(conversionTime).toBeLessThan(2000);

      // Verify file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Test ingestion
      const cli = createCLI({ exitProcess: false });
      const ingestStartTime = Date.now();

      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const ingestTime = Date.now() - ingestStartTime;

      // Should complete ingestion quickly (less than 3 seconds for 100 records)
      expect(ingestTime).toBeLessThan(3000);

      // Verify database was created
      const dbStats = await stat(dataDir);
      expect(dbStats.isDirectory()).toBe(true);
    });

    it("should handle CSV files with many unique labels", async () => {
      const inputFile = join(tempDir, "many_labels.csv");
      const outputFile = join(tempDir, "output_many_labels.ensrainbow");

      // Create a CSV with 50,000 unique labels (tests deduplication with increased memory limit)
      const records = [];
      for (let i = 0; i < 50_000; i++) {
        records.push(`label${i}`);
      }
      await writeFile(inputFile, records.join("\n"));

      // This should work without memory issues
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-many-labels" as LabelSetId,
        labelSetVersion: 0 as LabelSetVersion,
        silent: true,
      });

      // Verify file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    }, 60000); // 60 second timeout for large file test
  });
});
