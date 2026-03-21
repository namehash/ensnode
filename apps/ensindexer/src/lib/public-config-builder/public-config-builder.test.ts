import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ENSNamespaceIds,
  type EnsIndexerPublicConfig,
  type EnsIndexerVersionInfo,
  type EnsRainbowPublicConfig,
  PluginName,
} from "@ensnode/ensnode-sdk";
import type { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

import { PublicConfigBuilder } from "./public-config-builder";

// Mock the config module
vi.mock("@/config", () => ({
  default: {
    databaseSchemaName: "public",
    labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
    indexedChainIds: new Set([1, 8453]),
    isSubgraphCompatible: true,
    namespace: ENSNamespaceIds.Mainnet,
    plugins: [PluginName.Subgraph],
  },
}));

// Mock the version-info module
vi.mock("@/lib/version-info", () => ({
  getEnsIndexerVersion: vi.fn(),
  getNodeJsVersion: vi.fn(),
  getPackageVersion: vi.fn(),
}));

// Mock the SDK validation functions
vi.mock("@ensnode/ensnode-sdk", async () => {
  const actual =
    await vi.importActual<typeof import("@ensnode/ensnode-sdk")>("@ensnode/ensnode-sdk");
  return {
    ...actual,
    validateEnsIndexerPublicConfig: vi.fn(),
    validateEnsIndexerVersionInfo: vi.fn(),
  };
});

import config from "@/config";

import {
  validateEnsIndexerPublicConfig,
  validateEnsIndexerVersionInfo,
} from "@ensnode/ensnode-sdk";

import { getEnsIndexerVersion, getNodeJsVersion, getPackageVersion } from "@/lib/version-info";

// Test fixtures
const mockEnsRainbowConfig: EnsRainbowPublicConfig = {
  version: "1.0.0",
  labelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
  recordsCount: 1000,
};

const mockVersionInfo: EnsIndexerVersionInfo = {
  nodejs: "20.0.0",
  ponder: "0.9.0",
  ensDb: "1.0.0",
  ensIndexer: "1.0.0",
  ensNormalize: "1.10.0",
};

// Helper to create unique mock config objects for each call
function createMockPublicConfig(overrides: Partial<EnsIndexerPublicConfig> = {}) {
  return {
    databaseSchemaName: "public",
    labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
    ensRainbowPublicConfig: mockEnsRainbowConfig,
    indexedChainIds: new Set([1, 8453]),
    isSubgraphCompatible: true,
    namespace: ENSNamespaceIds.Mainnet,
    plugins: ["subgraph"],
    versionInfo: mockVersionInfo,
    ...overrides,
  } as EnsIndexerPublicConfig;
}

// Helper to setup standard mocks
function setupStandardMocks() {
  vi.mocked(getEnsIndexerVersion).mockReturnValue("1.0.0");
  vi.mocked(getNodeJsVersion).mockReturnValue("20.0.0");
  vi.mocked(getPackageVersion).mockReturnValue("0.9.0");
  vi.mocked(validateEnsIndexerVersionInfo).mockReturnValue(mockVersionInfo);
}

describe("PublicConfigBuilder", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicConfig() - successful builds", () => {
    it("builds and returns public config on first call", async () => {
      // Arrange
      const ensRainbowClientMock = {
        config: vi.fn().mockResolvedValue(mockEnsRainbowConfig),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();
      const mockPublicConfig = createMockPublicConfig();
      vi.mocked(validateEnsIndexerPublicConfig).mockReturnValue(mockPublicConfig);

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act
      const result = await builder.getPublicConfig();

      // Assert
      expect(ensRainbowClientMock.config).toHaveBeenCalledTimes(1);
      expect(getEnsIndexerVersion).toHaveBeenCalledTimes(1);
      expect(getNodeJsVersion).toHaveBeenCalledTimes(1);
      expect(getPackageVersion).toHaveBeenCalledWith("ponder");
      expect(getPackageVersion).toHaveBeenCalledWith("@adraffy/ens-normalize");

      expect(validateEnsIndexerVersionInfo).toHaveBeenCalledWith({
        nodejs: "20.0.0",
        ponder: "0.9.0",
        ensDb: "1.0.0",
        ensIndexer: "1.0.0",
        ensNormalize: "0.9.0",
      });

      expect(validateEnsIndexerPublicConfig).toHaveBeenCalledWith({
        databaseSchemaName: config.databaseSchemaName,
        ensRainbowPublicConfig: mockEnsRainbowConfig,
        labelSet: config.labelSet,
        indexedChainIds: config.indexedChainIds,
        isSubgraphCompatible: config.isSubgraphCompatible,
        namespace: config.namespace,
        plugins: config.plugins,
        versionInfo: mockVersionInfo,
      });

      expect(result).toBe(mockPublicConfig);
    });

    it("caches public config and returns cached version on subsequent calls", async () => {
      // Arrange
      const ensRainbowClientMock = {
        config: vi.fn().mockResolvedValue(mockEnsRainbowConfig),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();
      const mockPublicConfig = createMockPublicConfig();
      vi.mocked(validateEnsIndexerPublicConfig).mockReturnValue(mockPublicConfig);

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act
      const result1 = await builder.getPublicConfig();
      const result2 = await builder.getPublicConfig();
      const result3 = await builder.getPublicConfig();

      // Assert
      expect(ensRainbowClientMock.config).toHaveBeenCalledTimes(1);
      expect(getEnsIndexerVersion).toHaveBeenCalledTimes(1);
      expect(getNodeJsVersion).toHaveBeenCalledTimes(1);
      expect(getPackageVersion).toHaveBeenCalledTimes(2);
      expect(validateEnsIndexerVersionInfo).toHaveBeenCalledTimes(1);
      expect(validateEnsIndexerPublicConfig).toHaveBeenCalledTimes(1);

      // All results should be the same cached object
      expect(result1).toBe(mockPublicConfig);
      expect(result2).toBe(mockPublicConfig);
      expect(result3).toBe(mockPublicConfig);
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it("handles different plugin configurations", async () => {
      // Arrange
      const customConfig = createMockPublicConfig({
        plugins: ["basenames", "lineanames", "subgraph"],
        indexedChainIds: new Set([1, 8453, 59144]),
      });

      const ensRainbowClientMock = {
        config: vi.fn().mockResolvedValue(mockEnsRainbowConfig),
      } as unknown as EnsRainbowApiClient;

      vi.mocked(getEnsIndexerVersion).mockReturnValue("2.0.0");
      vi.mocked(getNodeJsVersion).mockReturnValue("22.0.0");
      vi.mocked(getPackageVersion).mockReturnValue("1.0.0");

      const customVersionInfo: EnsIndexerVersionInfo = {
        nodejs: "22.0.0",
        ponder: "1.0.0",
        ensDb: "2.0.0",
        ensIndexer: "2.0.0",
        ensNormalize: "1.10.0",
      };

      vi.mocked(validateEnsIndexerVersionInfo).mockReturnValue(customVersionInfo);
      vi.mocked(validateEnsIndexerPublicConfig).mockReturnValue(customConfig);

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act
      const result = await builder.getPublicConfig();

      // Assert
      expect(result).toBe(customConfig);
      expect(result.plugins).toHaveLength(3);
    });

    it("handles non-subgraph-compatible mode", async () => {
      // Arrange
      const customConfig = createMockPublicConfig({
        isSubgraphCompatible: false,
        labelSet: { labelSetId: "custom", labelSetVersion: 1 },
      });

      const customEnsRainbowConfig: EnsRainbowPublicConfig = {
        version: "1.0.0",
        labelSet: { labelSetId: "custom", highestLabelSetVersion: 1 },
        recordsCount: 2000,
      };

      const ensRainbowClientMock = {
        config: vi.fn().mockResolvedValue(customEnsRainbowConfig),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();
      vi.mocked(validateEnsIndexerPublicConfig).mockReturnValue(customConfig);

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act
      const result = await builder.getPublicConfig();

      // Assert
      expect(result).toBe(customConfig);
      expect(result.isSubgraphCompatible).toBe(false);
    });
  });

  describe("getPublicConfig() - error handling", () => {
    it("throws when ENSRainbow client config() fails", async () => {
      // Arrange
      const ensRainbowError = new Error("ENSRainbow service unavailable");
      const ensRainbowClientMock = {
        config: vi.fn().mockRejectedValue(ensRainbowError),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act & Assert
      await expect(builder.getPublicConfig()).rejects.toThrow(ensRainbowError);
      expect(ensRainbowClientMock.config).toHaveBeenCalledTimes(1);
      expect(validateEnsIndexerPublicConfig).not.toHaveBeenCalled();
    });

    it("throws when version info validation fails", async () => {
      // Arrange
      const ensRainbowClientMock = {
        config: vi.fn().mockResolvedValue(mockEnsRainbowConfig),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();

      const validationError = new Error("Invalid version info: missing required fields");
      vi.mocked(validateEnsIndexerVersionInfo).mockImplementation(() => {
        throw validationError;
      });

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act & Assert
      await expect(builder.getPublicConfig()).rejects.toThrow(validationError);
      expect(validateEnsIndexerVersionInfo).toHaveBeenCalledTimes(1);
      expect(validateEnsIndexerPublicConfig).not.toHaveBeenCalled();
    });

    it("throws when public config validation fails", async () => {
      // Arrange
      const ensRainbowClientMock = {
        config: vi.fn().mockResolvedValue(mockEnsRainbowConfig),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();

      const validationError = new Error("Invalid public config: invalid namespace");
      vi.mocked(validateEnsIndexerPublicConfig).mockImplementation(() => {
        throw validationError;
      });

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act & Assert
      await expect(builder.getPublicConfig()).rejects.toThrow(validationError);
      expect(validateEnsIndexerPublicConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe("Caching behavior", () => {
    it("each builder instance has its own independent cache", async () => {
      // Arrange - create unique config objects for each builder
      const config1 = createMockPublicConfig({ databaseSchemaName: "schema1" });
      const config2 = createMockPublicConfig({ databaseSchemaName: "schema2" });

      let callCount = 0;
      const ensRainbowClientMock = {
        config: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve(mockEnsRainbowConfig);
        }),
      } as unknown as EnsRainbowApiClient;

      setupStandardMocks();

      // Return different configs for each builder instance
      vi.mocked(validateEnsIndexerPublicConfig).mockImplementation(() => {
        return callCount === 1 ? config1 : config2;
      });

      // Act
      const builder1 = new PublicConfigBuilder(ensRainbowClientMock);
      const result1 = await builder1.getPublicConfig();

      const builder2 = new PublicConfigBuilder(ensRainbowClientMock);
      const result2 = await builder2.getPublicConfig();

      // Assert - each builder should have fetched and cached its own config independently
      expect(ensRainbowClientMock.config).toHaveBeenCalledTimes(2);
      expect(result1).toBe(config1);
      expect(result2).toBe(config2);
      expect(result1).not.toBe(result2);
      expect(result1.databaseSchemaName).toBe("schema1");
      expect(result2.databaseSchemaName).toBe("schema2");
    });

    it("retries building config on subsequent calls after failure", async () => {
      // Arrange
      const ensRainbowClientMock = {
        config: vi.fn().mockRejectedValueOnce(new Error("ENSRainbow down")),
      } as unknown as EnsRainbowApiClient;

      const builder = new PublicConfigBuilder(ensRainbowClientMock);

      // Act & Assert - first call fails
      await expect(builder.getPublicConfig()).rejects.toThrow("ENSRainbow down");

      // Simulate recovery
      vi.mocked(ensRainbowClientMock.config).mockResolvedValue(mockEnsRainbowConfig);
      setupStandardMocks();
      const mockPublicConfig = createMockPublicConfig();
      vi.mocked(validateEnsIndexerPublicConfig).mockReturnValue(mockPublicConfig);

      // Second call should succeed
      const result = await builder.getPublicConfig();

      // Assert
      expect(ensRainbowClientMock.config).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockPublicConfig);
    });
  });
});
