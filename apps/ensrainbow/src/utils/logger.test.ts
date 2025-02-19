import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LOG_LEVEL,
  VALID_LOG_LEVELS,
  createLogger,
  getEnvLogLevel,
  parseLogLevel,
} from "./logger";

describe("logger", () => {
  describe("parseLogLevel", () => {
    it("should accept valid log levels", () => {
      VALID_LOG_LEVELS.forEach((level) => {
        expect(parseLogLevel(level)).toBe(level);
      });
    });

    it("should handle case-insensitive input", () => {
      expect(parseLogLevel("INFO")).toBe("info");
      expect(parseLogLevel("Debug")).toBe("debug");
      expect(parseLogLevel("ERROR")).toBe("error");
    });

    it("should throw error for invalid log level", () => {
      expect(() => parseLogLevel("invalid")).toThrow(
        'Invalid log level "invalid". Valid levels are: fatal, error, warn, info, debug, trace, silent',
      );
    });
  });

  describe("getEnvLogLevel", () => {
    const originalEnv = process.env.LOG_LEVEL;

    beforeEach(() => {
      // Clear LOG_LEVEL before each test
      delete process.env.LOG_LEVEL;
    });

    afterEach(() => {
      // Restore original LOG_LEVEL after each test
      if (originalEnv) {
        process.env.LOG_LEVEL = originalEnv;
      } else {
        delete process.env.LOG_LEVEL;
      }
    });

    it("should return DEFAULT_LOG_LEVEL when LOG_LEVEL is not set", () => {
      expect(getEnvLogLevel()).toBe(DEFAULT_LOG_LEVEL);
    });

    it("should return valid log level from environment", () => {
      process.env.LOG_LEVEL = "debug";
      expect(getEnvLogLevel()).toBe("debug");
    });

    it("should error when invalid log level in environment", () => {
      process.env.LOG_LEVEL = "invalid";
      expect(() => getEnvLogLevel()).toThrow(
        'Environment variable error: (LOG_LEVEL): Invalid log level "invalid". Valid levels are: fatal, error, warn, info, debug, trace, silent.',
      );
    });
  });

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
