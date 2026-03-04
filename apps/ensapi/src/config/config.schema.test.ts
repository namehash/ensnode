import packageJson from "@/../package.json" with { type: "json" };

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ENSIndexerPublicConfig,
  PluginName,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
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
  ensRainbowPublicConfig: {
    version: packageJson.version,
    labelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
    recordsCount: 100,
  },
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: false,
  labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  plugins: [PluginName.Subgraph],
  versionInfo: {
    ensDb: packageJson.version,
    ensIndexer: packageJson.version,
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
      customReferralProgramEditionConfigSetUrl: undefined,
    });
  });

  it("parses CUSTOM_REFERRAL_PROGRAM_EDITIONS as a URL object", async () => {
    const customUrl = "https://example.com/editions.json";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(serializeENSIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG)),
    });

    const config = await buildConfigFromEnvironment({
      ...BASE_ENV,
      CUSTOM_REFERRAL_PROGRAM_EDITIONS: customUrl,
    });

    expect(config.customReferralProgramEditionConfigSetUrl).toEqual(new URL(customUrl));
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

    it("logs error and exits when CUSTOM_REFERRAL_PROGRAM_EDITIONS is not a valid URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serializeENSIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG)),
      });

      await buildConfigFromEnvironment({
        ...TEST_ENV,
        CUSTOM_REFERRAL_PROGRAM_EDITIONS: "not-a-url",
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("CUSTOM_REFERRAL_PROGRAM_EDITIONS is not a valid URL: not-a-url"),
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

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
