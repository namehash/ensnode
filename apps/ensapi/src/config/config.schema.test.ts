import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

import {
  buildConfigFromEnvironment,
  buildEnsApiPublicConfig,
  buildRootChainRpcConfig,
} from "@/config/config.schema";
import { BASE_ENV, indexingMetadataContextInitialized } from "@/config/config.schema.mock";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import logger from "@/lib/logger";
import { ensApiVersionInfo } from "@/lib/version-info";

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

    const config = buildConfigFromEnvironment(BASE_ENV);

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();

    expect(config).toStrictEqual({
      port: ENSApi_DEFAULT_PORT,
      theGraphApiKey: undefined,
      referralProgramEditionConfigSetUrl: undefined,
    });
  });

  it("parses REFERRAL_PROGRAM_EDITIONS as a URL object", async () => {
    const exitSpy = mockProcessExit();
    const editionsUrl = "https://example.com/editions.json";

    const config = buildConfigFromEnvironment({
      ...BASE_ENV,
      REFERRAL_PROGRAM_EDITIONS: editionsUrl,
    });

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();

    expect(config.referralProgramEditionConfigSetUrl).toEqual(new URL(editionsUrl));
  });

  it("includes theGraphApiKey when provided", async () => {
    const exitSpy = mockProcessExit();

    const config = buildConfigFromEnvironment({
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

      expect(() =>
        buildConfigFromEnvironment({
          ...testEnv,
          REFERRAL_PROGRAM_EDITIONS: "not-a-url",
        }),
      ).toThrow("process.exit");

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining("REFERRAL_PROGRAM_EDITIONS is not a valid URL: not-a-url"),
      );
      expect(process.exit).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing endpoint name)", async () => {
      const testEnv = structuredClone(BASE_ENV);

      expect(() =>
        buildRootChainRpcConfig(
          {
            ...testEnv,
            QUICKNODE_API_KEY: "my-api-key",
          },
          ENSNamespaceIds.Mainnet,
        ),
      ).toThrow("process.exit");

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        new Error(
          "Use of the QUICKNODE_API_KEY environment variable requires use of the QUICKNODE_ENDPOINT_NAME environment variable as well.",
        ),
        "Failed to build the root chain RPC config",
      );
      expect(process.exit).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing API key)", async () => {
      const testEnv = structuredClone(BASE_ENV);

      expect(() =>
        buildRootChainRpcConfig(
          {
            ...testEnv,
            QUICKNODE_ENDPOINT_NAME: "my-endpoint-name",
          },
          ENSNamespaceIds.Mainnet,
        ),
      ).toThrow("process.exit");

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        new Error(
          "Use of the QUICKNODE_ENDPOINT_NAME environment variable requires use of the QUICKNODE_API_KEY environment variable as well.",
        ),
        "Failed to build the root chain RPC config",
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
      theGraphApiKey: "my-api-key",
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
