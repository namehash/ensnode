import { afterEach, describe, expect, it, vi } from "vitest";

import type { LogLevelEnvironment } from "./config/environments";
import { getLogLevelFromEnv } from "./log-level";

describe("logger", () => {
  describe("getLogLevelFromEnv", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should return default when LOG_LEVEL is not set", () => {
      vi.stubEnv("LOG_LEVEL", undefined);
      expect(getLogLevelFromEnv(process.env as LogLevelEnvironment, "debug")).toBe("debug");
    });

    it("should return valid log level from environment", () => {
      vi.stubEnv("LOG_LEVEL", "warn");
      expect(getLogLevelFromEnv(process.env as LogLevelEnvironment, "warn")).toBe("warn");
    });

    it("should return default when invalid log level in environment", () => {
      vi.stubEnv("LOG_LEVEL", "invalid");
      expect(getLogLevelFromEnv(process.env as LogLevelEnvironment, "debug")).toBe("debug");
    });
  });
});
