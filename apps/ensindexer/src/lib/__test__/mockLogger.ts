import { vi } from "vitest";

// Set up the global PONDER_COMMON.logger before mocking to allow importOriginal to work
const mockLogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

(globalThis as any).PONDER_COMMON = { logger: mockLogger };

/**
 * Mock the logger module to avoid the globalThis.PONDER_COMMON check.
 */
vi.mock("@/lib/logger", async () => {
  return {
    logger: mockLogger,
  };
});
