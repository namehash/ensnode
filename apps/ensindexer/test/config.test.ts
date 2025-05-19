import { ENSIndexerConfig } from "@/config/types";
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

// Main describe block for all config tests
describe("config", () => {
  // Function to get a fresh config instance
  async function getFreshConfig(): Promise<ENSIndexerConfig> {
    vi.resetModules(); // Reset module cache
    const configModule = await import("@/config/app-config"); // Fresh import
    return configModule.default;
  }

  beforeEach(() => {
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
    it("returns a valid config object using environment variables", async () => {
      const config = await getFreshConfig();
      expect(config.ensDeploymentChain).toBe("mainnet");
      expect(config.globalBlockrange).toEqual({ startBlock: 0, endBlock: 100 });
      expect(config.ensNodePublicUrl).toBe("http://localhost:42069");
      expect(config.ensAdminUrl).toBe("https://admin.ensnode.io");
      expect(config.ponderDatabaseSchema).toBe("ensnode");
      expect(config.plugins).toEqual(new Set(["subgraph"]));
      expect(config.healReverseAddresses).toBe(true);
      expect(config.port).toBe(3000);
      expect(config.ensRainbowEndpointUrl).toBe("https://api.ensrainbow.io");
    });

    it("refreshes config when module is re-imported with new environment variables", async () => {
      // Get config with initial environment
      const initialConfig = await getFreshConfig();

      // Change environment and get fresh config
      process.env.PORT = "4000";
      const newConfig = await getFreshConfig();

      expect(newConfig.port).toBe(4000);
      expect(newConfig).not.toBe(initialConfig); // Should be a different object
    });
  });

  describe(".globalBlockrange", () => {
    it("returns both startBlock and endBlock as numbers when both are set", async () => {
      process.env.START_BLOCK = "10";
      process.env.END_BLOCK = "20";
      const config = await getFreshConfig();
      expect(config.globalBlockrange).toEqual({ startBlock: 10, endBlock: 20 });
    });

    it("returns only startBlock when only START_BLOCK is set", async () => {
      delete process.env.END_BLOCK;
      process.env.START_BLOCK = "5";
      const config = await getFreshConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: 5,
        endBlock: undefined,
      });
    });

    it("returns only endBlock when only END_BLOCK is set", async () => {
      delete process.env.START_BLOCK;
      process.env.END_BLOCK = "15";
      const config = await getFreshConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: undefined,
        endBlock: 15,
      });
    });

    it("returns both as undefined when neither is set", async () => {
      delete process.env.START_BLOCK;
      delete process.env.END_BLOCK;
      const config = await getFreshConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: undefined,
        endBlock: undefined,
      });
    });

    it("throws if START_BLOCK is negative", async () => {
      process.env.START_BLOCK = "-1";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/START_BLOCK must be a positive integer/i);
    });

    it("throws if END_BLOCK is negative", async () => {
      process.env.END_BLOCK = "-5";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/END_BLOCK must be a positive integer/i);
    });

    it("throws if START_BLOCK is not a number", async () => {
      process.env.START_BLOCK = "foo";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/START_BLOCK must be a positive integer/i);
    });

    it("throws if END_BLOCK is not a number", async () => {
      process.env.END_BLOCK = "bar";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/END_BLOCK must be a positive integer/i);
    });

    it("throws if START_BLOCK > END_BLOCK", async () => {
      process.env.START_BLOCK = "100";
      process.env.END_BLOCK = "50";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /END_BLOCK must be greater than or equal to START_BLOCK/i,
      );
    });
  });

  describe(".ensNodePublicUrl", () => {
    it("throws an error if ENSNODE_PUBLIC_URL is not a valid URL", async () => {
      process.env.ENSNODE_PUBLIC_URL = "invalid url";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ENSNODE_PUBLIC_URL must be a valid URL string/i,
      );
    });

    it("throws an error if ENSNODE_PUBLIC_URL is empty", async () => {
      process.env.ENSNODE_PUBLIC_URL = "";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ENSNODE_PUBLIC_URL must be a valid URL string/i,
      );
    });

    it("throws an error if ENSNODE_PUBLIC_URL is undefined (explicitly testing the refine)", async () => {
      delete process.env.ENSNODE_PUBLIC_URL;
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ENSNODE_PUBLIC_URL must be a valid URL string/i,
      );
    });

    it("returns the ENSNODE_PUBLIC_URL if it is a valid URL", async () => {
      // This test uses the value from BASE_ENV, which is already set in beforeEach
      const config = await getFreshConfig();
      expect(config.ensNodePublicUrl).toBe("http://localhost:42069");
    });

    it("returns a different valid ENSNODE_PUBLIC_URL if set", async () => {
      process.env.ENSNODE_PUBLIC_URL = "https://someotherurl.com";
      const config = await getFreshConfig();
      expect(config.ensNodePublicUrl).toBe("https://someotherurl.com");
    });
  });

  describe(".ensAdminUrl", () => {
    it("throws an error if ENSADMIN_URL is not a valid URL", async () => {
      process.env.ENSADMIN_URL = "invalid url";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/ENSADMIN_URL must be a valid URL string/i);
    });

    it("returns the provided ENSADMIN_URL if it is a valid URL", async () => {
      process.env.ENSADMIN_URL = "https://customadmin.com";
      const config = await getFreshConfig();
      expect(config.ensAdminUrl).toBe("https://customadmin.com");
    });

    it("returns the default ENSADMIN_URL if it is not set", async () => {
      delete process.env.ENSADMIN_URL; // Unset it from BASE_ENV
      const config = await getFreshConfig();
      expect(config.ensAdminUrl).toBe("https://admin.ensnode.io"); // Check against the default
    });
  });

  describe(".ensRainbowEndpointUrl", () => {
    it("throws an error if ENSRAINBOW_URL is not a valid URL", async () => {
      process.env.ENSRAINBOW_URL = "invalid url";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ENSRAINBOW_URL must be a valid URL string/i,
      );
    });

    it("returns the ENSRAINBOW_URL if it is a valid URL", async () => {
      process.env.ENSRAINBOW_URL = "https://customrainbow.com";
      const config = await getFreshConfig();
      expect(config.ensRainbowEndpointUrl).toBe("https://customrainbow.com");
    });

    it("throws an error if ENSRAINBOW_URL is not set", async () => {
      delete process.env.ENSRAINBOW_URL;
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ENSRAINBOW_URL must be a valid URL string/i,
      );
    });
  });

  describe(".ponderDatabaseSchema", () => {
    it("returns the DATABASE_SCHEMA if set", async () => {
      process.env.DATABASE_SCHEMA = "someschema";
      const config = await getFreshConfig();
      expect(config.ponderDatabaseSchema).toBe("someschema");
    });

    it("throws an error when DATABASE_SCHEMA is not set", async () => {
      delete process.env.DATABASE_SCHEMA;
      await expect(getFreshConfig()).rejects.toThrow(/DATABASE_SCHEMA is required/);
    });

    it("throws an error when DATABASE_SCHEMA is empty", async () => {
      process.env.DATABASE_SCHEMA = "";
      await expect(getFreshConfig()).rejects.toThrow(
        /DATABASE_SCHEMA is required and cannot be an empty string/,
      );
    });

    it("throws an error when DATABASE_SCHEMA is only whitespace", async () => {
      process.env.DATABASE_SCHEMA = "   ";
      await expect(getFreshConfig()).rejects.toThrow(
        /DATABASE_SCHEMA is required and cannot be an empty string/,
      );
    });
  });

  describe(".port", () => {
    it("returns the PORT if it is a valid number", async () => {
      // Different from BASE_ENV to ensure it's being read
      process.env.PORT = "3001";
      const config = await getFreshConfig();
      expect(config.port).toBe(3001);
    });

    it("returns the default PORT if it is not set", async () => {
      delete process.env.PORT;
      const config = await getFreshConfig();
      expect(config.port).toBe(42069);
    });

    it("throws if PORT is not a number", async () => {
      process.env.PORT = "not-a-port";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/PORT must be an integer/i);
    });

    it("throws if PORT is not an integer", async () => {
      process.env.PORT = "3000.5";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/PORT must be an integer/i);
    });

    it("throws if PORT is less than 1", async () => {
      process.env.PORT = "0";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /PORT must be an integer between 1 and 65535/i,
      );
    });

    it("throws if PORT is a negative number", async () => {
      process.env.PORT = "-100";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /PORT must be an integer between 1 and 65535/i,
      );
    });

    it("throws if PORT is greater than 65535", async () => {
      process.env.PORT = "65536";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /PORT must be an integer between 1 and 65535/i,
      );
    });
  });

  describe(".healReverseAddresses", () => {
    it("returns false if HEAL_REVERSE_ADDRESSES is 'false'", async () => {
      process.env.HEAL_REVERSE_ADDRESSES = "false";
      const config = await getFreshConfig();
      expect(config.healReverseAddresses).toBe(false);
    });

    it("returns true if HEAL_REVERSE_ADDRESSES is 'true'", async () => {
      process.env.HEAL_REVERSE_ADDRESSES = "true";
      const config = await getFreshConfig();
      expect(config.healReverseAddresses).toBe(true);
    });

    it("returns the default (true) if HEAL_REVERSE_ADDRESSES is not set", async () => {
      delete process.env.HEAL_REVERSE_ADDRESSES;
      const config = await getFreshConfig();
      expect(config.healReverseAddresses).toBe(true);
    });

    it("throws if HEAL_REVERSE_ADDRESSES is an invalid string value", async () => {
      process.env.HEAL_REVERSE_ADDRESSES = "not-a-boolean";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /HEAL_REVERSE_ADDRESSES must be 'true' or 'false'/i,
      );
    });
  });

  describe(".ensDeploymentChain", () => {
    it("returns the ENS_DEPLOYMENT_CHAIN if set", async () => {
      process.env.ENS_DEPLOYMENT_CHAIN = "sepolia";
      const config = await getFreshConfig();
      expect(config.ensDeploymentChain).toBe("sepolia");
    });

    it("returns the default ENS_DEPLOYMENT_CHAIN if it is not set", async () => {
      delete process.env.ENS_DEPLOYMENT_CHAIN;
      const config = await getFreshConfig();
      expect(config.ensDeploymentChain).toBe("mainnet");
    });

    it("throws if ENS_DEPLOYMENT_CHAIN is an invalid string value", async () => {
      process.env.ENS_DEPLOYMENT_CHAIN = "not-a-chain";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /Invalid ENS_DEPLOYMENT_CHAIN. Supported chains are: mainnet, sepolia, holesky, ens-test-env/i,
      );
    });
  });

  describe(".plugins", () => {
    it("returns the ACTIVE_PLUGINS if it is a valid array", async () => {
      process.env.ACTIVE_PLUGINS = "subgraph,basenames";
      const config = await getFreshConfig();
      expect(config.plugins).toEqual(new Set(["subgraph", "basenames"]));
    });

    it("returns a single plugin if only one is provided", async () => {
      process.env.ACTIVE_PLUGINS = "basenames"; // Already set in BASE_ENV as "subgraph"
      const config = await getFreshConfig();
      expect(config.plugins).toEqual(new Set(["basenames"]));
    });

    it("throws if ACTIVE_PLUGINS is an empty string", async () => {
      process.env.ACTIVE_PLUGINS = "";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS consists only of commas or whitespace", async () => {
      process.env.ACTIVE_PLUGINS = " ,,  ,";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS consists of non-existent plugins", async () => {
      process.env.ACTIVE_PLUGINS = "some,nonexistent,plugins";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS is not set (undefined)", async () => {
      delete process.env.ACTIVE_PLUGINS;
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS contains duplicate values", async () => {
      process.env.ACTIVE_PLUGINS = "subgraph,basenames,subgraph";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(
        /ACTIVE_PLUGINS cannot contain duplicate values/i,
      );
    });
  });

  describe(".chains", () => {
    it("returns the chains if it is a valid object", async () => {
      process.env.RPC_URL_1 = "https://eth-mainnet.g.alchemy.com/v2/1234";
      const config = await getFreshConfig();
      expect(config.indexedChains).toEqual({
        1: {
          rpcEndpointUrl: "https://eth-mainnet.g.alchemy.com/v2/1234",
          // default value
          rpcMaxRequestsPerSecond: 50,
        },
      });
    });

    it("throws an error if RPC_URL_1 is not a valid URL", async () => {
      process.env.RPC_URL_1 = "invalid url";
      const freshConfigPromise = getFreshConfig();
      await expect(freshConfigPromise).rejects.toThrow(/RPC_URL must be a valid URL string/i);
    });
  });

  describe(".rpcMaxRequestsPerSecond", () => {
    it("returns the RPC_REQUEST_RATE_LIMIT_1 if it is a valid number", async () => {
      process.env.RPC_REQUEST_RATE_LIMIT_1 = "100";
      const config = await getFreshConfig();
      expect(config.indexedChains[1]!.rpcMaxRequestsPerSecond).toBe(100);
    });

    it("returns the default RPC_REQUEST_RATE_LIMIT_1 if it is not set", async () => {
      delete process.env.RPC_REQUEST_RATE_LIMIT_1;
      const config = await getFreshConfig();
      expect(config.indexedChains[1]!.rpcMaxRequestsPerSecond).toBe(50);
    });
  });
});
