import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import di from "@/di";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
  makeLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
  })),
}));

vi.mock("@ensnode/ensdb-sdk", async (importOriginal) => {
  class MockEnsDbReader {
    ensDb = {
      $client: {
        end: vi.fn().mockResolvedValue(undefined),
      },
    };
    ensIndexerSchema = {};
    ensIndexerSchemaName = "ensindexer_test";
    async isHealthy() {
      return true;
    }
    async destroy() {}
  }

  const mod = await importOriginal<typeof import("@ensnode/ensdb-sdk")>();
  return {
    ...mod,
    EnsDbReader: MockEnsDbReader,
  };
});

vi.mock("@/cache/indexing-status.cache", () => ({
  indexingStatusCache: {
    read: vi.fn().mockResolvedValue({}),
    destroy: vi.fn(),
  },
}));

vi.mock("@/cache/stack-info.cache", () => ({
  stackInfoCache: {
    read: vi.fn().mockResolvedValue({}),
    destroy: vi.fn(),
    peek: vi.fn().mockReturnValue({
      ensIndexer: { namespace: "mainnet" },
    }),
  },
}));

vi.mock("@/cache/referral-program-edition-set.cache", () => ({
  referralProgramEditionConfigSetCache: {
    read: vi.fn().mockResolvedValue({}),
    destroy: vi.fn(),
  },
}));

vi.mock("viem", async (importOriginal) => {
  const mod = await importOriginal<typeof import("viem")>();
  return {
    ...mod,
    createPublicClient: vi.fn().mockReturnValue({
      getBlockNumber: vi.fn().mockResolvedValue(1n),
    }),
  };
});

const VALID_ENSDB_URL = "postgresql://user:password@localhost:5432/mydb";
const VALID_ENSINDEXER_SCHEMA_NAME = "ensindexer_test";

describe("ensdb singleton bootstrap", () => {
  beforeEach(() => {
    vi.stubEnv("ENSDB_URL", VALID_ENSDB_URL);
    vi.stubEnv("ENSINDEXER_SCHEMA_NAME", VALID_ENSINDEXER_SCHEMA_NAME);
    vi.stubEnv("RPC_URL_1", "https://rpc.example.com");
  });

  afterEach(async () => {
    // Restore env before destroying to prevent validation errors during cleanup
    vi.unstubAllEnvs();
    // Destroy might fail if init failed, but we want to clean up regardless
    try {
      await di.destroy();
    } catch {
      // If destroy fails due to process.exit mock or other issues, force reset
      // @ts-expect-error - accessing private member for test cleanup
      di._context = undefined;
    }
  });

  it("constructs EnsDbReader from real env wiring without errors", async () => {
    await di.init();
    const { ensDbClient, ensDb, ensIndexerSchema } = di.context;
    expect(ensDbClient.ensIndexerSchemaName).toBe(VALID_ENSINDEXER_SCHEMA_NAME);
    expect(ensDb).toBeDefined();
    expect(ensIndexerSchema).toBeDefined();
  }, 10_000);

  it("exits when ENSDB_URL is missing", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    const { default: logger } = await import("@/lib/logger");

    vi.stubEnv("ENSDB_URL", "");

    try {
      await expect(di.init()).rejects.toThrow("process.exit");
      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      mockExit.mockRestore();
    }
  });

  it("exits when ENSINDEXER_SCHEMA_NAME is missing", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    const { default: logger } = await import("@/lib/logger");

    vi.stubEnv("ENSINDEXER_SCHEMA_NAME", "");

    try {
      await expect(di.init()).rejects.toThrow("process.exit");
      expect(logger.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      mockExit.mockRestore();
    }
  });
});
