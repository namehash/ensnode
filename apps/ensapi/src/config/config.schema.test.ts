import packageJson from "@/../package.json" with { type: "json" };

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChainIndexingStatusIds,
  CrossChainIndexingStrategyIds,
  deserializeIndexingMetadataContext,
  type EnsRainbowPublicConfig,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  PluginName,
  RangeTypeIds,
  type SerializedCrossChainIndexingStatusSnapshot,
  type SerializedEnsDbPublicConfig,
  type SerializedEnsIndexerPublicConfig,
  type SerializedEnsIndexerStackInfo,
  type SerializedIndexingMetadataContextInitialized,
} from "@ensnode/ensnode-sdk";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { ensApiVersionInfo } from "@/lib/version-info";

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const ENSDB_PUBLIC_CONFIG = {
  versionInfo: {
    postgresql: "17.4",
  },
} satisfies SerializedEnsDbPublicConfig;

const ENSINDEXER_PUBLIC_CONFIG = {
  namespace: "mainnet",
  ensIndexerSchemaName: "ensindexer_0",
  ensRainbowPublicConfig: {
    serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
    versionInfo: {
      ensRainbow: packageJson.version,
    },
  },
  indexedChainIds: [1],
  isSubgraphCompatible: false,
  clientLabelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  plugins: [PluginName.Subgraph],
  versionInfo: {
    ensDb: packageJson.version,
    ensIndexer: packageJson.version,
    ensNormalize: ensApiVersionInfo.ensNormalize,
    ponder: "0.8.0",
  },
} satisfies SerializedEnsIndexerPublicConfig;

const ENSRAINBOW_PUBLIC_CONFIG = {
  serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
  versionInfo: {
    ensRainbow: packageJson.version,
  },
} satisfies EnsRainbowPublicConfig;

const INDEXING_STATUS = {
  strategy: CrossChainIndexingStrategyIds.Omnichain,
  slowestChainIndexingCursor: 1777147427,
  snapshotTime: 1777147440,
  omnichainSnapshot: {
    omnichainStatus: OmnichainIndexingStatusIds.Following,
    chains: {
      "1": {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: {
            timestamp: 1489165544,
            number: 3327417,
          },
        },
        latestIndexedBlock: {
          timestamp: 1777147427,
          number: 24959286,
        },
        latestKnownBlock: {
          timestamp: 1777147427,
          number: 24959286,
        },
      },
    },
    omnichainIndexingCursor: 1777147427,
  },
} satisfies SerializedCrossChainIndexingStatusSnapshot;

const ENSINDEXER_STACK_INFO = {
  ensDb: ENSDB_PUBLIC_CONFIG,
  ensIndexer: ENSINDEXER_PUBLIC_CONFIG,
  ensRainbow: ENSRAINBOW_PUBLIC_CONFIG,
} satisfies SerializedEnsIndexerStackInfo;

const INDEXING_METADATA_CONTEXT = {
  statusCode: IndexingMetadataContextStatusCodes.Initialized,
  indexingStatus: INDEXING_STATUS,
  stackInfo: ENSINDEXER_STACK_INFO,
} satisfies SerializedIndexingMetadataContextInitialized;

const indexingMetadataContextInitialized = deserializeIndexingMetadataContext(
  INDEXING_METADATA_CONTEXT,
) as IndexingMetadataContextInitialized;

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
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const BASE_ENV = {
  ENSDB_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_SCHEMA_NAME: "ensindexer_0",
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

describe("buildConfigFromEnvironment", () => {
  it("returns a valid config object using environment variables", async () => {
    const { ensIndexer: ensIndexerPublicConfig } = indexingMetadataContextInitialized.stackInfo;
    await expect(buildConfigFromEnvironment(BASE_ENV)).resolves.toStrictEqual({
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
    const editionsUrl = "https://example.com/editions.json";

    const config = await buildConfigFromEnvironment({
      ...BASE_ENV,
      REFERRAL_PROGRAM_EDITIONS: editionsUrl,
    });

    expect(config.referralProgramEditionConfigSetUrl).toEqual(new URL(editionsUrl));
  });

  describe("Useful error messages", () => {
    // Mock process.exit to prevent actual exit
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      mockExit.mockClear();
    });

    const TEST_ENV: EnsApiEnvironment = structuredClone(BASE_ENV);

    it("logs error and exits when REFERRAL_PROGRAM_EDITIONS is not a valid URL", async () => {
      await buildConfigFromEnvironment({
        ...TEST_ENV,
        REFERRAL_PROGRAM_EDITIONS: "not-a-url",
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("REFERRAL_PROGRAM_EDITIONS is not a valid URL: not-a-url"),
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing endpoint name)", async () => {
      await buildConfigFromEnvironment({
        ...TEST_ENV,
        QUICKNODE_API_KEY: "my-api-key",
      });

      expect(logger.error).toHaveBeenCalledWith(
        new Error(
          "Use of the QUICKNODE_API_KEY environment variable requires use of the QUICKNODE_ENDPOINT_NAME environment variable as well.",
        ),
        "Failed to build EnsApiConfig",
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing API key)", async () => {
      await buildConfigFromEnvironment({
        ...TEST_ENV,
        QUICKNODE_ENDPOINT_NAME: "my-endpoint-name",
      });

      expect(logger.error).toHaveBeenCalledWith(
        new Error(
          "Use of the QUICKNODE_ENDPOINT_NAME environment variable requires use of the QUICKNODE_API_KEY environment variable as well.",
        ),
        "Failed to build EnsApiConfig",
      );
      expect(process.exit).toHaveBeenCalledWith(1);
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

    const result = buildEnsApiPublicConfig(ensApiConfig);

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

    const result = buildEnsApiPublicConfig(ensApiConfig);

    // Verify that all ENSIndexer public config fields are preserved
    expect(result.ensIndexerPublicConfig).toStrictEqual(ensIndexerPublicConfig);
  });

  it("includes the theGraphFallback and redacts api key", () => {
    const { ensIndexer: ensIndexerPublicConfig } = indexingMetadataContextInitialized.stackInfo;
    const ensApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      ensIndexerPublicConfig: {
        ...ensIndexerPublicConfig,
        plugins: ["subgraph"],
        isSubgraphCompatible: true,
      },
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs: new Map(),
      referralProgramEditionConfigSetUrl: undefined,
      theGraphApiKey: "secret-api-key",
    };

    const result = buildEnsApiPublicConfig(ensApiConfig);

    expect(result.theGraphFallback.canFallback).toBe(true);
    // discriminate the type...
    if (!result.theGraphFallback.canFallback) throw new Error("never");

    // shouldn't have the secret-api-key in the url
    expect(result.theGraphFallback.url).not.toMatch(/secret-api-key/gi);
  });
});
