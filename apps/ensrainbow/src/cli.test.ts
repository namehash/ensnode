import { tmpdir } from "os";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCLI, getEnvPort, validatePortConfiguration } from "./cli";
import { DEFAULT_PORT } from "./commands/server-command";

// Path to test fixtures
const TEST_FIXTURES_DIR = join(__dirname, "..", "test", "fixtures");

describe("CLI", () => {
  const originalEnv = process.env.PORT;
  const originalNodeEnv = process.env.NODE_ENV;
  let tempDir: string;
  let testDataDir: string;
  let cli: ReturnType<typeof createCLI>;
  const originalExit = process.exit;

  beforeEach(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";

    // Clear PORT before each test
    delete process.env.PORT;
    tempDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-cli"));
    testDataDir = join(tempDir, "test-db-directory");

    // Mock process.exit to prevent actual exits during tests
    process.exit = vi.fn() as any;

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
    process.exit = originalExit;
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
      expect(() => getEnvPort()).toThrow('Invalid port number "invalid"');
    });

    it("should throw error for negative port number", () => {
      process.env.PORT = "-1";
      expect(() => getEnvPort()).toThrow('Invalid port number "-1"');
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

  describe("CLI Interface", () => {
    describe("ingest command", () => {
      it("should execute ingest command with custom data directory", async () => {
        const customInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");

        await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

        // Verify database was created by trying to validate it
        await expect(cli.parse(["validate", "--data-dir", testDataDir])).resolves.not.toThrow();
      });
    });

    describe("serve command", () => {
      it("should execute serve command with custom options", async () => {
        const customPort = 4000;

        // First ingest some test data
        const customInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

        // Mock server shutdown to prevent process.exit
        // const mockShutdown = vi.fn();
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
        const customPort = 5000;
        process.env.PORT = customPort.toString();

        // First ingest some test data
        const customInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

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

        // Make a request to heal endpoint with valid labelhash
        const healResponse = await fetch(
          `http://localhost:${customPort}/v1/heal/0x73338cf209492ea926532bf0a21a859c9be97ba8623061fd0b8390ef6844a1ec`,
        );
        expect(healResponse.status).toBe(200);
        const healData = await healResponse.json();
        expect(healData.label).toBe("materiauxbricolage");
        expect(healData.status).toBe("success");

        // Make a request to heal endpoint with non-healable labelhash
        const nonHealableResponse = await fetch(
          `http://localhost:${customPort}/v1/heal/0x745156acaa628d9cb587c847f1b03b9c5f4ba573d67699112e6a11bb6a8c24cf`,
        );
        expect(nonHealableResponse.status).toBe(404);
        const nonHealableData = await nonHealableResponse.json();
        expect(nonHealableData.errorCode).toBe(404);
        expect(nonHealableData.error).toBe("Label not found");

        // Make a request to heal endpoint with invalid labelhash
        const invalidHealResponse = await fetch(
          `http://localhost:${customPort}/v1/heal/0x1234567890`,
        );
        expect(invalidHealResponse.status).toBe(400);
        const invalidHealData = await invalidHealResponse.json();
        expect(invalidHealData.errorCode).toBe(400);
        expect(invalidHealData.error).toBe("Invalid labelhash length 12 characters (expected 66)");

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
        const customInputFile = join(TEST_FIXTURES_DIR, "test_ens_names.sql.gz");
        await cli.parse(["ingest", "--input-file", customInputFile, "--data-dir", testDataDir]);

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
