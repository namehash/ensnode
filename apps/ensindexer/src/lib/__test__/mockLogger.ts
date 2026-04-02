import { vi } from "vitest";

/**
 * Mock the logger module to avoid the globalThis.PONDER_COMMON check.
 */
export function setupLoggerMock() {
  vi.mock("@/lib/logger", () => ({
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    formatLogParam: vi.fn((param: unknown) => JSON.stringify(param)),
  }));
}
