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
    ensDb = {};
    ensIndexerSchema = {};
    ensIndexerSchemaName = "ensindexer_test";
    async isHealthy() {
      return true;
    }
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

  afterEach(() => {
    di.destroy();
    vi.unstubAllEnvs();
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
