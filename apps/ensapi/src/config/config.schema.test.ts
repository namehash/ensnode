import packageJson from "@/../package.json" with { type: "json" };

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChainIndexingStatusIds,
  CrossChainIndexingStrategyIds,
  deserializeEnsIndexerPublicConfig,
  type EnsApiPublicConfig,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  PluginName,
  RangeTypeIds,
  type SerializedChainIndexingStatusSnapshotQueued,
  type SerializedCrossChainIndexingStatusSnapshot,
  type SerializedEnsIndexerPublicConfig,
  type SerializedIndexingMetadataContextInitialized,
} from "@ensnode/ensnode-sdk";

vi.mock("@/lib/ensdb/singleton", () => ({
  ensDbClient: {
    getIndexingMetadataContext: vi.fn(async () => INDEXING_METADATA_CONTEXT),
  },
}));

vi.mock("@/config/ensdb-config", () => ({
  default: ENSDB_CONFIG,
}));

import type { EnsDbConfig } from "@ensnode/ensdb-sdk";

import {
  buildConfigFromEnvironment,
  buildEnsApiPublicConfig,
  type EnsApiConfig,
} from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";
import { ensApiVersionInfo } from "@/lib/version-info";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const BASE_ENV = {
  ENSDB_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_SCHEMA_NAME: "ensindexer_0",
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

const ENSDB_CONFIG = {
  ensDbUrl: "postgresql://user:password@localhost:5432/mydb",
  ensIndexerSchemaName: "ensindexer_0",
} satisfies EnsDbConfig;

const CROSS_CHAIN_INDEXING_STATUS_SNAPSHOT = {
  strategy: CrossChainIndexingStrategyIds.Omnichain,
  slowestChainIndexingCursor: 1720768991,
  snapshotTime: 1759409667,
  omnichainSnapshot: {
    omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
    omnichainIndexingCursor: 1720768991,
    chains: {
      "1": {
        chainStatus: ChainIndexingStatusIds.Queued,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: {
            timestamp: 1759409665,
            number: 3327417,
          },
        },
      } satisfies SerializedChainIndexingStatusSnapshotQueued,

      "10": {
        chainStatus: ChainIndexingStatusIds.Queued,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: {
            timestamp: 1731834595,
            number: 110393959,
          },
        },
      } satisfies SerializedChainIndexingStatusSnapshotQueued,
      "8453": {
        chainStatus: ChainIndexingStatusIds.Queued,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: {
            timestamp: 1721834595,
            number: 17522624,
          },
        },
      } satisfies SerializedChainIndexingStatusSnapshotQueued,

      "59144": {
        chainStatus: ChainIndexingStatusIds.Queued,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: {
            timestamp: 1720768992,
            number: 6682888,
          },
        },
      } satisfies SerializedChainIndexingStatusSnapshotQueued,
    },
  },
} satisfies SerializedCrossChainIndexingStatusSnapshot;

const ENSINDEXER_PUBLIC_CONFIG = {
  namespace: "mainnet",
  ensIndexerSchemaName: "ensindexer_0",
  ensRainbowPublicConfig: {
    serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
    versionInfo: {
      ensRainbow: packageJson.version,
    },
  },
  indexedChainIds: [1, 10, 8453, 59144],
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

const ensIndexerPublicConfig = deserializeEnsIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG);

const INDEXING_METADATA_CONTEXT = {
  statusCode: IndexingMetadataContextStatusCodes.Initialized,
  indexingStatus: CROSS_CHAIN_INDEXING_STATUS_SNAPSHOT,
  stackInfo: {
    ensDb: { versionInfo: { postgresql: "16.0" } },
    ensIndexer: ENSINDEXER_PUBLIC_CONFIG,
    ensRainbow: ENSINDEXER_PUBLIC_CONFIG.ensRainbowPublicConfig,
  },
} satisfies SerializedIndexingMetadataContextInitialized;

describe("buildConfigFromEnvironment", () => {
  it("returns a valid config object using environment variables", async () => {
    await expect(buildConfigFromEnvironment(BASE_ENV)).resolves.toStrictEqual({
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      theGraphApiKey: undefined,
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
    const mockEnsApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      referralProgramEditionConfigSetUrl: undefined,
    } satisfies EnsApiConfig;

    const result = buildEnsApiPublicConfig(mockEnsApiConfig, ensIndexerPublicConfig);

    expect(result).toStrictEqual({
      versionInfo: ensApiVersionInfo,
      theGraphFallback: {
        canFallback: false,
        reason: "not-subgraph-compatible",
      },
    } satisfies EnsApiPublicConfig);
  });

  it("includes the theGraphFallback and redacts api key", () => {
    const mockEnsApiConfig = {
      port: ENSApi_DEFAULT_PORT,
      ensDbUrl: BASE_ENV.ENSDB_URL,
      ensIndexerSchemaName: BASE_ENV.ENSINDEXER_SCHEMA_NAME,
      referralProgramEditionConfigSetUrl: undefined,
      theGraphApiKey: "secret-api-key",
    };

    const result = buildEnsApiPublicConfig(mockEnsApiConfig, ensIndexerPublicConfig);

    expect(result.theGraphFallback.canFallback).toBe(true);
    // discriminate the type...
    if (!result.theGraphFallback.canFallback) throw new Error("never");

    // shouldn't have the secret-api-key in the url
    expect(result.theGraphFallback.url).not.toMatch(/secret-api-key/gi);
  });
});
