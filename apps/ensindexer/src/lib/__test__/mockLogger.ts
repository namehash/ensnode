import { vi } from "vitest";

// Set up the global PONDER_COMMON.logger before mocking to allow importOriginal to work
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

(globalThis as any).PONDER_COMMON = { logger: mockLogger };

/**
 * Mock the logger module to avoid the globalThis.PONDER_COMMON check.
 * Uses real implementations for formatLogParam and buildLogError.
 */
vi.mock("@/lib/logger", async (importOriginal) => {
  const { buildLogError, formatLogParam } = await importOriginal<typeof import("@/lib/logger")>();

  return {
    logger: mockLogger,
    formatLogParam,
    buildLogError,
  };
});
