import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOG_LEVEL } from "./config";
import { createLogger } from "./logger";

describe("logger", () => {
  describe("createLogger", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    afterEach(() => {
      if (originalNodeEnv) {
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it("should create logger with default level when no level provided", () => {
      const logger = createLogger();
      expect(logger.level).toBe(DEFAULT_LOG_LEVEL);
    });

    it("should create logger with specified level", () => {
      const logger = createLogger("debug");
      expect(logger.level).toBe("debug");
    });
  });
});
