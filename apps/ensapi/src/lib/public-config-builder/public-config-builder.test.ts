import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ENSNamespaceIds,
  type EnsApiPublicConfig,
  type EnsDbClientQuery,
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  type EnsRainbowPublicConfig,
  PluginName,
  type TheGraphFallback,
} from "@ensnode/ensnode-sdk";

import { PublicConfigBuilder } from "./public-config-builder";

// Mock the config module
vi.mock("@/config", () => ({
  default: {
    version: "1.0.0",
    namespace: ENSNamespaceIds.Mainnet,
    theGraphApiKey: "test-api-key",
  },
}));

// Mock the SDK validation functions and canFallbackToTheGraph
vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual =
    await vi.importActual<typeof import("@ensnode/ensnode-sdk")>("@ensnode/ensnode-sdk");
  return {
    ...actual,
    validateEnsApiPublicConfig: vi.fn(),
  };
});

vi.mock("@ensnode/ensnode-sdk/internal", async () => {
  const actual = await vi.importActual<typeof import("@ensnode/ensnode-sdk/internal")>(
    "@ensnode/ensnode-sdk/internal",
  );
  return {
    ...actual,
    canFallbackToTheGraph: vi.fn(),
  };
});

import config from "@/config";

import { validateEnsApiPublicConfig } from "@ensnode/ensnode-sdk";
import { canFallbackToTheGraph } from "@ensnode/ensnode-sdk/internal";

// Test fixtures
const mockEnsRainbowConfig: EnsRainbowPublicConfig = {
  version: "1.0.0",
  labelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
  recordsCount: 1000,
};

const mockVersionInfo: EnsIndexerVersionInfo = {
  nodejs: "v20.0.0",
  ponder: "0.9.0",
  ensDb: "1.0.0",
  ensIndexer: "1.0.0",
  ensNormalize: "1.10.0",
};

const mockEnsIndexerPublicConfig: EnsIndexerPublicConfig = {
  databaseSchemaName: "public",
  labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  ensRainbowPublicConfig: mockEnsRainbowConfig,
  indexedChainIds: new Set([1, 8453]),
  isSubgraphCompatible: true,
  namespace: ENSNamespaceIds.Mainnet,
  plugins: [PluginName.Subgraph],
  versionInfo: mockVersionInfo,
};

const theGraphFallback: TheGraphFallback = {
  canFallback: true,
  url: "https://gateway.thegraph.com/api/wellhereisthekey/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH",
};

const mockEnsApiPublicConfig: EnsApiPublicConfig = {
  version: "1.0.0",
  theGraphFallback,
  ensIndexerPublicConfig: mockEnsIndexerPublicConfig,
};

describe("PublicConfigBuilder", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicConfig()", () => {
    let ensDbClientMock: EnsDbClientQuery;

    beforeEach(() => {
      ensDbClientMock = {
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockEnsIndexerPublicConfig),
      } as unknown as EnsDbClientQuery;

      vi.mocked(canFallbackToTheGraph).mockReturnValue(theGraphFallback);
      vi.mocked(validateEnsApiPublicConfig).mockReturnValue(mockEnsApiPublicConfig);
    });

    it("builds public config on first call", async () => {
      const builder = new PublicConfigBuilder(ensDbClientMock);

      const result = await builder.getPublicConfig();

      expect(ensDbClientMock.getEnsIndexerPublicConfig).toHaveBeenCalledTimes(1);
      expect(canFallbackToTheGraph).toHaveBeenCalledWith({
        namespace: config.namespace,
        theGraphApiKey: "<API_KEY>",
        isSubgraphCompatible: mockEnsIndexerPublicConfig.isSubgraphCompatible,
      });
      expect(validateEnsApiPublicConfig).toHaveBeenCalledWith({
        version: config.version,
        theGraphFallback,
        ensIndexerPublicConfig: mockEnsIndexerPublicConfig,
      });
      expect(result).toBe(mockEnsApiPublicConfig);
    });

    it("caches config and returns same reference on subsequent calls", async () => {
      const builder = new PublicConfigBuilder(ensDbClientMock);

      const result1 = await builder.getPublicConfig();
      const result2 = await builder.getPublicConfig();

      expect(ensDbClientMock.getEnsIndexerPublicConfig).toHaveBeenCalledTimes(1);
      expect(canFallbackToTheGraph).toHaveBeenCalledTimes(1);
      expect(validateEnsApiPublicConfig).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it("masks the API key in theGraphFallback", async () => {
      await new PublicConfigBuilder(ensDbClientMock).getPublicConfig();

      expect(canFallbackToTheGraph).toHaveBeenCalledWith(
        expect.objectContaining({
          theGraphApiKey: "<API_KEY>",
        }),
      );
    });

    it("passes isSubgraphCompatible from ENSIndexer config", async () => {
      const nonSubgraphConfig: EnsIndexerPublicConfig = {
        ...mockEnsIndexerPublicConfig,
        isSubgraphCompatible: false,
      };
      vi.mocked(ensDbClientMock.getEnsIndexerPublicConfig).mockResolvedValue(nonSubgraphConfig);

      const builder = new PublicConfigBuilder(ensDbClientMock);
      await builder.getPublicConfig();

      expect(canFallbackToTheGraph).toHaveBeenCalledWith(
        expect.objectContaining({
          isSubgraphCompatible: false,
        }),
      );
    });

    describe("error handling", () => {
      it("throws when ENSIndexer config is undefined", async () => {
        const ensDbClientMock = {
          getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(undefined),
        } as unknown as EnsDbClientQuery;

        const builder = new PublicConfigBuilder(ensDbClientMock);

        await expect(builder.getPublicConfig()).rejects.toThrow(
          "ENSDb must contain an ENSIndexer Public Config",
        );
        expect(canFallbackToTheGraph).not.toHaveBeenCalled();
        expect(validateEnsApiPublicConfig).not.toHaveBeenCalled();
      });

      it("propagates ENSDb client errors", async () => {
        const dbError = new Error("Database connection failed");
        const ensDbClientMock = {
          getEnsIndexerPublicConfig: vi.fn().mockRejectedValue(dbError),
        } as unknown as EnsDbClientQuery;

        const builder = new PublicConfigBuilder(ensDbClientMock);

        await expect(builder.getPublicConfig()).rejects.toThrow(dbError);
      });

      it("propagates canFallbackToTheGraph errors", async () => {
        const ensDbClientMock = {
          getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockEnsIndexerPublicConfig),
        } as unknown as EnsDbClientQuery;

        const fallbackError = new Error("Invalid namespace");
        vi.mocked(canFallbackToTheGraph).mockImplementation(() => {
          throw fallbackError;
        });

        const builder = new PublicConfigBuilder(ensDbClientMock);

        await expect(builder.getPublicConfig()).rejects.toThrow(fallbackError);
        expect(validateEnsApiPublicConfig).not.toHaveBeenCalled();
      });

      it("propagates validation errors", async () => {
        const ensDbClientMock = {
          getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockEnsIndexerPublicConfig),
        } as unknown as EnsDbClientQuery;

        vi.mocked(canFallbackToTheGraph).mockReturnValue(theGraphFallback);

        const validationError = new Error("Invalid config");
        vi.mocked(validateEnsApiPublicConfig).mockImplementation(() => {
          throw validationError;
        });

        const builder = new PublicConfigBuilder(ensDbClientMock);

        await expect(builder.getPublicConfig()).rejects.toThrow(validationError);
      });
    });
  });

  describe("caching", () => {
    it("each instance has independent cache", async () => {
      const config1: EnsApiPublicConfig = { ...mockEnsApiPublicConfig, version: "1.0.0" };
      const config2: EnsApiPublicConfig = { ...mockEnsApiPublicConfig, version: "2.0.0" };

      let callCount = 0;
      const ensDbClientMock = {
        getEnsIndexerPublicConfig: vi.fn().mockResolvedValue(mockEnsIndexerPublicConfig),
      } as unknown as EnsDbClientQuery;

      vi.mocked(validateEnsApiPublicConfig).mockImplementation(() => {
        return ++callCount === 1 ? config1 : config2;
      });

      const builder1 = new PublicConfigBuilder(ensDbClientMock);
      const result1 = await builder1.getPublicConfig();

      const builder2 = new PublicConfigBuilder(ensDbClientMock);
      const result2 = await builder2.getPublicConfig();

      expect(ensDbClientMock.getEnsIndexerPublicConfig).toHaveBeenCalledTimes(2);
      expect(result1).toBe(config1);
      expect(result2).toBe(config2);
    });

    it("retries after failure", async () => {
      const ensDbClientMock = {
        getEnsIndexerPublicConfig: vi
          .fn()
          .mockRejectedValueOnce(new Error("DB down"))
          .mockResolvedValueOnce(mockEnsIndexerPublicConfig),
      } as unknown as EnsDbClientQuery;

      vi.mocked(canFallbackToTheGraph).mockReturnValue(theGraphFallback);
      vi.mocked(validateEnsApiPublicConfig).mockReturnValue(mockEnsApiPublicConfig);

      const builder = new PublicConfigBuilder(ensDbClientMock);

      await expect(builder.getPublicConfig()).rejects.toThrow("DB down");

      const result = await builder.getPublicConfig();

      expect(ensDbClientMock.getEnsIndexerPublicConfig).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockEnsApiPublicConfig);
    });
  });
});
