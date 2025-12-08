import packageJson from "@/../package.json" with { type: "json" };

import {
  ENS_HOLIDAY_AWARDS_END_DATE,
  ENS_HOLIDAY_AWARDS_START_DATE,
} from "@namehash/ens-referrals";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ENSIndexerPublicConfig,
  PluginName,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { buildConfigFromEnvironment, buildEnsApiPublicConfig } from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const BASE_ENV = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_URL: "http://localhost:42069",
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

const ENSINDEXER_PUBLIC_CONFIG = {
  namespace: "mainnet",
  databaseSchemaName: "ensapi",
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: false,
  labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  plugins: [PluginName.Subgraph],
  versionInfo: {
    ensDb: packageJson.version,
    ensIndexer: packageJson.version,
    ensRainbow: packageJson.version,
    ensRainbowSchema: 1,
    ensNormalize: "1.1.1",
    nodejs: "1.1.1",
    ponder: "1.1.1",
  },
} satisfies ENSIndexerPublicConfig;

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("buildConfigFromEnvironment", () => {
  afterEach(() => {
    mockFetch.mockReset();
  });

  it("returns a valid config object using environment variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(serializeENSIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG)),
    });

    await expect(buildConfigFromEnvironment(BASE_ENV)).resolves.toStrictEqual({
      port: ENSApi_DEFAULT_PORT,
      databaseUrl: BASE_ENV.DATABASE_URL,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),
      theGraphApiKey: undefined,

      ensIndexerPublicConfig: ENSINDEXER_PUBLIC_CONFIG,
      namespace: ENSINDEXER_PUBLIC_CONFIG.namespace,
      databaseSchemaName: ENSINDEXER_PUBLIC_CONFIG.databaseSchemaName,
      rpcConfigs: new Map([
        [
          1,
          {
            httpRPCs: [new URL(BASE_ENV.RPC_URL_1)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
      ensHolidayAwardsStart: ENS_HOLIDAY_AWARDS_START_DATE,
      ensHolidayAwardsEnd: ENS_HOLIDAY_AWARDS_END_DATE,
    });
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

    const TEST_ENV: EnsApiEnvironment = {
      DATABASE_URL: BASE_ENV.DATABASE_URL,
      ENSINDEXER_URL: BASE_ENV.ENSINDEXER_URL,
    };

    it("logs error message when QuickNode RPC config was partially configured (missing endpoint name)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serializeENSIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG)),
      });

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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serializeENSIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG)),
      });

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
    const mockConfig = {
      port: ENSApi_DEFAULT_PORT,
      databaseUrl: BASE_ENV.DATABASE_URL,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),
      ensIndexerPublicConfig: ENSINDEXER_PUBLIC_CONFIG,
      namespace: ENSINDEXER_PUBLIC_CONFIG.namespace,
      databaseSchemaName: ENSINDEXER_PUBLIC_CONFIG.databaseSchemaName,
      rpcConfigs: new Map([
        [
          1,
          {
            httpRPCs: [new URL(VALID_RPC_URL)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
      ensHolidayAwardsStart: ENS_HOLIDAY_AWARDS_START_DATE,
      ensHolidayAwardsEnd: ENS_HOLIDAY_AWARDS_END_DATE,
    };

    const result = buildEnsApiPublicConfig(mockConfig);

    expect(result).toStrictEqual({
      version: packageJson.version,
      theGraphFallback: {
        canFallback: false,
        reason: "not-subgraph-compatible",
      },
      ensIndexerPublicConfig: ENSINDEXER_PUBLIC_CONFIG,
    });
  });

  it("preserves the complete ENSIndexer public config structure", () => {
    const mockConfig = {
      port: ENSApi_DEFAULT_PORT,
      databaseUrl: BASE_ENV.DATABASE_URL,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),
      ensIndexerPublicConfig: ENSINDEXER_PUBLIC_CONFIG,
      namespace: ENSINDEXER_PUBLIC_CONFIG.namespace,
      databaseSchemaName: ENSINDEXER_PUBLIC_CONFIG.databaseSchemaName,
      rpcConfigs: new Map(),
      ensHolidayAwardsStart: ENS_HOLIDAY_AWARDS_START_DATE,
      ensHolidayAwardsEnd: ENS_HOLIDAY_AWARDS_END_DATE,
    };

    const result = buildEnsApiPublicConfig(mockConfig);

    // Verify that all ENSIndexer public config fields are preserved
    expect(result.ensIndexerPublicConfig.namespace).toBe(ENSINDEXER_PUBLIC_CONFIG.namespace);
    expect(result.ensIndexerPublicConfig.plugins).toEqual(ENSINDEXER_PUBLIC_CONFIG.plugins);
    expect(result.ensIndexerPublicConfig.versionInfo).toEqual(ENSINDEXER_PUBLIC_CONFIG.versionInfo);
    expect(result.ensIndexerPublicConfig.indexedChainIds).toEqual(
      ENSINDEXER_PUBLIC_CONFIG.indexedChainIds,
    );
    expect(result.ensIndexerPublicConfig.isSubgraphCompatible).toBe(
      ENSINDEXER_PUBLIC_CONFIG.isSubgraphCompatible,
    );
    expect(result.ensIndexerPublicConfig.labelSet).toEqual(ENSINDEXER_PUBLIC_CONFIG.labelSet);
    expect(result.ensIndexerPublicConfig.databaseSchemaName).toBe(
      ENSINDEXER_PUBLIC_CONFIG.databaseSchemaName,
    );
  });
});
