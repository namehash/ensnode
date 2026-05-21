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

const VALID_ENSDB_URL = "postgresql://user:password@localhost:5432/mydb";
const VALID_ENSINDEXER_SCHEMA_NAME = "ensindexer_test";

describe("ensdb singleton bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("ENSDB_URL", VALID_ENSDB_URL);
    vi.stubEnv("ENSINDEXER_SCHEMA_NAME", VALID_ENSINDEXER_SCHEMA_NAME);
  });

  afterEach(() => {
    di.destroy();
    vi.unstubAllEnvs();
  });

  it("constructs EnsDbReader from real env wiring without errors", async () => {
    di.init();
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
    di.init();
    expect(() => di.context.ensDbClient).toThrow("process.exit");

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
    di.init();
    expect(() => di.context.ensDbClient).toThrow("process.exit");

    expect(logger.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
