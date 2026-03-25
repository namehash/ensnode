import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const VALID_DB_URL = "postgresql://user:password@localhost:5432/mydb";
const VALID_SCHEMA_NAME = "ensapi";

describe("ensdb singleton bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", VALID_DB_URL);
    vi.stubEnv("ENSINDEXER_SCHEMA_NAME", VALID_SCHEMA_NAME);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("constructs EnsDbReader from real env wiring without errors", async () => {
    const { EnsDbReader } = await import("@ensnode/ensdb-sdk");
    const { ensDbClient, ensDb, ensIndexerSchema } = await import("@/lib/ensdb/singleton");

    expect(ensDbClient).toBeInstanceOf(EnsDbReader);
    expect(ensDb).toBeDefined();
    expect(ensIndexerSchema).toBeDefined();
  });

  it("exits when DATABASE_URL is missing", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    const { default: logger } = await import("@/lib/logger");

    vi.stubEnv("DATABASE_URL", "");
    await expect(import("@/lib/ensdb/singleton")).rejects.toThrow("process.exit");

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
    await expect(import("@/lib/ensdb/singleton")).rejects.toThrow("process.exit");

    expect(logger.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
