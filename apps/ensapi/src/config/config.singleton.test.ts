import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EnsDbReader } from "@ensnode/ensdb-sdk";

import { BASE_ENV } from "@/config/config.schema.mock";
import { buildEnsDbConfigFromEnvironment } from "@/config/ensdb-config";
import logger from "@/lib/logger";

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

describe("ensdb singleton bootstrap", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("constructs EnsDbReader from real env wiring without errors", () => {
    const ensDbConfig = buildEnsDbConfigFromEnvironment(process.env);
    const ensDbClient = new EnsDbReader(ensDbConfig.ensDbUrl, ensDbConfig.ensIndexerSchemaName);

    expect(ensDbClient.ensIndexerSchemaName).toBe(BASE_ENV.ENSINDEXER_SCHEMA_NAME);
    expect(ensDbClient.ensDb).toBeDefined();
    expect(ensDbClient.ensIndexerSchema).toBeDefined();
  });

  it("exits when ENSDB_URL is missing", () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    vi.stubEnv("ENSDB_URL", "");
    expect(() => buildEnsDbConfigFromEnvironment(process.env)).toThrow("process.exit");

    expect(logger.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it("exits when ENSINDEXER_SCHEMA_NAME is missing", () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    vi.stubEnv("ENSINDEXER_SCHEMA_NAME", "");
    expect(() => buildEnsDbConfigFromEnvironment(process.env)).toThrow("process.exit");

    expect(logger.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
