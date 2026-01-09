import { mkdtemp, rm, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { labelhash } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type LabelSetId, labelHashToBytes } from "@ensnode/ensnode-sdk";

import { createCLI } from "@/cli";
import { ENSRainbowDB } from "@/lib/database";

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
        }),
      ).rejects.toThrow(/Failed on line 1: Expected 1 or 2 col/);
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
        }),
      ).rejects.toThrow(/Failed on line 2: Invalid labelHash/);
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

      // Test convert command through CLI
      await cli.parse([
        "convert",
        "--input-file",
        inputFile,
        "--output-file",
        outputFile,
        "--label-set-id",
        "test-cli-csv",
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
      // This should automatically determine version 1 from the existing database
      await convertCsvCommand({
        inputFile,
        outputFile,
        labelSetId: "test-filtering" as LabelSetId,
        existingDbPath: dataDir,
        silent: true,
      });

      // Verify the filtered output file was created
      const outputStats = await stat(outputFile);
      expect(outputStats.isFile()).toBe(true);

      // The filtered file should be smaller than the original since it excludes existing labels
      const initialStats = await stat(initialOutputFile);
      expect(outputStats.size).toBeLessThan(initialStats.size);

      // Verify that ingesting the filtered file (version 1) into a new database fails
      // because new databases require version 0 for initial ingestion
      const filteredDataDir = join(tempDir, "db_filtered_result");
      await expect(
        cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", filteredDataDir]),
      ).rejects.toThrow(/Initial ingestion must use a file with label set version 0/);
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

    it("should throw error when existing database path cannot be opened", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "output_no_db.ensrainbow");
      const nonExistentDbPath = join(tempDir, "non-existent-db");

      // Should throw error when database path is provided but cannot be opened
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-no-db" as LabelSetId,
          existingDbPath: nonExistentDbPath,
        }),
      ).rejects.toThrow(/Database is not open/);
    });

    it("should throw error when label set ID mismatches existing database", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "output_mismatch.ensrainbow");
      const dataDir = join(tempDir, "db_mismatch");

      // First, create a database with one label set ID
      const initialOutputFile = join(tempDir, "initial_mismatch.ensrainbow");
      await convertCsvCommand({
        inputFile,
        outputFile: initialOutputFile,
        labelSetId: "test-label-set-a" as LabelSetId,
        silent: true,
      });

      // Ingest the initial file to create the database
      const cli = createCLI({ exitProcess: false });
      await cli.parse([
        "ingest-ensrainbow",
        "--input-file",
        initialOutputFile,
        "--data-dir",
        dataDir,
      ]);

      // Verify initial database was created
      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const labelSet = await db.getLabelSet();
      expect(labelSet.labelSetId).toBe("test-label-set-a");
      await db.close();

      // Now try to convert with a different label set ID and the existing database path
      // This should throw an error about label set ID mismatch
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-label-set-b" as LabelSetId,
          existingDbPath: dataDir,
          silent: true,
        }),
      ).rejects.toThrow(
        /Label set ID mismatch! Database label set id: test-label-set-a, provided label set id: test-label-set-b/,
      );
    });

    it("should work through CLI with existing database path", async () => {
      const inputFile = join(TEST_FIXTURES_DIR, "test_labels_1col.csv");
      const outputFile = join(tempDir, "cli_output_with_db.ensrainbow");
      const dataDir = join(tempDir, "cli_db_with_filtering");

      // First create a database
      const initialOutputFile = join(tempDir, "initial_cli.ensrainbow");
      const cli = createCLI({ exitProcess: false });

      await cli.parse([
        "convert",
        "--input-file",
        inputFile,
        "--output-file",
        initialOutputFile,
        "--label-set-id",
        "test-cli-filtering",
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
        "convert",
        "--input-file",
        inputFile,
        "--output-file",
        outputFile,
        "--label-set-id",
        "test-cli-filtering",
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
        silent: true,
      });

      // Verify file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    }, 60000); // 60 second timeout for large file test
  });

  describe("Edge cases", () => {
    it("should handle empty CSV file", async () => {
      const inputFile = join(tempDir, "empty.csv");
      const outputFile = join(tempDir, "output_empty.ensrainbow");
      await writeFile(inputFile, "");

      // Should not throw error for empty file
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-empty" as LabelSetId,
          silent: true,
        }),
      ).resolves.not.toThrow();

      // Verify the output file was created (should have header only)
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Ingest and verify no records were written
      const dataDir = join(tempDir, "db_empty");
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      expect(recordsCount).toBe(0);
      await db.close();
    });

    it("should handle CSV file with only whitespace", async () => {
      const inputFile = join(tempDir, "whitespace.csv");
      const outputFile = join(tempDir, "output_whitespace.ensrainbow");
      await writeFile(inputFile, "   \n  \n\t\n  ");

      // Should not throw error for whitespace-only file
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-whitespace" as LabelSetId,
          silent: true,
        }),
      ).resolves.not.toThrow();

      // Verify the output file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
    });

    it("should process all CSV rows including potential headers", async () => {
      const inputFile = join(tempDir, "with_header.csv");
      const outputFile = join(tempDir, "output_header.ensrainbow");
      const csvContent =
        "label,labelhash\nalice,0x9c0257114eb9399a2985f8e75dad7600c5d89fe3824ffa99ec1c3eb8bf3b0501\nbob,0x38e47a7b719dce63662aeaf43440326f551b8a7ee198cee35cb5d517f2d296a2";
      await writeFile(inputFile, csvContent);

      // Should process the file (header will be treated as a regular row and fail validation)
      // Actually, the header row will be processed and fail because "label" is not a valid hex hash
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-header" as LabelSetId,
          silent: true,
        }),
      ).rejects.toThrow(/Invalid labelHash/);

      // For a proper test, let's create a CSV where the header is valid data
      const csvContentValid = "label\nlabel1\nlabel2";
      await writeFile(inputFile, csvContentValid);

      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-header-valid" as LabelSetId,
          silent: true,
        }),
      ).resolves.not.toThrow();

      // Verify records were created (including "label" as a label)
      const dataDir = join(tempDir, "db_header");
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      // Should have 3 records: "label", "label1", "label2"
      expect(recordsCount).toBe(3);
      await db.close();
    });

    it("should handle CSV with malformed rows (extra columns)", async () => {
      const inputFile = join(tempDir, "malformed_extra_cols.csv");
      const outputFile = join(tempDir, "output_malformed.ensrainbow");
      const csvContent =
        "alice\nbob,0x38e47a7b719dce63662aeaf43440326f551b8a7ee198cee35cb5d517f2d296a2,extra\ncharlie";
      await writeFile(inputFile, csvContent);

      // Should fail when column count is inconsistent
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-malformed" as LabelSetId,
          silent: true,
        }),
      ).rejects.toThrow(/Expected \d+ columns/);
    });

    it("should handle CSV with malformed rows (missing columns)", async () => {
      const inputFile = join(tempDir, "malformed_missing_cols.csv");
      const outputFile = join(tempDir, "output_malformed2.ensrainbow");
      const csvContent =
        "alice,0x9c0257114eb9399a2985f8e75dad7600c5d89fe3824ffa99ec1c3eb8bf3b0501\nbob\ncharlie,0x87a213ce1ee769e28decedefb98f6fe48890a74ba84957ebf877fb591e37e0de";
      await writeFile(inputFile, csvContent);

      // Should fail when column count is inconsistent
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-malformed2" as LabelSetId,
          silent: true,
        }),
      ).rejects.toThrow(/Expected \d+ columns/);
    });

    it("should handle CSV with quoted fields containing commas", async () => {
      const inputFile = join(tempDir, "quoted_fields.csv");
      const outputFile = join(tempDir, "output_quoted.ensrainbow");
      // CSV with quoted fields that contain commas - use single column format to auto-compute hashes
      const csvContent = '"label,with,commas"\n"another,label"';
      await writeFile(inputFile, csvContent);

      // Should handle quoted fields correctly
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-quoted" as LabelSetId,
          silent: true,
        }),
      ).resolves.not.toThrow();

      // Verify the output file was created
      const stats = await stat(outputFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Ingest and verify records
      const dataDir = join(tempDir, "db_quoted");
      const cli = createCLI({ exitProcess: false });
      await cli.parse(["ingest-ensrainbow", "--input-file", outputFile, "--data-dir", dataDir]);

      const db = await ENSRainbowDB.open(dataDir);
      expect(await db.validate()).toBe(true);
      const recordsCount = await db.getPrecalculatedRainbowRecordCount();
      expect(recordsCount).toBe(2);

      // Verify the labels were stored correctly
      const label1 = "label,with,commas";
      const label2 = "another,label";
      expect((await db.getVersionedRainbowRecord(labelHashToBytes(labelhash(label1))))?.label).toBe(
        label1,
      );
      expect((await db.getVersionedRainbowRecord(labelHashToBytes(labelhash(label2))))?.label).toBe(
        label2,
      );
      await db.close();
    });

    it("should handle CSV with empty labelhash column (should fail validation)", async () => {
      const inputFile = join(tempDir, "empty_hash.csv");
      const outputFile = join(tempDir, "output_empty_hash.ensrainbow");
      const csvContent =
        "alice,0x9c0257114eb9399a2985f8e75dad7600c5d89fe3824ffa99ec1c3eb8bf3b0501\nbob,\ncharlie,0x87a213ce1ee769e28decedefb98f6fe48890a74ba84957ebf877fb591e37e0de";
      await writeFile(inputFile, csvContent);

      // Should fail when labelhash is empty
      await expect(
        convertCsvCommand({
          inputFile,
          outputFile,
          labelSetId: "test-empty-hash" as LabelSetId,
          silent: true,
        }),
      ).rejects.toThrow(/LabelHash cannot be empty/);
    });
  });
});
