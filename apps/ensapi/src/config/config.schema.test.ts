import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { ensApiVersionInfo } from "@/lib/version-info";

vi.mock("@/lib/ensdb/singleton", () => ({
  ensDbClient: {
    getIndexingMetadataContext: vi.fn(async () => indexingMetadataContextInitialized),
  },
}));

vi.mock("@/config/ensdb-config", () => ({
  default: {
    ensDbUrl: "postgresql://user:password@localhost:5432/mydb",
    ensIndexerSchemaName: "ensindexer_0",
  },
}));

import { buildConfigFromEnvironment, buildEnsApiPublicConfig } from "@/config/config.schema";
import {
  BASE_ENV,
  indexingMetadataContextInitialized,
  VALID_RPC_URL,
} from "@/config/config.schema.mock";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockProcessExit = () =>
  vi.spyOn(process, "exit").mockImplementation((() => {
    throw new Error("process.exit");
  }) as never);

describe("buildConfigFromEnvironment", () => {
  it("returns a valid config object using environment variables", async () => {
    const exitSpy = mockProcessExit();

    const { ensIndexer: ensIndexerPublicConfig } = indexingMetadataContextInitialized.stackInfo;
    const config = await buildConfigFromEnvironment(BASE_ENV);

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();

    expect(config).toStrictEqual({
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      theGraphApiKey: undefined,

      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs: new Map([
        [
          1,
          {
            httpRPCs: [new URL(BASE_ENV.RPC_URL_1)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
      referralProgramEditionConfigSetUrl: undefined,
    });
  });

  it("parses REFERRAL_PROGRAM_EDITIONS as a URL object", async () => {
    const exitSpy = mockProcessExit();
    const editionsUrl = "https://example.com/editions.json";

    const config = await buildConfigFromEnvironment({
      ...BASE_ENV,
      REFERRAL_PROGRAM_EDITIONS: editionsUrl,
    });

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();

    expect(config.referralProgramEditionConfigSetUrl).toEqual(new URL(editionsUrl));
  });

  it("includes theGraphApiKey when provided", async () => {
    const exitSpy = mockProcessExit();

    const config = await buildConfigFromEnvironment({
      ...BASE_ENV,
      THEGRAPH_API_KEY: "my-api-key",
    });

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();

    expect(config.theGraphApiKey).toBe("my-api-key");
  });

  describe("Useful error messages", () => {
    let exitSpy: ReturnType<typeof mockProcessExit>;

    beforeEach(() => {
      vi.clearAllMocks();
      exitSpy = mockProcessExit();
    });

    afterEach(() => {
      exitSpy.mockRestore();
    });

    it("logs error and exits when REFERRAL_PROGRAM_EDITIONS is not a valid URL", async () => {
      const testEnv = structuredClone(BASE_ENV);

      await expect(
        buildConfigFromEnvironment({
          ...testEnv,
          REFERRAL_PROGRAM_EDITIONS: "not-a-url",
        }),
      ).rejects.toThrow("process.exit");

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining("REFERRAL_PROGRAM_EDITIONS is not a valid URL: not-a-url"),
      );
      expect(process.exit).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing endpoint name)", async () => {
      const testEnv = structuredClone(BASE_ENV);

      await expect(
        buildConfigFromEnvironment({
          ...testEnv,
          QUICKNODE_API_KEY: "my-api-key",
        }),
      ).rejects.toThrow("process.exit");

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        new Error(
          "Use of the QUICKNODE_API_KEY environment variable requires use of the QUICKNODE_ENDPOINT_NAME environment variable as well.",
        ),
        "Failed to build EnsApiConfig",
      );
      expect(process.exit).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing API key)", async () => {
      const testEnv = structuredClone(BASE_ENV);

      await expect(
        buildConfigFromEnvironment({
          ...testEnv,
          QUICKNODE_ENDPOINT_NAME: "my-endpoint-name",
        }),
      ).rejects.toThrow("process.exit");

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        new Error(
          "Use of the QUICKNODE_ENDPOINT_NAME environment variable requires use of the QUICKNODE_API_KEY environment variable as well.",
        ),
        "Failed to build EnsApiConfig",
      );
      expect(process.exit).toHaveBeenCalledExactlyOnceWith(1);
    });
  });
});

describe("buildEnsApiPublicConfig", () => {
  it("returns a valid ENSApi public config with correct structure", () => {
    const { ensIndexer: ensIndexerPublicConfig } = indexingMetadataContextInitialized.stackInfo;
    const ensApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs: new Map([
        [
          1,
          {
            httpRPCs: [new URL(VALID_RPC_URL)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
      referralProgramEditionConfigSetUrl: undefined,
    };

    const result = buildEnsApiPublicConfig(ensApiConfig, ensIndexerPublicConfig);

    expect(result).toStrictEqual({
      versionInfo: ensApiVersionInfo,
      theGraphFallback: {
        canFallback: false,
        reason: "not-subgraph-compatible",
      },
      ensIndexerPublicConfig,
    });
  });

  it("preserves the complete ENSIndexer public config structure", () => {
    const { ensIndexer: ensIndexerPublicConfig } = indexingMetadataContextInitialized.stackInfo;
    const ensApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs: new Map(),
      referralProgramEditionConfigSetUrl: undefined,
    };

    const result = buildEnsApiPublicConfig(ensApiConfig, ensIndexerPublicConfig);

    expect(result.ensIndexerPublicConfig).toStrictEqual(ensIndexerPublicConfig);
  });

  it("includes the theGraphFallback and redacts api key", () => {
    const ensIndexerPublicConfig = {
      ...indexingMetadataContextInitialized.stackInfo.ensIndexer,
      plugins: ["subgraph"],
      isSubgraphCompatible: true,
    };

    const ensApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs: new Map(),
      referralProgramEditionConfigSetUrl: undefined,
      theGraphApiKey: "secret-api-key",
    };

    const result = buildEnsApiPublicConfig(ensApiConfig, ensIndexerPublicConfig);

    expect(result.theGraphFallback.canFallback).toBe(true);
    // discriminate the type...
    if (!result.theGraphFallback.canFallback) throw new Error("never");

    expect(result.theGraphFallback.url).toBe(
      "https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH",
    );
  });

  it("returns canFallback=false when no theGraphApiKey is provided even if subgraph compatible", () => {
    const ensIndexerPublicConfig = {
      ...indexingMetadataContextInitialized.stackInfo.ensIndexer,
      plugins: ["subgraph"],
      isSubgraphCompatible: true,
    };

    const ensApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs: new Map(),
      referralProgramEditionConfigSetUrl: undefined,
      theGraphApiKey: undefined,
    };

    const result = buildEnsApiPublicConfig(ensApiConfig, ensIndexerPublicConfig);

    expect(result.theGraphFallback).toStrictEqual({
      canFallback: false,
      reason: "no-api-key",
    });
  });
});
