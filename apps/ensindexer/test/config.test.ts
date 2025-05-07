import { type ENSIndexerConfig } from "@/config/types";
import { DEFAULT_ENSRAINBOW_URL } from "@ensnode/ensrainbow-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Helper to set and unset environment variables for each test
function setEnv(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

const BASE_ENV = {
  ENSNODE_PUBLIC_URL: "http://localhost:42069",
  ENSADMIN_URL: "https://admin.ensnode.io",
  DATABASE_SCHEMA: "ensnode",
  ACTIVE_PLUGINS: "subgraph",
  HEAL_REVERSE_ADDRESSES: "true",
  PORT: "3000",
  ENSRAINBOW_URL: "https://api.ensrainbow.io",
  ENS_DEPLOYMENT_CHAIN: "mainnet",
  START_BLOCK: "0",
  END_BLOCK: "100",
  RPC_URL_1: "https://eth-mainnet.g.alchemy.com/v2/1234",
};

// Main describe block for all getConfig tests
describe("getConfig", () => {
  let localGetConfig: () => ENSIndexerConfig;

  beforeEach(async () => {
    vi.resetModules(); // Reset module cache before every test in this block
    const configModule = await import("@/config/app-config"); // Dynamically import fresh module
    localGetConfig = configModule.getConfig;
    setEnv(BASE_ENV); // Set base environment for the test
  });

  afterEach(() => {
    // Clear all environment variables defined in BASE_ENV
    const envToClear: Record<string, undefined> = {};
    for (const key of Object.keys(BASE_ENV)) {
      envToClear[key] = undefined;
    }
    setEnv(envToClear);
  });

  describe("general behavior", () => {
    it("returns a valid config object using environment variables", () => {
      const config = localGetConfig();
      expect(config.ensDeploymentChain).toBe("mainnet");
      expect(config.globalBlockrange).toEqual({ startBlock: 0, endBlock: 100 });
      expect(config.ensNodePublicUrl).toBe("http://localhost:42069");
      expect(config.ensAdminUrl).toBe("https://admin.ensnode.io");
      expect(config.ponderDatabaseSchema).toBe("ensnode");
      expect(config.requestedPluginNames).toEqual(["subgraph"]);
      expect(config.healReverseAddresses).toBe(true);
      expect(config.ponderPort).toBe(3000);
      expect(config.ensRainbowEndpointUrl).toBe("https://api.ensrainbow.io");
    });
  });

  describe(".globalBlockrange", () => {
    it("returns both startBlock and endBlock as numbers when both are set", () => {
      process.env.START_BLOCK = "10";
      process.env.END_BLOCK = "20";
      const config = localGetConfig();
      expect(config.globalBlockrange).toEqual({ startBlock: 10, endBlock: 20 });
    });

    it("returns only startBlock when only START_BLOCK is set", () => {
      delete process.env.END_BLOCK;
      process.env.START_BLOCK = "5";
      const config = localGetConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: 5,
        endBlock: undefined,
      });
    });

    it("returns only endBlock when only END_BLOCK is set", () => {
      delete process.env.START_BLOCK;
      process.env.END_BLOCK = "15";
      const config = localGetConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: undefined,
        endBlock: 15,
      });
    });

    it("returns both as undefined when neither is set", () => {
      delete process.env.START_BLOCK;
      delete process.env.END_BLOCK;
      const config = localGetConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: undefined,
        endBlock: undefined,
      });
    });

    it("throws if START_BLOCK is negative", () => {
      process.env.START_BLOCK = "-1";
      expect(() => localGetConfig()).toThrow(
        /START_BLOCK must be a non-negative number/i
      );
    });

    it("throws if END_BLOCK is negative", () => {
      process.env.END_BLOCK = "-5";
      expect(() => localGetConfig()).toThrow(
        /END_BLOCK must be a non-negative number/i
      );
    });

    it("throws if START_BLOCK is not a number", () => {
      process.env.START_BLOCK = "foo";
      expect(() => localGetConfig()).toThrow(/START_BLOCK must be a number/i);
    });

    it("throws if END_BLOCK is not a number", () => {
      process.env.END_BLOCK = "bar";
      expect(() => localGetConfig()).toThrow(/END_BLOCK must be a number/i);
    });

    it("throws if START_BLOCK > END_BLOCK", () => {
      process.env.START_BLOCK = "100";
      process.env.END_BLOCK = "50";
      expect(() => localGetConfig()).toThrow(
        /END_BLOCK must be greater than or equal to START_BLOCK/i
      );
    });
  });

  describe(".ensNodePublicUrl", () => {
    it("throws an error if ENSNODE_PUBLIC_URL is not a valid URL", () => {
      process.env.ENSNODE_PUBLIC_URL = "invalid url";
      expect(() => localGetConfig()).toThrow(
        /ENSNODE_PUBLIC_URL must be a valid URL string/i
      );
    });

    it("throws an error if ENSNODE_PUBLIC_URL is empty", () => {
      process.env.ENSNODE_PUBLIC_URL = "";
      expect(() => localGetConfig()).toThrow(
        /URL is required and cannot be empty/i
      );
    });

    it("throws an error if ENSNODE_PUBLIC_URL is undefined (explicitly testing the refine)", () => {
      delete process.env.ENSNODE_PUBLIC_URL;
      expect(() => localGetConfig()).toThrow(
        /ENSNODE_PUBLIC_URL must be a string. Received type: undefined/i
      );
    });

    it("returns the ENSNODE_PUBLIC_URL if it is a valid URL", () => {
      // This test uses the value from BASE_ENV, which is already set in beforeEach
      const config = localGetConfig();
      expect(config.ensNodePublicUrl).toBe("http://localhost:42069");
    });

    it("returns a different valid ENSNODE_PUBLIC_URL if set", () => {
      process.env.ENSNODE_PUBLIC_URL = "https://someotherurl.com";
      const config = localGetConfig();
      expect(config.ensNodePublicUrl).toBe("https://someotherurl.com");
    });
  });

  describe(".ensAdminUrl", () => {
    it("throws an error if ENSADMIN_URL is not a valid URL", () => {
      process.env.ENSADMIN_URL = "invalid url";
      expect(() => localGetConfig()).toThrow(
        /ENSADMIN_URL must be a valid URL string/i
      );
    });

    it("returns the provided ENSADMIN_URL if it is a valid URL", () => {
      process.env.ENSADMIN_URL = "https://customadmin.com";
      const config = localGetConfig();
      expect(config.ensAdminUrl).toBe("https://customadmin.com");
    });

    it("returns the default ENSADMIN_URL if it is not set", () => {
      delete process.env.ENSADMIN_URL; // Unset it from BASE_ENV
      const config = localGetConfig();
      expect(config.ensAdminUrl).toBe("https://admin.ensnode.io"); // Check against the default
    });
  });

  describe(".ensRainbowEndpointUrl", () => {
    it("throws an error if ENSRAINBOW_URL is not a valid URL", () => {
      process.env.ENSRAINBOW_URL = "invalid url";
      expect(() => localGetConfig()).toThrow(
        /ENSRAINBOW_URL must be a valid URL string/i
      );
    });

    it("returns the ENSRAINBOW_URL if it is a valid URL", () => {
      process.env.ENSRAINBOW_URL = "https://customrainbow.com";
      const config = localGetConfig();
      expect(config.ensRainbowEndpointUrl).toBe("https://customrainbow.com");
    });

    it("throws an error if ENSRAINBOW_URL is not set", () => {
      delete process.env.ENSRAINBOW_URL;
      expect(() => localGetConfig()).toThrow(
        /ENSRAINBOW_URL must be a string. Received type: undefined/i
      );
    });
  });

  describe(".ponderDatabaseSchema", () => {
    it("returns the DATABASE_SCHEMA if set", () => {
      process.env.DATABASE_SCHEMA = "someschema";
      const config = localGetConfig();
      expect(config.ponderDatabaseSchema).toBe("someschema");
    });

    it("returns the default DATABASE_SCHEMA if it is not set", () => {
      delete process.env.DATABASE_SCHEMA;
      const config = localGetConfig();
      expect(config.ponderDatabaseSchema).toBe("ensnode");
    });
  });

  describe(".ponderPort", () => {
    it("returns the PORT if it is a valid number", () => {
      // Different from BASE_ENV to ensure it's being read
      process.env.PORT = "3001";
      const config = localGetConfig();
      expect(config.ponderPort).toBe(3001);
    });

    it("returns the default PORT if it is not set", () => {
      delete process.env.PORT;
      const config = localGetConfig();
      expect(config.ponderPort).toBe(42069);
    });

    it("throws if PORT is not a number", () => {
      process.env.PORT = "not-a-port";
      expect(() => localGetConfig()).toThrow(
        /Ponder port \(PORT env var\) must be a number/i
      );
    });

    it("throws if PORT is not an integer", () => {
      process.env.PORT = "3000.5";
      expect(() => localGetConfig()).toThrow(
        /Ponder port \(PORT env var\) must be an integer/i
      );
    });

    it("throws if PORT is less than 1", () => {
      process.env.PORT = "0";
      expect(() => localGetConfig()).toThrow(
        /Ponder port \(PORT env var\) must be a number between 1 and 65535/i
      );
    });

    it("throws if PORT is a negative number", () => {
      process.env.PORT = "-100";
      expect(() => localGetConfig()).toThrow(
        /Ponder port \(PORT env var\) must be a number between 1 and 65535/i
      );
    });

    it("throws if PORT is greater than 65535", () => {
      process.env.PORT = "65536";
      expect(() => localGetConfig()).toThrow(
        /Ponder port \(PORT env var\) must be a number between 1 and 65535/i
      );
    });
  });

  describe(".healReverseAddresses", () => {
    it("returns false if HEAL_REVERSE_ADDRESSES is 'false'", () => {
      process.env.HEAL_REVERSE_ADDRESSES = "false";
      const config = localGetConfig();
      expect(config.healReverseAddresses).toBe(false);
    });

    it("returns true if HEAL_REVERSE_ADDRESSES is 'true'", () => {
      process.env.HEAL_REVERSE_ADDRESSES = "true";
      const config = localGetConfig();
      expect(config.healReverseAddresses).toBe(true);
    });

    it("returns the default (true) if HEAL_REVERSE_ADDRESSES is not set", () => {
      delete process.env.HEAL_REVERSE_ADDRESSES;
      const config = localGetConfig();
      expect(config.healReverseAddresses).toBe(true);
    });

    it("throws if HEAL_REVERSE_ADDRESSES is an invalid string value", () => {
      process.env.HEAL_REVERSE_ADDRESSES = "not-a-boolean";
      expect(() => localGetConfig()).toThrow(
        /HEAL_REVERSE_ADDRESSES must be 'true' or 'false'/i
      );
    });
  });

  describe(".ensDeploymentChain", () => {
    it("returns the ENS_DEPLOYMENT_CHAIN if set", () => {
      process.env.ENS_DEPLOYMENT_CHAIN = "sepolia";
      const config = localGetConfig();
      expect(config.ensDeploymentChain).toBe("sepolia");
    });

    it("returns the default ENS_DEPLOYMENT_CHAIN if it is not set", () => {
      delete process.env.ENS_DEPLOYMENT_CHAIN;
      const config = localGetConfig();
      expect(config.ensDeploymentChain).toBe("mainnet");
    });

    it("throws if ENS_DEPLOYMENT_CHAIN is an invalid string value", () => {
      process.env.ENS_DEPLOYMENT_CHAIN = "not-a-chain";
      expect(() => localGetConfig()).toThrow(
        /Invalid ENS_DEPLOYMENT_CHAIN. Supported chains are: mainnet, sepolia, holesky, ens-test-env/i
      );
    });
  });

  describe(".requestedPluginNames", () => {
    it("returns the ACTIVE_PLUGINS if it is a valid array", () => {
      process.env.ACTIVE_PLUGINS = "subgraph,basenames";
      const config = localGetConfig();
      expect(config.requestedPluginNames).toEqual(["subgraph", "basenames"]);
    });

    it("returns a single plugin if only one is provided", () => {
      process.env.ACTIVE_PLUGINS = "basenames"; // Already set in BASE_ENV as "subgraph"
      const config = localGetConfig();
      expect(config.requestedPluginNames).toEqual(["basenames"]);
    });

    it("throws if ACTIVE_PLUGINS is an empty string", () => {
      process.env.ACTIVE_PLUGINS = "";
      expect(() => localGetConfig()).toThrow(
        /ACTIVE_PLUGINS must be set and contain at least one valid plugin name/i
      );
    });

    it("throws if ACTIVE_PLUGINS consists only of commas or whitespace", () => {
      process.env.ACTIVE_PLUGINS = " ,,  ,";
      expect(() => localGetConfig()).toThrow(
        /ACTIVE_PLUGINS must be set and contain at least one valid plugin name/i
      );
    });

    it("throws if ACTIVE_PLUGINS is not set (undefined)", () => {
      delete process.env.ACTIVE_PLUGINS;
      expect(() => localGetConfig()).toThrow(
        /ACTIVE_PLUGINS must be set and contain at least one valid plugin name/i
      );
    });
  });

  describe(".chains", () => {
    it("returns the chains if it is a valid object", () => {
      process.env.RPC_URL_1 = "https://eth-mainnet.g.alchemy.com/v2/1234";
      const config = localGetConfig();
      expect(config.chains).toEqual({
        1: {
          rpcEndpointUrl: "https://eth-mainnet.g.alchemy.com/v2/1234",
          // default value
          rpcMaxRequestsPerSecond: 50,
        },
      });
    });

    it("throws an error if RPC_URL_1 is not a valid URL", () => {
      process.env.RPC_URL_1 = "invalid url";
      expect(() => localGetConfig()).toThrow(
        /RPC_URL must be a valid URL string/i
      );
    });
  });

  describe(".rpcMaxRequestsPerSecond", () => {
    it("returns the RPC_REQUEST_RATE_LIMIT_1 if it is a valid number", () => {
      process.env.RPC_REQUEST_RATE_LIMIT_1 = "100";
      const config = localGetConfig();
      expect(config.chains[1]!.rpcMaxRequestsPerSecond).toBe(100);
    });

    it("returns the default RPC_REQUEST_RATE_LIMIT_1 if it is not set", () => {
      delete process.env.RPC_REQUEST_RATE_LIMIT_1;
      const config = localGetConfig();
      expect(config.chains[1]!.rpcMaxRequestsPerSecond).toBe(50);
    });
  });
});
