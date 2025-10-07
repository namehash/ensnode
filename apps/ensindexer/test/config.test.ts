import { DEFAULT_ENSADMIN_URL, DEFAULT_PORT } from "@/config/defaults";
import { EnvironmentDefaults } from "@/config/environment-defaults";
import type { RpcConfig } from "@/config/types";
import { PluginName } from "@ensnode/ensnode-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/1234";
const VALID_RPC_URL_ALT = "https://lb.drpc.org/ethereum/987";
const VALID_RPC_WS_URL = "wss://eth-mainnet.g.alchemy.com/v2/1234";
const VALID_RPC_WS_URL_ALT = "wss://lb.drpc.org/ethereum/987";

const BASE_ENV = {
  ENSNODE_PUBLIC_URL: "http://localhost:42069",
  ENSINDEXER_URL: "http://localhost:42069",
  ENSADMIN_URL: "https://admin.ensnode.io",
  DATABASE_SCHEMA: "ensnode",
  PLUGINS: "subgraph",
  PORT: "3000",
  ENSRAINBOW_URL: "https://api.ensrainbow.io",
  LABEL_SET_ID: "ens-test-env",
  LABEL_SET_VERSION: "0",
  NAMESPACE: "mainnet",
  RPC_URL_1: VALID_RPC_URL,
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
};

async function getConfig() {
  vi.resetModules(); // Reset module cache
  const configModule = await import("@/config");
  return configModule.default;
}

async function stubEnv(env: Record<string, string>) {
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value));
}

describe("config (with base env)", () => {
  beforeEach(() => {
    stubEnv(BASE_ENV);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("general behavior", () => {
    it("returns a valid config object using environment variables", async () => {
      const config = await getConfig();
      expect(config.namespace).toBe("mainnet");
      expect(config.globalBlockrange).toEqual({ startBlock: undefined, endBlock: undefined });
      expect(config.ensNodePublicUrl).toStrictEqual(new URL("http://localhost:42069"));
      expect(config.ensAdminUrl).toStrictEqual(new URL("https://admin.ensnode.io"));
      expect(config.databaseSchemaName).toBe("ensnode");
      expect(config.plugins).toEqual(["subgraph"]);
      expect(config.port).toBe(3000);
      expect(config.ensRainbowUrl).toStrictEqual(new URL("https://api.ensrainbow.io"));
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
      expect(config.ensNodePublicUrl).toStrictEqual(new URL("http://localhost:42069"));
    });

    it("returns a different valid ENSNODE_PUBLIC_URL if set", async () => {
      vi.stubEnv("ENSNODE_PUBLIC_URL", "https://someotherurl.com");
      const config = await getConfig();
      expect(config.ensNodePublicUrl).toStrictEqual(new URL("https://someotherurl.com"));
    });
  });

  describe(".ensIndexerUrl", () => {
    it("throws an error if ENSINDEXER_URL is not a valid URL", async () => {
      vi.stubEnv("ENSINDEXER_URL", "invalid url");
      await expect(getConfig()).rejects.toThrow(/ENSINDEXER_URL must be a valid URL string/i);
    });

    it("throws an error if ENSINDEXER_URL is empty", async () => {
      vi.stubEnv("ENSINDEXER_URL", "");
      await expect(getConfig()).rejects.toThrow(/ENSINDEXER_URL must be a valid URL string/i);
    });

    it("throws an error if ENSINDEXER_URL is undefined (explicitly testing the refine)", async () => {
      vi.stubEnv("ENSINDEXER_URL", undefined);
      await expect(getConfig()).rejects.toThrow(/ENSINDEXER_URL must be a valid URL string/i);
    });

    it("returns the ENSINDEXER_URL if it is a valid URL", async () => {
      const config = await getConfig();
      expect(config.ensIndexerUrl).toStrictEqual(new URL("http://localhost:42069"));
    });

    it("returns a different valid ENSINDEXER_URL if set", async () => {
      vi.stubEnv("ENSINDEXER_URL", "https://someotherurl.com");
      const config = await getConfig();
      expect(config.ensIndexerUrl).toStrictEqual(new URL("https://someotherurl.com"));
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
      expect(config.ensAdminUrl).toStrictEqual(new URL("https://customadmin.com"));
    });

    it("returns the default ENSADMIN_URL if it is not set", async () => {
      vi.stubEnv("ENSADMIN_URL", undefined);
      const config = await getConfig();
      expect(config.ensAdminUrl).toStrictEqual(DEFAULT_ENSADMIN_URL);
    });
  });

  describe(".ensRainbowUrl", () => {
    it("throws an error if ENSRAINBOW_URL is not a valid URL", async () => {
      vi.stubEnv("ENSRAINBOW_URL", "invalid url");
      await expect(getConfig()).rejects.toThrow(/ENSRAINBOW_URL must be a valid URL string/i);
    });

    it("returns the ENSRAINBOW_URL if it is a valid URL", async () => {
      vi.stubEnv("ENSRAINBOW_URL", "https://customrainbow.com");
      const config = await getConfig();
      expect(config.ensRainbowUrl).toStrictEqual(new URL("https://customrainbow.com"));
    });

    it("throws an error if ENSRAINBOW_URL is not set", async () => {
      vi.stubEnv("ENSRAINBOW_URL", undefined);
      await expect(getConfig()).rejects.toThrow(/ENSRAINBOW_URL must be a valid URL string/i);
    });
  });

  describe(".databaseSchemaName", () => {
    it("returns the DATABASE_SCHEMA if set", async () => {
      vi.stubEnv("DATABASE_SCHEMA", "someschema");
      const config = await getConfig();
      expect(config.databaseSchemaName).toBe("someschema");
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

  describe(".namespace", () => {
    it("returns the NAMESPACE if set", async () => {
      vi.stubEnv("NAMESPACE", "sepolia");
      vi.stubEnv("RPC_URL_11155111", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.namespace).toBe("sepolia");
    });

    it("throws if NAMESPACE is not set", async () => {
      vi.stubEnv("NAMESPACE", undefined);
      await expect(getConfig()).rejects.toThrow(/NAMESPACE/);
    });

    it("throws if NAMESPACE is an invalid string value", async () => {
      vi.stubEnv("NAMESPACE", "not-a-chain");
      await expect(getConfig()).rejects.toThrow(/Invalid NAMESPACE/i);
    });
  });

  describe(".plugins", () => {
    describe("SUBGRAPH_COMPAT=true", () => {
      beforeEach(() => {
        vi.stubEnv("SUBGRAPH_COMPAT", "true");
        vi.stubEnv("LABEL_SET_ID", "subgraph");
        vi.stubEnv("LABEL_SET_VERSION", "0");
      });

      it("has default plugins", async () => {
        vi.stubEnv("PLUGINS", undefined);

        await expect(getConfig()).resolves.toMatchObject({
          plugins: EnvironmentDefaults.subgraphCompatible.PLUGINS.split(","),
        });
      });
    });

    describe("SUBGRAPH_COMPAT=false", () => {
      beforeEach(() => {
        vi.stubEnv("SUBGRAPH_COMPAT", "false");
      });

      it("has default plugins", async () => {
        vi.stubEnv("PLUGINS", undefined);
        vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
        vi.stubEnv("RPC_URL_59144", VALID_RPC_URL);
        vi.stubEnv("RPC_URL_10", VALID_RPC_URL);
        vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);

        await expect(getConfig()).resolves.toMatchObject({
          plugins: EnvironmentDefaults.alpha.PLUGINS.split(","),
        });
      });
    });

    it("returns the PLUGINS if it is a valid array", async () => {
      vi.stubEnv("PLUGINS", "subgraph,basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.plugins).toEqual(["subgraph", "basenames"]);
    });

    it("returns a single plugin if only one is provided", async () => {
      vi.stubEnv("PLUGINS", "basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      const config = await getConfig();
      expect(config.plugins).toEqual(["basenames"]);
    });

    it("throws if PLUGINS is an empty string", async () => {
      vi.stubEnv("PLUGINS", "");
      await expect(getConfig()).rejects.toThrow(
        /PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if PLUGINS consists only of commas or whitespace", async () => {
      vi.stubEnv("PLUGINS", " ,,  ,");
      await expect(getConfig()).rejects.toThrow(
        /PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if PLUGINS consists of non-existent plugins", async () => {
      vi.stubEnv("PLUGINS", "some,nonexistent,plugins");
      await expect(getConfig()).rejects.toThrow(
        /PLUGINS must be a comma separated list with at least one valid plugin name/i,
      );
    });

    it("throws if PLUGINS contains duplicate values", async () => {
      vi.stubEnv("PLUGINS", "subgraph,basenames,subgraph");
      await expect(getConfig()).rejects.toThrow(/PLUGINS cannot contain duplicate values/i);
    });
  });

  describe(".chains", () => {
    it("returns the chains if it is a valid object (one HTTP protocol URL)", async () => {
      vi.stubEnv("RPC_URL_1", VALID_RPC_URL);
      const config = await getConfig();

      expect(config.rpcConfigs).toStrictEqual(
        new Map([
          [
            1,
            {
              httpRPCs: [new URL(VALID_RPC_URL)],
              websocketRPC: undefined,
            } satisfies RpcConfig,
          ],
        ]),
      );
    });

    it("returns the chains if it is a valid object (multiple HTTP protocol URLs)", async () => {
      vi.stubEnv("RPC_URL_1", `${VALID_RPC_URL_ALT},${VALID_RPC_URL}`);
      const config = await getConfig();

      expect(config.rpcConfigs).toStrictEqual(
        new Map([
          [
            1,
            {
              httpRPCs: [new URL(VALID_RPC_URL_ALT), new URL(VALID_RPC_URL)],
              websocketRPC: undefined,
            } satisfies RpcConfig,
          ],
        ]),
      );
    });

    it("returns the chains if it is a valid object (multiple HTTP protocol URLs, and one WebSocket protocol URL)", async () => {
      vi.stubEnv("RPC_URL_1", `${VALID_RPC_URL},${VALID_RPC_WS_URL},${VALID_RPC_URL_ALT}`);
      const config = await getConfig();

      expect(config.rpcConfigs).toStrictEqual(
        new Map([
          [
            1,
            {
              httpRPCs: [new URL(VALID_RPC_URL), new URL(VALID_RPC_URL_ALT)],
              websocketRPC: new URL(VALID_RPC_WS_URL),
            } satisfies RpcConfig,
          ],
        ]),
      );
    });

    it("throws an error if RPC_URL_1 is not a valid URL", async () => {
      vi.stubEnv("RPC_URL_1", "invalid url");
      await expect(getConfig()).rejects.toThrow(/RPC URL must be a valid URL string/i);
    });

    it("throws an error if RPC_URL_1 includes less than one HTTP protocol URL", async () => {
      vi.stubEnv("RPC_URL_1", `${VALID_RPC_WS_URL},${VALID_RPC_WS_URL_ALT}`);
      await expect(getConfig()).rejects.toThrow(
        /RPC endpoint configuration for a chain must include at least one http\/https protocol URL/i,
      );
    });

    it("throws an error if RPC_URL_1 includes more than one WebSockets protocol URL", async () => {
      vi.stubEnv("RPC_URL_1", `${VALID_RPC_URL},${VALID_RPC_WS_URL},${VALID_RPC_WS_URL_ALT}`);
      await expect(getConfig()).rejects.toThrow(
        /RPC endpoint configuration for a chain must include at most one websocket \(ws\/wss\) protocol URL./i,
      );
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
      await expect(getConfig()).rejects.toThrow(/Invalid input/);
    });

    it("throws an error if DATABASE_URL is empty", async () => {
      vi.stubEnv("DATABASE_URL", "");
      await expect(getConfig()).rejects.toThrow(/Invalid PostgreSQL connection string/);
    });

    it("throws an error if DATABASE_URL is not a valid postgres connection string", async () => {
      vi.stubEnv("DATABASE_URL", "not-a-postgres-connection-string");
      await expect(getConfig()).rejects.toThrow(/Invalid PostgreSQL connection string/);
    });

    it("throws an error if DATABASE_URL uses the wrong protocol", async () => {
      vi.stubEnv("DATABASE_URL", "mysql://user:password@localhost:3306/mydb");
      await expect(getConfig()).rejects.toThrow(/Invalid PostgreSQL connection string/);
    });

    it("throws an error if DATABASE_URL is missing required components", async () => {
      vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432");
      await expect(getConfig()).rejects.toThrow(/Invalid PostgreSQL connection string/);
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

  describe("SUBGRAPH_COMPAT", () => {
    // start in subgraph-compatible state
    beforeEach(() => {
      vi.stubEnv("SUBGRAPH_COMPAT", "true");
      vi.stubEnv("LABEL_SET_ID", undefined);
      vi.stubEnv("LABEL_SET_VERSION", undefined);
    });

    it("is true when compatible", async () => {
      await expect(getConfig()).resolves.toMatchObject({ isSubgraphCompatible: true });
    });

    it("throws when PLUGINS does not include subgraph", async () => {
      vi.stubEnv("PLUGINS", "basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);

      await expect(getConfig()).rejects.toThrow(/isSubgraphCompatible/);
    });

    it("throws when PLUGINS includes subgraph along with other plugins", async () => {
      vi.stubEnv("PLUGINS", "subgraph,basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);

      await expect(getConfig()).rejects.toThrow(/isSubgraphCompatible/);
    });
  });

  describe("additional checks", () => {
    it("requires available datasources", async () => {
      vi.stubEnv("NAMESPACE", "ens-test-env");
      vi.stubEnv("PLUGINS", "basenames");
      await expect(getConfig()).rejects.toThrow(/specifies dependent datasources/i);
    });

    it("requires rpc url for indexed chains", async () => {
      vi.stubEnv("PLUGINS", "subgraph,basenames");
      await expect(getConfig()).rejects.toThrow(/RPC_URL_\d+ is not specified/i);
    });

    it("cannot constrain blockrange with multiple chains", async () => {
      vi.stubEnv("PLUGINS", "subgraph,basenames");
      vi.stubEnv("RPC_URL_8453", VALID_RPC_URL);
      vi.stubEnv("END_BLOCK", "1");
      await expect(getConfig()).rejects.toThrow(/multiple chains/i);
    });
  });

  describe(".labelSet", () => {
    it("returns the labelSet configuration if both LABEL_SET_ID and LABEL_SET_VERSION are valid", async () => {
      vi.stubEnv("LABEL_SET_ID", "subgraph");
      vi.stubEnv("LABEL_SET_VERSION", "5");
      const config = await getConfig();
      expect(config.labelSet).toEqual({
        labelSetId: "subgraph",
        labelSetVersion: 5,
      });
    });

    describe("SUBGRAPH_COMPAT=true", () => {
      beforeEach(() => {
        vi.stubEnv("SUBGRAPH_COMPAT", "true");
      });

      it("has default label set", async () => {
        vi.stubEnv("LABEL_SET_ID", undefined);
        vi.stubEnv("LABEL_SET_VERSION", undefined);

        await expect(getConfig()).resolves.toMatchObject({
          labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
        });
      });
    });

    describe("SUBGRAPH_COMPAT=false", () => {
      beforeEach(() => {
        vi.stubEnv("SUBGRAPH_COMPAT", "false");
      });

      it("has default label set", async () => {
        vi.stubEnv("LABEL_SET_ID", undefined);
        vi.stubEnv("LABEL_SET_VERSION", undefined);

        await expect(getConfig()).resolves.toMatchObject({
          labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
        });
      });
    });

    it("throws an error when LABEL_SET_ID is empty", async () => {
      vi.stubEnv("LABEL_SET_ID", "");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_ID must be 1-50 characters long/);
    });

    it("throws an error when LABEL_SET_ID is only whitespace", async () => {
      vi.stubEnv("LABEL_SET_ID", "   ");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_ID can only contain lowercase letters/);
    });

    it("throws an error when LABEL_SET_ID is too long", async () => {
      vi.stubEnv("LABEL_SET_ID", "a".repeat(51));
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_ID must be 1-50 characters long/);
    });

    it("throws an error when LABEL_SET_ID contains invalid characters", async () => {
      vi.stubEnv("LABEL_SET_ID", "invalid-id_with_underscores");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_ID can only contain lowercase letters/);
    });

    it("throws an error when LABEL_SET_ID contains uppercase letters", async () => {
      vi.stubEnv("LABEL_SET_ID", "InvalidId");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_ID can only contain lowercase letters/);
    });

    it("accepts valid LABEL_SET_ID with hyphens", async () => {
      vi.stubEnv("LABEL_SET_ID", "ens-test-env");
      const config = await getConfig();
      expect(config.labelSet.labelSetId).toBe("ens-test-env");
    });

    it("throws an error when LABEL_SET_VERSION is negative", async () => {
      vi.stubEnv("LABEL_SET_VERSION", "-1");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_VERSION must be a non-negative integer/);
    });

    it("throws an error when LABEL_SET_VERSION is not an integer", async () => {
      vi.stubEnv("LABEL_SET_VERSION", "5.5");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_VERSION must be an integer/);
    });

    it("throws an error when LABEL_SET_VERSION is not a number", async () => {
      vi.stubEnv("LABEL_SET_VERSION", "not-a-number");
      await expect(getConfig()).rejects.toThrow(/LABEL_SET_VERSION must be an integer/);
    });

    it("accepts zero as a valid LABEL_SET_VERSION", async () => {
      vi.stubEnv("LABEL_SET_VERSION", "0");
      const config = await getConfig();
      expect(config.labelSet.labelSetVersion).toBe(0);
    });
  });
});

/**
 * The following test block defines the minimal environment, so each test case is more readable.
 */
describe("config (minimal base env)", () => {
  beforeEach(() => {
    const {
      NAMESPACE,
      ENSNODE_PUBLIC_URL,
      ENSINDEXER_URL,
      ENSRAINBOW_URL,
      DATABASE_URL,
      DATABASE_SCHEMA,
      RPC_URL_1,
    } = BASE_ENV;
    stubEnv({
      NAMESPACE,
      ENSNODE_PUBLIC_URL,
      ENSINDEXER_URL,
      ENSRAINBOW_URL,
      DATABASE_URL,
      DATABASE_SCHEMA,
      RPC_URL_1,
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("SUBGAPH_COMPAT=false", () => {
    beforeEach(() => {
      stubEnv({ SUBGRAPH_COMPAT: "false" });
    });

    it("requires default plugins rpc urls", async () => {
      await expect(getConfig()).rejects.toThrow(/RPC_URL_/);
    });

    it("provides default plugins", async () => {
      stubEnv({
        RPC_URL_8453: VALID_RPC_URL,
        RPC_URL_59144: VALID_RPC_URL,
        RPC_URL_10: VALID_RPC_URL,
      });

      await expect(getConfig()).resolves.toMatchObject({
        plugins: EnvironmentDefaults.alpha.PLUGINS.split(","),
      });
    });

    it("allows override of default plugins", async () => {
      stubEnv({
        PLUGINS: "tokenscope",
        RPC_URL_8453: VALID_RPC_URL,
        RPC_URL_59144: VALID_RPC_URL,
        RPC_URL_10: VALID_RPC_URL,
      });

      await expect(getConfig()).resolves.toMatchObject({ plugins: [PluginName.TokenScope] });
    });
  });
});
