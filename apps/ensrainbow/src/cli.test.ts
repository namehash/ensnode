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
    // describe("ingest command", () => {
    //   it("should execute ingest command with custom data directory", async () => {
    //     const customInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");

    //     await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

    //     // Verify database was created by trying to validate it
    //     await expect(cli.parse(["validate", "--data-dir", testDataDir])).resolves.not.toThrow();
    //   });
    // });

    // describe("ingest command with environment-specific data", () => {
    // it("should successfully ingest environment-specific test data", async () => {
    //   // Use ens-test-env test data for specialized testing
    //   const customInputFile = join(TEST_FIXTURES_DIR, "ens_test_env_names.sql.gz");

    //   await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

    //   // Verify database was created and can be validated
    //   await expect(cli.parse(["validate", "--data-dir", testDataDir])).resolves.not.toThrow();
    // });
    // });

    describe("ingest command (ensrainbow)", () => {
      it("should convert SQL and ingest ensrainbow", async () => {
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const ensrainbowFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        const ensrainbowOutputFile = join(tempDir, "test_ens_names_0.ensrainbow");
        const namespace = "test_ens_names"; // Needed for convert
        const labelSet = 0; // Needed for convert

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
          expect(err.message).toMatch(/Missing required arguments: namespace, label-set/);
        }

        // Successful convert with args
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          ensrainbowOutputFile,
          "--namespace",
          namespace,
          "--label-set",
          labelSet.toString(),
        ]);
        //command: ensrainbow convert --input-file test_ens_names.sql.gz --output-file test_ens_names_0.ensrainbow --namespace test_ens_names --label-set 0
        //verify that the file is created

        await expect(stat(ensrainbowOutputFile)).resolves.toBeDefined();
        //check that ensrainbowFile is the same as ensrainbowOutputFile
        const ensrainbowFileData = await readFile(ensrainbowFile);
        const ensrainbowOutputFileData = await readFile(ensrainbowOutputFile);
        expect(ensrainbowFileData).toEqual(ensrainbowOutputFileData);

        // Ingest should succeed with minimal arguments - extracting namespace/labelset from the file header happens behind the scenes
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);
        //command: ensrainbow ingest-ensrainbow --input-file test_ens_names_0.ensrainbow --data-dir test-db-directory
        await expect(
          ingestCli.parse(["validate", "--data-dir", testDataDir]),
        ).resolves.not.toThrow();
      });

      it("should convert SQL and ingest ensrainbow ens_test_env_names", async () => {
        const sqlInputFile = join(TEST_FIXTURES_DIR, "ens_test_env_names.sql.gz");
        const ensrainbowOutputFile = join(tempDir, "ens_test_env_0.ensrainbow");
        const namespace = "ens_test_env"; // Needed for convert
        const labelSet = 0; // Needed for convert

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
          expect(err.message).toMatch(/Missing required arguments: namespace, label-set/);
        }

        // Successful convert with args
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          ensrainbowOutputFile,
          "--namespace",
          namespace,
          "--label-set",
          labelSet.toString(),
        ]);
        //command: ensrainbow convert --input-file test_ens_names.sql.gz --output-file test_ens_names_0.ensrainbow --namespace test_ens_names --label-set 0
        //verify that the file is created

        await expect(stat(ensrainbowOutputFile)).resolves.toBeDefined();

        // Ingest should succeed with minimal arguments - extracting namespace/labelset from the file header happens behind the scenes
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          ensrainbowOutputFile,
          "--data-dir",
          testDataDir,
        ]);
        //command: ensrainbow ingest-ensrainbow --input-file test_ens_names_0.ensrainbow --data-dir test-db-directory
        await expect(
          ingestCli.parse(["validate", "--data-dir", testDataDir]),
        ).resolves.not.toThrow();
      });

      it("should convert SQL to ensrainbow and not ingest if label set is not 0", async () => {
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const ensrainbowOutputFile = join(tempDir, "test_ens_names_1.ensrainbow");
        const namespace = "test_ens_names"; // Needed for convert
        const labelSet = 1; // Needed for convert

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
          expect(err.message).toMatch(/Missing required arguments: namespace, label-set/);
        }
        const ingestCli2 = createCLI({ exitProcess: false });
        // Successful convert with args
        await ingestCli2.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          ensrainbowOutputFile,
          "--namespace",
          namespace,
          "--label-set",
          labelSet.toString(),
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
          /Initial ingestion must use a file with label set 0, but file has label set 1!/,
        ); // Check for the specific expected error
      });

      it("should ingest first file successfully but reject second file with label set not being 1 higher than the current highest label set", async () => {
        // First, ingest a valid file with label set 0
        const firstInputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        const secondInputFile = join(tempDir, "test_ens_names_2.ensrainbow");

        // Create an ensrainbow file with label set 2
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const namespace = "test_ens_names";
        const labelSet = 2; // Higher than 1

        // Successful convert with label set 2
        const convertCli = createCLI({ exitProcess: false });
        await convertCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          secondInputFile,
          "--namespace",
          namespace,
          "--label-set",
          labelSet.toString(),
        ]);

        // Verify the file with label set 2 was created
        await expect(stat(secondInputFile)).resolves.toBeDefined();

        // First ingest succeeds with label set 0
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          firstInputFile,
          "--data-dir",
          testDataDir,
        ]);

        // Second ingest should fail because label set > 1
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
          /Label set must be exactly one higher than the current highest label set.\nCurrent highest label set: 0, File label set: 2/,
        );
      });

      it("should ingest first file successfully but reject second file with different namespace", async () => {
        // First, ingest a valid file with label set 0
        const firstInputFile = join(TEST_FIXTURES_DIR, "test_ens_names_0.ensrainbow");
        const secondInputFile = join(tempDir, "different_namespace_0.ensrainbow");
        const thirdInputFile = join(tempDir, "different_namespace_1.ensrainbow");

        // Create an ensrainbow file with different namespace
        const sqlInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        const namespace = "different_namespace"; // Different from test_ens_names
        const labelSet = 0;

        // Create second file with different namespace and label set 0
        const convertCli = createCLI({ exitProcess: false });
        await convertCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          secondInputFile,
          "--namespace",
          namespace,
          "--label-set",
          labelSet.toString(),
        ]);

        // Create third file with different namespace and label set 1
        await convertCli.parse([
          "convert",
          "--input-file",
          sqlInputFile,
          "--output-file",
          thirdInputFile,
          "--namespace",
          namespace,
          "--label-set",
          "1",
        ]);

        // Verify the file with different namespace was created
        await expect(stat(secondInputFile)).resolves.toBeDefined();

        // Create a separate test directory for the first ingestion
        const firstTestDir = join(tempDir, "first-ingest-dir");

        // First ingest succeeds with label set 0
        const ingestCli = createCLI({ exitProcess: false });
        await ingestCli.parse([
          "ingest-ensrainbow",
          "--input-file",
          firstInputFile,
          "--data-dir",
          firstTestDir,
        ]);
        console.log("KURWAAAAAAAAAA1");
        // Second ingest should fail because of namespace mismatch when using the same database
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
        console.log("KURWAAAAAAAAAA2");
        // Check that we got the expected error
        expect(error1).toBeDefined();
        expect(error1?.message).toMatch(
          /Namespace mismatch! Database namespace: test_ens_names, File namespace: different_namespace!/,
        );
        console.log("KURWAAAAAAAAAA3");
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
        console.log("KURWAAAAAAAAAA4");
        // Check that we got the expected error
        expect(error2).toBeDefined();
        expect(error2?.message).toMatch(
          /Namespace mismatch! Database namespace: test_ens_names, File namespace: different_namespace!/,
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

    // describe("validate command", () => {
    //   it("should execute validate command with custom data directory", async () => {
    //     // First ingest some test data
    //     const customInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
    //     await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

    //     // Then validate it
    //     await expect(cli.parse(["validate", "--data-dir", testDataDir])).resolves.not.toThrow();
    //   });

    //   it("should fail validation on empty/non-existent database", async () => {
    //     await expect(cli.parse(["validate", "--data-dir", testDataDir])).rejects.toThrow();
    //   });
    // });

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
