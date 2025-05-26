import {
  DEFAULT_ENSADMIN_URL,
  DEFAULT_ENS_DEPLOYMENT_CHAIN,
  DEFAULT_HEAL_REVERSE_ADDRESSES,
  DEFAULT_PORT,
  DEFAULT_RPC_RATE_LIMIT,
} from "@/lib/lib-config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/1234";

const BASE_ENV = {
  ENSNODE_PUBLIC_URL: "http://localhost:42069",
  ENSADMIN_URL: "https://admin.ensnode.io",
  DATABASE_SCHEMA: "ensnode",
  ACTIVE_PLUGINS: "subgraph",
  HEAL_REVERSE_ADDRESSES: "true",
  PORT: "3000",
  ENSRAINBOW_URL: "https://api.ensrainbow.io",
  ENS_DEPLOYMENT_CHAIN: "mainnet",
  RPC_URL_1: VALID_RPC_URL,
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
};

describe("config", () => {
  async function getConfig() {
    vi.resetModules(); // Reset module cache
    const configModule = await import("@/config");
    return configModule.default;
  }

  beforeEach(() => {
    Object.entries(BASE_ENV).forEach(([key, value]) => vi.stubEnv(key, value));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("general behavior", () => {
    it("returns a valid config object using environment variables", async () => {
      const config = await getConfig();
      expect(config.ensDeploymentChain).toBe("mainnet");
      expect(config.globalBlockrange).toEqual({ startBlock: undefined, endBlock: undefined });
      expect(config.ensNodePublicUrl).toBe("http://localhost:42069");
      expect(config.ensAdminUrl).toBe("https://admin.ensnode.io");
      expect(config.ponderDatabaseSchema).toBe("ensnode");
      expect(config.plugins).toEqual(["subgraph"]);
      expect(config.healReverseAddresses).toBe(true);
      expect(config.port).toBe(3000);
      expect(config.ensRainbowEndpointUrl).toBe("https://api.ensrainbow.io");
    });

    it("refreshes config when module is re-imported with new environment variables", async () => {
      const initialConfig = await getConfig();

      vi.stubEnv("PORT", "4000");
      const newConfig = await getConfig();

      expect(newConfig.port).toBe(4000);
      expect(newConfig).not.toBe(initialConfig);
    });
  });

  describe(".globalBlockrange", () => {
    it("returns both startBlock and endBlock as numbers when both are set", async () => {
      vi.stubEnv("START_BLOCK", "10");
      vi.stubEnv("END_BLOCK", "20");
      const config = await getConfig();
      expect(config.globalBlockrange).toEqual({ startBlock: 10, endBlock: 20 });
    });

    it("returns only startBlock when only START_BLOCK is set", async () => {
      vi.stubEnv("START_BLOCK", "5");
      const config = await getConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: 5,
        endBlock: undefined,
      });
    });

    it("returns only endBlock when only END_BLOCK is set", async () => {
      vi.stubEnv("END_BLOCK", "15");
      const config = await getConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: undefined,
        endBlock: 15,
      });
    });

    it("returns both as undefined when neither is set", async () => {
      const config = await getConfig();
      expect(config.globalBlockrange).toEqual({
        startBlock: undefined,
        endBlock: undefined,
      });
    });

    it("throws if START_BLOCK is negative", async () => {
      vi.stubEnv("START_BLOCK", "-1");
      await expect(getConfig()).rejects.toThrow(/START_BLOCK must be a positive integer/i);
    });

    it("throws if END_BLOCK is negative", async () => {
      vi.stubEnv("END_BLOCK", "-5");
      await expect(getConfig()).rejects.toThrow(/END_BLOCK must be a positive integer/i);
    });

    it("throws if START_BLOCK is not a number", async () => {
      vi.stubEnv("START_BLOCK", "foo");
      await expect(getConfig()).rejects.toThrow(/START_BLOCK must be a positive integer/i);
    });

    it("throws if END_BLOCK is not a number", async () => {
      vi.stubEnv("END_BLOCK", "bar");
      await expect(getConfig()).rejects.toThrow(/END_BLOCK must be a positive integer/i);
    });

    it("throws if START_BLOCK > END_BLOCK", async () => {
      vi.stubEnv("START_BLOCK", "100");
      vi.stubEnv("END_BLOCK", "50");
      await expect(getConfig()).rejects.toThrow(/must be greater than/i);
    });

    it("throws if START_BLOCK == END_BLOCK", async () => {
      vi.stubEnv("START_BLOCK", "100");
      vi.stubEnv("END_BLOCK", "100");
      await expect(getConfig()).rejects.toThrow(/must be greater than/i);
    });
  });

  describe(".ensNodePublicUrl", () => {
    it("throws an error if ENSNODE_PUBLIC_URL is not a valid URL", async () => {
      vi.stubEnv("ENSNODE_PUBLIC_URL", "invalid url");
      await expect(getConfig()).rejects.toThrow(/ENSNODE_PUBLIC_URL must be a valid URL string/i);
    });

    it("throws an error if ENSNODE_PUBLIC_URL is empty", async () => {
      vi.stubEnv("ENSNODE_PUBLIC_URL", "");
      await expect(getConfig()).rejects.toThrow(/ENSNODE_PUBLIC_URL must be a valid URL string/i);
    });

    it("throws an error if ENSNODE_PUBLIC_URL is undefined (explicitly testing the refine)", async () => {
      vi.stubEnv("ENSNODE_PUBLIC_URL", undefined);
      await expect(getConfig()).rejects.toThrow(/ENSNODE_PUBLIC_URL must be a valid URL string/i);
    });

    it("returns the ENSNODE_PUBLIC_URL if it is a valid URL", async () => {
      const config = await getConfig();
      expect(config.ensNodePublicUrl).toBe("http://localhost:42069");
    });

    it("returns a different valid ENSNODE_PUBLIC_URL if set", async () => {
      vi.stubEnv("ENSNODE_PUBLIC_URL", "https://someotherurl.com");
      const config = await getConfig();
      expect(config.ensNodePublicUrl).toBe("https://someotherurl.com");
    });
  });

  describe(".ensAdminUrl", () => {
    it("throws an error if ENSADMIN_URL is not a valid URL", async () => {
      vi.stubEnv("ENSADMIN_URL", "invalid url");
      await expect(getConfig()).rejects.toThrow(/ENSADMIN_URL must be a valid URL string/i);
    });

    it("returns the provided ENSADMIN_URL if it is a valid URL", async () => {
      vi.stubEnv("ENSADMIN_URL", "https://customadmin.com");
      const config = await getConfig();
      expect(config.ensAdminUrl).toBe("https://customadmin.com");
    });

    it("returns the default ENSADMIN_URL if it is not set", async () => {
      vi.stubEnv("ENSADMIN_URL", undefined);
      const config = await getConfig();
      expect(config.ensAdminUrl).toBe(DEFAULT_ENSADMIN_URL);
    });
  });

  describe(".ensRainbowEndpointUrl", () => {
    it("throws an error if ENSRAINBOW_URL is not a valid URL", async () => {
      vi.stubEnv("ENSRAINBOW_URL", "invalid url");
      await expect(getConfig()).rejects.toThrow(/ENSRAINBOW_URL must be a valid URL string/i);
    });

    it("returns the ENSRAINBOW_URL if it is a valid URL", async () => {
      vi.stubEnv("ENSRAINBOW_URL", "https://customrainbow.com");
      const config = await getConfig();
      expect(config.ensRainbowEndpointUrl).toBe("https://customrainbow.com");
    });

    it("throws an error if ENSRAINBOW_URL is not set", async () => {
      vi.stubEnv("ENSRAINBOW_URL", undefined);
      await expect(getConfig()).rejects.toThrow(/ENSRAINBOW_URL must be a valid URL string/i);
    });
  });

  describe(".ponderDatabaseSchema", () => {
    it("returns the DATABASE_SCHEMA if set", async () => {
      vi.stubEnv("DATABASE_SCHEMA", "someschema");
      const config = await getConfig();
      expect(config.ponderDatabaseSchema).toBe("someschema");
    });

    it("throws an error when DATABASE_SCHEMA is not set", async () => {
      vi.stubEnv("DATABASE_SCHEMA", undefined);
      await expect(getConfig()).rejects.toThrow(/DATABASE_SCHEMA is required/);
    });

    it("throws an error when DATABASE_SCHEMA is empty", async () => {
      vi.stubEnv("DATABASE_SCHEMA", "");
      await expect(getConfig()).rejects.toThrow(
        /DATABASE_SCHEMA is required and cannot be an empty string/,
      );
    });

    it("throws an error when DATABASE_SCHEMA is only whitespace", async () => {
      vi.stubEnv("DATABASE_SCHEMA", "   ");
      await expect(getConfig()).rejects.toThrow(
        /DATABASE_SCHEMA is required and cannot be an empty string/,
      );
    });
  });

  describe(".port", () => {
    it("returns the PORT if it is a valid number", async () => {
      vi.stubEnv("PORT", "3001");
      const config = await getConfig();
      expect(config.port).toBe(3001);
    });

    it("returns the default PORT if it is not set", async () => {
      vi.stubEnv("PORT", undefined);
      const config = await getConfig();
      expect(config.port).toBe(DEFAULT_PORT);
    });

    it("throws if PORT is not a number", async () => {
      vi.stubEnv("PORT", "not-a-port");
      await expect(getConfig()).rejects.toThrow(/PORT must be an integer/i);
    });

    it("throws if PORT is not an integer", async () => {
      vi.stubEnv("PORT", "3000.5");
      await expect(getConfig()).rejects.toThrow(/PORT must be an integer/i);
    });

    it("throws if PORT is less than 1", async () => {
      vi.stubEnv("PORT", "0");
      await expect(getConfig()).rejects.toThrow(/PORT must be an integer between 1 and 65535/i);
    });

    it("throws if PORT is a negative number", async () => {
      vi.stubEnv("PORT", "-100");
      await expect(getConfig()).rejects.toThrow(/PORT must be an integer between 1 and 65535/i);
    });

    it("throws if PORT is greater than 65535", async () => {
      vi.stubEnv("PORT", "65536");
      await expect(getConfig()).rejects.toThrow(/PORT must be an integer between 1 and 65535/i);
    });
  });

  describe(".healReverseAddresses", () => {
    it("returns false if HEAL_REVERSE_ADDRESSES is 'false'", async () => {
      vi.stubEnv("HEAL_REVERSE_ADDRESSES", "false");
      const config = await getConfig();
      expect(config.healReverseAddresses).toBe(false);
    });

    it("returns true if HEAL_REVERSE_ADDRESSES is 'true'", async () => {
      vi.stubEnv("HEAL_REVERSE_ADDRESSES", "true");
      const config = await getConfig();
      expect(config.healReverseAddresses).toBe(true);
    });

    it("returns the default if HEAL_REVERSE_ADDRESSES is not set", async () => {
      vi.stubEnv("HEAL_REVERSE_ADDRESSES", undefined);
      const config = await getConfig();
      expect(config.healReverseAddresses).toBe(DEFAULT_HEAL_REVERSE_ADDRESSES);
    });

    it("throws if HEAL_REVERSE_ADDRESSES is an invalid string value", async () => {
      vi.stubEnv("HEAL_REVERSE_ADDRESSES", "not-a-boolean");
      await expect(getConfig()).rejects.toThrow(
        /HEAL_REVERSE_ADDRESSES must be 'true' or 'false'/i,
      );
    });
  });

  describe(".ensDeploymentChain", () => {
    it("returns the ENS_DEPLOYMENT_CHAIN if set", async () => {
      vi.stubEnv("ENS_DEPLOYMENT_CHAIN", "sepolia");
      vi.stubEnv("RPC_URL_11155111", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.ensDeploymentChain).toBe("sepolia");
    });

    it("returns the default ENS_DEPLOYMENT_CHAIN if it is not set", async () => {
      vi.stubEnv("ENS_DEPLOYMENT_CHAIN", undefined);
      const config = await getConfig();
      expect(config.ensDeploymentChain).toBe(DEFAULT_ENS_DEPLOYMENT_CHAIN);
    });

    it("throws if ENS_DEPLOYMENT_CHAIN is an invalid string value", async () => {
      vi.stubEnv("ENS_DEPLOYMENT_CHAIN", "not-a-chain");
      await expect(getConfig()).rejects.toThrow(/Invalid ENS_DEPLOYMENT_CHAIN/i);
    });
  });

  describe(".plugins", () => {
    it("returns the ACTIVE_PLUGINS if it is a valid array", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "subgraph,basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.plugins).toEqual(["subgraph", "basenames"]);
    });

    it("returns a single plugin if only one is provided", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.plugins).toEqual(["basenames"]);
    });

    it("throws if ACTIVE_PLUGINS is an empty string", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "");
      await expect(getConfig()).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS consists only of commas or whitespace", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", " ,,  ,");
      await expect(getConfig()).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS consists of non-existent plugins", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "some,nonexistent,plugins");
      await expect(getConfig()).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS is not set (undefined)", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", undefined);
      await expect(getConfig()).rejects.toThrow(
        /ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if ACTIVE_PLUGINS contains duplicate values", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "subgraph,basenames,subgraph");
      await expect(getConfig()).rejects.toThrow(/ACTIVE_PLUGINS cannot contain duplicate values/i);
    });
  });

  describe(".chains", () => {
    it("returns the chains if it is a valid object", async () => {
      vi.stubEnv("RPC_URL_1", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.rpcConfigs).toEqual({
        1: {
          url: VALID_RPC_URL,
          maxRequestsPerSecond: DEFAULT_RPC_RATE_LIMIT,
        },
      });
    });

    it("throws an error if RPC_URL_1 is not a valid URL", async () => {
      vi.stubEnv("RPC_URL_1", "invalid url");
      await expect(getConfig()).rejects.toThrow(/RPC_URL_\* must be a valid URL string/i);
    });
  });

  describe(".rpcMaxRequestsPerSecond", () => {
    it("returns the RPC_REQUEST_RATE_LIMIT_1 if it is a valid number", async () => {
      vi.stubEnv("RPC_REQUEST_RATE_LIMIT_1", "100");
      const config = await getConfig();
      expect(config.rpcConfigs[1]!.maxRequestsPerSecond).toBe(100);
    });

    it("returns the default if it is not set", async () => {
      vi.stubEnv("RPC_REQUEST_RATE_LIMIT_1", undefined);
      const config = await getConfig();
      expect(config.rpcConfigs[1]!.maxRequestsPerSecond).toBe(DEFAULT_RPC_RATE_LIMIT);
    });
  });

  describe(".databaseUrl", () => {
    it("accepts a valid PostgreSQL connection string", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydb");
      const config = await getConfig();
      expect(config.databaseUrl).toBe("postgresql://user:password@localhost:5432/mydb");
    });

    it("accepts a connection string with additional parameters", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydb?sslmode=require");
      const config = await getConfig();
      expect(config.databaseUrl).toBe(
        "postgresql://user:password@localhost:5432/mydb?sslmode=require",
      );
    });

    it("throws an error if DATABASE_URL is not set", async () => {
      vi.stubEnv("DATABASE_URL", undefined);
      const config = await getConfig();
      expect(config.databaseUrl).toBeUndefined();
    });

    it("throws an error if DATABASE_URL is empty", async () => {
      vi.stubEnv("DATABASE_URL", "");
      await expect(getConfig()).rejects.toThrow(
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
      );
    });

    it("throws an error if DATABASE_URL is not a valid postgres connection string", async () => {
      vi.stubEnv("DATABASE_URL", "not-a-postgres-connection-string");
      await expect(getConfig()).rejects.toThrow(
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
      );
    });

    it("throws an error if DATABASE_URL uses the wrong protocol", async () => {
      vi.stubEnv("DATABASE_URL", "mysql://user:password@localhost:3306/mydb");
      await expect(getConfig()).rejects.toThrow(
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
      );
    });

    it("throws an error if DATABASE_URL is missing required components", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432");
      await expect(getConfig()).rejects.toThrow(
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
      );
    });

    it("accepts postgres:// protocol", async () => {
      vi.stubEnv("DATABASE_URL", "postgres://user:password@localhost:5432/mydb");
      const config = await getConfig();
      expect(config.databaseUrl).toBe("postgres://user:password@localhost:5432/mydb");
    });

    it("accepts postgresql:// protocol", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://user:password@localhost:5432/mydb");
      const config = await getConfig();
      expect(config.databaseUrl).toBe("postgresql://user:password@localhost:5432/mydb");
    });
  });

  describe("isSubgraphCompatible", () => {
    // start in subgraph-compatible state
    beforeEach(() => {
      vi.stubEnv("ACTIVE_PLUGINS", "subgraph");
      vi.stubEnv("HEAL_REVERSE_ADDRESSES", "false");
      vi.stubEnv("INDEX_RESOLVER_RECORDS", "false");
    });

    it("is true when compatible", async () => {
      const config = await getConfig();
      expect(config.isSubgraphCompatible).toBe(true);
    });

    it("is false when ACTIVE_PLUGINS does not include subgraph", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.isSubgraphCompatible).toBe(false);
    });

    it("is false when ACTIVE_PLUGINS includes subgraph along with other plugins", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "subgraph,basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.isSubgraphCompatible).toBe(false);
    });

    it("is false when HEAL_REVERSE_ADDRESSES is true", async () => {
      vi.stubEnv("HEAL_REVERSE_ADDRESSES", "true");
      const config = await getConfig();
      expect(config.isSubgraphCompatible).toBe(false);
    });

    it("is false when INDEX_RESOLVER_RECORDS is true", async () => {
      vi.stubEnv("INDEX_RESOLVER_RECORDS", "true");
      const config = await getConfig();
      expect(config.isSubgraphCompatible).toBe(false);
    });
  });

  describe("additional checks", () => {
    it("requires available datasources", async () => {
      vi.stubEnv("ENS_DEPLOYMENT_CHAIN", "ens-test-env");
      vi.stubEnv("ACTIVE_PLUGINS", "basenames");
      await expect(getConfig()).rejects.toThrow(/specifies dependent datasources/i);
    });

    it("requires rpc url for indexed chains", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "subgraph,basenames");
      await expect(getConfig()).rejects.toThrow(/RPC_URL_\d+ is not specified/i);
    });

    it("cannot constrain blockrange with multiple networks", async () => {
      vi.stubEnv("ACTIVE_PLUGINS", "subgraph,basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      vi.stubEnv("END_BLOCK", "1");
      await expect(getConfig()).rejects.toThrow(/multiple networks/i);
    });
  });
});
