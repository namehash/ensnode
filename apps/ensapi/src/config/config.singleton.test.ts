import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildEnsNodeStackInfo } from "@ensnode/ensnode-sdk";

import { stackInfoCache } from "@/cache/stack-info.cache";
import { buildConfigFromEnvironment, buildEnsApiPublicConfig } from "@/config/config.schema";
import { BASE_ENV, indexingMetadataContextInitialized } from "@/config/config.schema.mock";
import di from "@/di";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  makeLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock("@/cache/stack-info.cache", () => ({
  stackInfoCache: {
    read: vi.fn().mockResolvedValue(undefined),
    peek: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock("@/cache/indexing-status.cache", () => ({
  indexingStatusCache: {
    read: vi.fn().mockResolvedValue(undefined),
    peek: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock("@/cache/referral-program-edition-set.cache", () => ({
  referralProgramEditionConfigSetCache: {
    read: vi.fn().mockResolvedValue(undefined),
    peek: vi.fn(),
    destroy: vi.fn(),
  },
}));

function makeMockStackInfo() {
  const ensApiConfig = buildConfigFromEnvironment(process.env);
  const { ensDb, ensIndexer, ensRainbow } = indexingMetadataContextInitialized.stackInfo;
  return buildEnsNodeStackInfo(
    buildEnsApiPublicConfig(ensApiConfig, ensIndexer),
    ensDb,
    ensIndexer,
    ensRainbow,
  );
}

describe("ensdb singleton bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.mocked(stackInfoCache.peek).mockReturnValue(makeMockStackInfo());
  });

  afterEach(() => {
    di.destroy();
    vi.unstubAllEnvs();
  });

  it("constructs EnsDbReader from real env wiring without errors", async () => {
    await di.init();
    const { ensDbClient, ensDb, ensIndexerSchema } = di.context;
    expect(ensDbClient.ensIndexerSchemaName).toBe(BASE_ENV.ENSINDEXER_SCHEMA_NAME);
    expect(ensDb).toBeDefined();
    expect(ensIndexerSchema).toBeDefined();
  }, 10_000);

  it("exits when ENSDB_URL is missing", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    const { default: logger } = await import("@/lib/logger");

    vi.stubEnv("ENSDB_URL", "");
    await expect(di.init()).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("exits when ENSINDEXER_SCHEMA_NAME is missing", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    const { default: logger } = await import("@/lib/logger");

    vi.stubEnv("ENSINDEXER_SCHEMA_NAME", "");
    await expect(di.init()).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
