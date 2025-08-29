import { tmpdir } from "os";
import { join } from "path";
import { mkdtemp, readFile, rm, stat } from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PORT, getEnvPort } from "@/lib/env";
import { createCLI, validatePortConfiguration } from "./cli";

// Path to test fixtures
const TEST_FIXTURES_DIR = join(__dirname, "..", "test", "fixtures");

describe("CLI", () => {
  const originalEnv = process.env.PORT;
  const originalNodeEnv = process.env.NODE_ENV;
  let tempDir: string;
  let testDataDir: string;
  let cli: ReturnType<typeof createCLI>;

  beforeEach(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";

    // Clear PORT before each test
    delete process.env.PORT;
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-cli"));
    testDataDir = join(tempDir, "test-db-directory");

    // Create CLI instance with process.exit disabled
    cli = createCLI({ exitProcess: false });
  });

  afterEach(async () => {
    // Restore original environment variables
    if (originalEnv) {
      process.env.PORT = originalEnv;
    } else {
      delete process.env.PORT;
    }
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe("getEnvPort", () => {
    it("should return DEFAULT_PORT when PORT is not set", () => {
      expect(getEnvPort()).toBe(DEFAULT_PORT);
    });

    it("should return port from environment variable", () => {
      const customPort = 4000;
      process.env.PORT = customPort.toString();
      expect(getEnvPort()).toBe(customPort);
    });

    it("should throw error for invalid port number", () => {
      process.env.PORT = "invalid";
      expect(() => getEnvPort()).toThrow(
        'Invalid PORT value "invalid": must be a non-negative integer',
      );
    });

    it("should throw error for negative port number", () => {
      process.env.PORT = "-1";
      expect(() => getEnvPort()).toThrow('Invalid PORT value "-1": must be a non-negative integer');
    });
  });

  describe("validatePortConfiguration", () => {
    it("should not throw when PORT env var is not set", () => {
      expect(() => validatePortConfiguration(3000)).not.toThrow();
    });

    it("should not throw when PORT matches CLI port", () => {
      process.env.PORT = "3000";
      expect(() => validatePortConfiguration(3000)).not.toThrow();
    });

    it("should throw when PORT conflicts with CLI port", () => {
      process.env.PORT = "3000";
      expect(() => validatePortConfiguration(4000)).toThrow("Port conflict");
    });
  });

  describe("purge command", () => {
    it("should remove the database directory", async () => {
      // Create test directory
      await mkdtemp(testDataDir);

      // Run purge command
      await cli.parse(["purge", "--data-dir", testDataDir]);

      // Verify directory was removed
      await expect(rm(testDataDir)).rejects.toThrow();
    });

    it("should handle errors gracefully", async () => {
      const nonExistentDir = join(tempDir, "non-existent");

      // Run purge command on non-existent directory
      await cli.parse(["purge", "--data-dir", nonExistentDir]);

      // Verify directory still doesn't exist
      await expect(rm(nonExistentDir)).rejects.toThrow();
    });
  });

  describe("CLI Interface", () => {
    describe("ingest command (ensrainbow)", () => {
      it("should convert SQL and ingest ensrainbow", async () => {
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const ensrainbowFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        const ensrainbowOutputFile = join(tempDir, "test_ens_names_0.ensrainbow");
        const labelSetId = "test-ens-names"; // Needed for convert
        const labelSetVersion = 0; // Needed for convert

        // Convert requires args - test with a try/catch to properly handle the rejection
        try {
          await cli.parse([
            "convert",
            "--input-file",
            sqlInputFile,
            "--output-file",
            ensrainbowOutputFile,
          ]);
          // If we get here, the test should fail
          throw new Error("Expected cli.parse to throw but it didn't");
        } catch (err: any) {
          expect(err.message).toMatch(
            /Missing required arguments: label-set-id, label-set-version/,
          );
        }

        // Successful convert with args
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          ensrainbowOutputFile,
          "--label-set-id",
          labelSetId,
          "--label-set-version",
          labelSetVersion.toString(),
        ]);
        //command: pnpm convert --input-file test/fixtures/test_ens_names.sql.gz --output-file test/fixtures/test_ens_names_0.ensrainbow --label-set-id test-ens-names --label-set-version 0
        //verify that the file is created

        await expect(stat(ensrainbowOutputFile)).resolves.toBeDefined();
        //check that ensrainbowFile is the same as ensrainbowOutputFile
        const ensrainbowFileData = await readFile(ensrainbowFile);
        const ensrainbowOutputFileData = await readFile(ensrainbowOutputFile);
        expect(ensrainbowFileData).toEqual(ensrainbowOutputFileData);

        // Ingest should succeed with minimal arguments - extracting label set id and version from the file header happens behind the scenes
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);
        //command: pnpm ingest-ensrainbow --input-file test/fixtures/test_ens_names_0.ensrainbow --data-dir test-db-directory
        await expect(
          ingestCli.parse(["validate", "--data-dir", testDataDir]),
        ).resolves.not.toThrow();
      });

      it("should convert SQL and ingest ensrainbow ens_test_env_names", async () => {
        const sqlInputFile = join(TEST_FIXTURES_DIR, "ens_test_env_names.sql.gz");
        const ensrainbowOutputFile = join(tempDir, "ens_test_env_0.ensrainbow");
        const labelSetId = "ens-test-env"; // Needed for convert
        const labelSetVersion = 0; // Needed for convert

        // Convert requires args - test with a try/catch to properly handle the rejection
        try {
          await cli.parse([
            "convert",
            "--input-file",
            sqlInputFile,
            "--output-file",
            ensrainbowOutputFile,
          ]);
          // If we get here, the test should fail
          throw new Error("Expected cli.parse to throw but it didn't");
        } catch (err: any) {
          expect(err.message).toMatch(
            /Missing required arguments: label-set-id, label-set-version/,
          );
        }

        // Successful convert with args
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          ensrainbowOutputFile,
          "--label-set-id",
          labelSetId,
          "--label-set-version",
          labelSetVersion.toString(),
        ]);
        //command: pnpm convert --input-file test_ens_names.sql.gz --output-file test_ens_names_0.ensrainbow --label-set-id test-ens-names --label-set-version 0
        //verify that the file is created

        await expect(stat(ensrainbowOutputFile)).resolves.toBeDefined();

        // Ingest should succeed with minimal arguments - extracting label set id and version from the file header happens behind the scenes
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);
        //command: pnpm ingest-ensrainbow --input-file test_ens_names_0.ensrainbow --data-dir test-db-directory
        await expect(
          ingestCli.parse(["validate", "--data-dir", testDataDir]),
        ).resolves.not.toThrow();
      });

      it("should convert SQL to ensrainbow and not ingest if label set is not 0", async () => {
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const ensrainbowOutputFile = join(tempDir, "test_ens_names_1.ensrainbow");
        const labelSetId = "test-ens-names"; // Needed for convert
        const labelSetVersion = 1; // Needed for convert

        // Convert requires args - test with a try/catch to properly handle the rejection
        try {
          await cli.parse([
            "convert",
            "--input-file",
            sqlInputFile,
            "--output-file",
            ensrainbowOutputFile,
          ]);
          // If we get here, the test should fail
          throw new Error("Expected cli.parse to throw but it didn't");
        } catch (err: any) {
          expect(err.message).toMatch(
            /Missing required arguments: label-set-id, label-set-version/,
          );
        }
        const ingestCli2 = createCLI({ exitProcess: false });
        // Successful convert with args
        await ingestCli2.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          ensrainbowOutputFile,
          "--label-set-id",
          labelSetId,
          "--label-set-version",
          labelSetVersion.toString(),
        ]);
        //verify it is created
        await expect(stat(ensrainbowOutputFile)).resolves.toBeDefined();

        // Create a *new* CLI instance for the ingest step to avoid state conflicts
        const ingestCli = createCLI({ exitProcess: false });

        // This test intentionally expects a different result from the first -
        // When trying to ingest a second file, it should fail because initial setup already happened
        await expect(
          ingestCli.parse([
            "ingest-ensrainbow",
            "--input-file",
            ensrainbowOutputFile,
            "--data-dir",
            testDataDir,
          ]),
        ).rejects.toThrow(
          /Initial ingestion must use a file with label set version 0, but file has label set version 1!/,
        ); // Check for the specific expected error
      });

      it("should ingest first file successfully but reject second file with label set version not being 1 higher than the current highest label set version", async () => {
        // First, ingest a valid file with label set version 0
        const firstInputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        const secondInputFile = join(tempDir, "test_ens_names_2.ensrainbow");

        // Create an ensrainbow file with label set version 2
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const labelSetId = "test-ens-names";
        const labelSetVersion = 2; // Higher than 1

        // Successful convert with label set version 2
        const convertCli = createCLI({ exitProcess: false });
        await convertCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          secondInputFile,
          "--label-set-id",
          labelSetId,
          "--label-set-version",
          labelSetVersion.toString(),
        ]);

        // Verify the file with label set version 2 was created
        await expect(stat(secondInputFile)).resolves.toBeDefined();

        // First ingest succeeds with label set version 0
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          firstInputFile,
          "--data-dir",
          testDataDir,
        ]);

        // Second ingest should fail because label set version > 1
        let error: Error | undefined;
        try {
          await ingestCli.parse([
            "ingest-ensrainbow",
            "--input-file",
            secondInputFile,
            "--data-dir",
            testDataDir,
          ]);
        } catch (err) {
          error = err as Error;
        }

        // Check that we got the expected error
        expect(error).toBeDefined();
        expect(error?.message).toMatch(
          /Label set version must be exactly one higher than the current highest label set version.\nCurrent highest label set version: 0, File label set version: 2/,
        );
      });

      it("should ingest first file successfully but reject second file with different label set id", async () => {
        // First, ingest a valid file with label set version 0
        const firstInputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        const secondInputFile = join(tempDir, "different_label_set_id_0.ensrainbow");
        const thirdInputFile = join(tempDir, "different_label_set_id_1.ensrainbow");

        // Create an ensrainbow file with different label set id
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const labelSetId = "different-label-set-id"; // Different from test-ens-names
        const labelSetVersion = 0;

        // Create second file with different label set id and label set version 0
        const convertCli = createCLI({ exitProcess: false });
        await convertCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          secondInputFile,
          "--label-set-id",
          labelSetId,
          "--label-set-version",
          labelSetVersion.toString(),
        ]);

        // Create third file with different label set id and label set version 1
        await convertCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          thirdInputFile,
          "--label-set-id",
          labelSetId,
          "--label-set-version",
          "1",
        ]);

        // Verify the file with different label set id was created
        await expect(stat(secondInputFile)).resolves.toBeDefined();

        // Create a separate test directory for the first ingestion
        const firstTestDir = join(tempDir, "first-ingest-dir");

        // First ingest succeeds with label set version 0
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          firstInputFile,
          "--data-dir",
          firstTestDir,
        ]);

        // Second ingest should fail because of label set id mismatch when using the same database
        let error1: Error | undefined;
        try {
          await ingestCli.parse([
            "ingest-ensrainbow",
            "--input-file",
            secondInputFile,
            "--data-dir",
            firstTestDir,
          ]);
        } catch (err) {
          error1 = err as Error;
        }

        // Check that we got the expected error
        expect(error1).toBeDefined();
        expect(error1?.message).toMatch(
          /Label set id mismatch! Database label set id: test-ens-names, File label set id: different-label-set-id!/,
        );

        // Ingest third file fails for the same reason
        let error2: Error | undefined;
        try {
          await ingestCli.parse([
            "ingest-ensrainbow",
            "--input-file",
            thirdInputFile,
            "--data-dir",
            firstTestDir,
          ]);
        } catch (err) {
          error2 = err as Error;
        }

        // Check that we got the expected error
        expect(error2).toBeDefined();
        expect(error2?.message).toMatch(
          /Label set id mismatch! Database label set id: test-ens-names, File label set id: different-label-set-id!/,
        );
      });
    });

    describe("serve command", () => {
      it("should execute serve command with custom options", async () => {
        const customPort = 4000;

        const ensrainbowOutputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        await cli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);

        const serverPromise = cli.parse([
          "serve",
          "--port",
          customPort.toString(),
          "--data-dir",
          testDataDir,
        ]);

        // Give server time to start
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Make a request to health endpoint
        const response = await fetch(`http://localhost:${customPort}/health`);
        expect(response.status).toBe(200);

        // Cleanup - send SIGINT to stop server
        process.emit("SIGINT", "SIGINT");
        await serverPromise;
      });

      it("should respect PORT environment variable", async () => {
        const customPort = 5115;
        process.env.PORT = customPort.toString();

        // First ingest some test data
        const ensrainbowOutputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        await cli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);

        // Start server
        const serverPromise = cli.parse(["serve", "--data-dir", testDataDir]);

        // Give server time to start
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Make a request to health endpoint
        const response = await fetch(`http://localhost:${customPort}/health`);
        expect(response.status).toBe(200);

        // Make a request to count endpoint
        const countResponse = await fetch(`http://localhost:${customPort}/v1/labels/count`);
        expect(countResponse.status).toBe(200);
        const countData = await countResponse.json();
        expect(countData.count).toBe(63);

        // Make a request to heal endpoint with valid labelHash
        const healResponse = await fetch(
          `http://localhost:${customPort}/v1/heal/0x73338cf209492ea926532bf0a21a859c9be97ba8623061fd0b8390ef6844a1ec`,
        );
        expect(healResponse.status).toBe(200);
        const healData = await healResponse.json();
        expect(healData.label).toBe("materiauxbricolage");
        expect(healData.status).toBe("success");

        // Make a request to heal endpoint with non-healable labelHash
        const nonHealableResponse = await fetch(
          `http://localhost:${customPort}/v1/heal/0x745156acaa628d9cb587c847f1b03b9c5f4ba573d67699112e6a11bb6a8c24cf`,
        );
        expect(nonHealableResponse.status).toBe(404);
        const nonHealableData = await nonHealableResponse.json();
        expect(nonHealableData.errorCode).toBe(404);
        expect(nonHealableData.error).toBe("Label not found");

        // Make a request to heal endpoint with invalid labelHash
        const invalidHealResponse = await fetch(
          `http://localhost:${customPort}/v1/heal/0x1234567890`,
        );
        expect(invalidHealResponse.status).toBe(400);
        const invalidHealData = await invalidHealResponse.json();
        expect(invalidHealData.errorCode).toBe(400);
        expect(invalidHealData.error).toBe("Invalid labelHash length 12 characters (expected 66)");

        // Cleanup - send SIGINT to stop server
        process.emit("SIGINT", "SIGINT");
        await serverPromise;
      });

      it("should throw on port conflict", async () => {
        process.env.PORT = "5000";
        await expect(
          cli.parse(["serve", "--port", "4000", "--data-dir", testDataDir]),
        ).rejects.toThrow("Port conflict");
      });
    });

    describe("validate command", () => {
      it("should execute validate command with custom data directory", async () => {
        // First ingest some test data
        const ensrainbowOutputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        await cli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);

        // Then validate it
        await expect(cli.parse(["validate", "--data-dir", testDataDir])).resolves.not.toThrow();
      });

      it("should fail validation on empty/non-existent database", async () => {
        await expect(cli.parse(["validate", "--data-dir", testDataDir])).rejects.toThrow();
      });
    });

    describe("general CLI behavior", () => {
      it("should require a command", async () => {
        await expect(async () => {
          await cli.parse([]);
        }).rejects.toThrow("You must specify a command");
      });

      it("should reject unknown commands", async () => {
        await expect(async () => {
          await cli.parse(["unknown"]);
        }).rejects.toThrow("Unknown argument: unknown");
      });

      it("should reject unknown options", async () => {
        await expect(async () => {
          await cli.parse(["serve", "--unknown-option"]);
        }).rejects.toThrow("Unknown arguments: unknown-option, unknownOption");
      });
    });
  });
});
