import { accessSync, existsSync } from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOG_LEVEL, DEFAULT_PORT, VALID_LOG_LEVELS } from "./config";
import {
  getDataDir,
  getDefaultDataDir,
  getDefaultInputFile,
  getEnvDirPath,
  getEnvFilePath,
  getEnvNonNegativeInteger,
  getEnvPort,
  getEnvString,
  getInputFile,
  getLogLevel,
  getPort,
  isProduction,
  validatePortConfiguration,
} from "./env-utils";

// mock fs functions
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  accessSync: vi.fn(),
  constants: {
    R_OK: 4,
  },
}));

// mock path.join
vi.mock("path", () => ({
  join: vi.fn((...args) => args.join("/")),
}));

describe("env-utils", () => {
  // save original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // create a copy of process.env
    process.env = { ...originalEnv };
    // mock process.cwd
    vi.spyOn(process, "cwd").mockReturnValue("/mock/cwd");
    // reset mocks
    vi.mocked(existsSync).mockReset();
    vi.mocked(accessSync).mockReset();
  });

  afterEach(() => {
    // restore process.env
    process.env = originalEnv;
    // restore process.cwd
    vi.mocked(process.cwd).mockRestore();
  });

  describe("getEnvString", () => {
    it("should return the environment variable value if set", () => {
      process.env.TEST_VAR = "test-value";
      expect(getEnvString("TEST_VAR")).toBe("test-value");
    });

    it("should return the default value if the environment variable is not set", () => {
      expect(getEnvString("NONEXISTENT_VAR", "default-value")).toBe("default-value");
    });

    it("should throw an error if the environment variable is not set and no default is provided", () => {
      expect(() => getEnvString("NONEXISTENT_VAR")).toThrow(
        "Environment variable error: (NONEXISTENT_VAR): Environment variable 'NONEXISTENT_VAR' is not set and no default value was provided.",
      );
    });

    it("should validate the value if a validator is provided", () => {
      process.env.TEST_VAR = "valid";
      const validator = (value: string) => value === "valid";
      expect(getEnvString("TEST_VAR", undefined, validator)).toBe("valid");
    });

    it("should throw an error if validation fails with boolean result", () => {
      process.env.TEST_VAR = "invalid";
      const validator = (value: string) => value === "valid";
      expect(() => getEnvString("TEST_VAR", undefined, validator)).toThrow(
        "Environment variable error: (TEST_VAR): Invalid value 'invalid' for environment variable 'TEST_VAR'.",
      );
    });

    it("should throw an error with custom message if validation fails with string result", () => {
      process.env.TEST_VAR = "invalid";
      const validator = (value: string) => (value === "valid" ? true : "Custom error message");
      expect(() => getEnvString("TEST_VAR", undefined, validator)).toThrow(
        "Environment variable error: (TEST_VAR): Custom error message",
      );
    });
  });

  describe("getEnvNonNegativeInteger", () => {
    it("should return the parsed number if the environment variable is a valid non-negative integer", () => {
      process.env.TEST_NUM = "42";
      expect(getEnvNonNegativeInteger("TEST_NUM")).toBe(42);
    });

    it("should return the default value if the environment variable is not set", () => {
      expect(getEnvNonNegativeInteger("NONEXISTENT_NUM", 42)).toBe(42);
    });

    it("should throw an error if the environment variable is not set and no default is provided", () => {
      expect(() => getEnvNonNegativeInteger("NONEXISTENT_NUM")).toThrow(
        "Environment variable error: (NONEXISTENT_NUM): Environment variable 'NONEXISTENT_NUM' is not set and no default value was provided.",
      );
    });

    it("should throw an error if the environment variable is not a valid number", () => {
      process.env.TEST_NUM = "not-a-number";
      expect(() => getEnvNonNegativeInteger("TEST_NUM")).toThrow(
        'Environment variable error: (TEST_NUM): "not-a-number" is not a valid number',
      );
    });

    it("should throw an error if the environment variable is a negative number", () => {
      process.env.TEST_NUM = "-42";
      expect(() => getEnvNonNegativeInteger("TEST_NUM")).toThrow(
        'Environment variable error: (TEST_NUM): "-42" is not a non-negative integer',
      );
    });

    it("should throw an error if the environment variable is negative zero", () => {
      process.env.TEST_NUM = "-0";
      expect(() => getEnvNonNegativeInteger("TEST_NUM")).toThrow(
        "Environment variable error: (TEST_NUM): Negative zero is not a valid non-negative integer",
      );
    });

    it("should throw an error if the environment variable is a floating-point number", () => {
      process.env.TEST_NUM = "42.5";
      expect(() => getEnvNonNegativeInteger("TEST_NUM")).toThrow(
        'Environment variable error: (TEST_NUM): "42.5" is not an integer',
      );
    });
  });

  describe("getEnvFilePath", () => {
    it("should return the file path if the file exists and is readable", () => {
      process.env.TEST_FILE = "/path/to/file";
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(getEnvFilePath("TEST_FILE")).toBe("/path/to/file");
      expect(existsSync).toHaveBeenCalledWith("/path/to/file");
      expect(accessSync).toHaveBeenCalled();
    });

    it("should return the default file path if the environment variable is not set", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(getEnvFilePath("NONEXISTENT_FILE", "/default/path")).toBe("/default/path");
      expect(existsSync).toHaveBeenCalledWith("/default/path");
    });

    it("should throw an error if the file does not exist and should_exist is true", () => {
      process.env.TEST_FILE = "/path/to/nonexistent/file";
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => getEnvFilePath("TEST_FILE")).toThrow(
        "Environment variable error: (TEST_FILE): File '/path/to/nonexistent/file' does not exist.",
      );
    });

    it("should not throw an error if the file does not exist but should_exist is false", () => {
      process.env.TEST_FILE = "/path/to/nonexistent/file";
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getEnvFilePath("TEST_FILE", undefined, false)).toBe("/path/to/nonexistent/file");
      expect(existsSync).toHaveBeenCalledWith("/path/to/nonexistent/file");
      expect(accessSync).not.toHaveBeenCalled();
    });

    it("should throw an error if the file is not readable and should_be_readable is true", () => {
      process.env.TEST_FILE = "/path/to/unreadable/file";
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(() => getEnvFilePath("TEST_FILE")).toThrow(
        "Environment variable error: (TEST_FILE): File '/path/to/unreadable/file' is not readable.",
      );
    });

    it("should not throw an error if the file is not readable but should_be_readable is false", () => {
      process.env.TEST_FILE = "/path/to/unreadable/file";
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(getEnvFilePath("TEST_FILE", undefined, true, false)).toBe("/path/to/unreadable/file");
      expect(existsSync).toHaveBeenCalledWith("/path/to/unreadable/file");
      expect(accessSync).not.toHaveBeenCalled();
    });
  });

  describe("getEnvDirPath", () => {
    it("should return the directory path if the directory exists", () => {
      process.env.TEST_DIR = "/path/to/dir";
      vi.mocked(existsSync).mockReturnValue(true);

      expect(getEnvDirPath("TEST_DIR")).toBe("/path/to/dir");
      expect(existsSync).toHaveBeenCalledWith("/path/to/dir");
    });

    it("should return the default directory path if the environment variable is not set", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      expect(getEnvDirPath("NONEXISTENT_DIR", "/default/dir")).toBe("/default/dir");
      expect(existsSync).toHaveBeenCalledWith("/default/dir");
    });

    it("should throw an error if the directory does not exist and allowNonExistent is false", () => {
      process.env.TEST_DIR = "/path/to/nonexistent/dir";
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => getEnvDirPath("TEST_DIR")).toThrow(
        "Environment variable error: (TEST_DIR): Directory '/path/to/nonexistent/dir' does not exist.",
      );
    });

    it("should return the directory path if the directory does not exist but allowNonExistent is true", () => {
      process.env.TEST_DIR = "/path/to/nonexistent/dir";
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getEnvDirPath("TEST_DIR", undefined, true)).toBe("/path/to/nonexistent/dir");
    });
  });

  describe("getEnvPort", () => {
    it("should return the port number if the environment variable is a valid port", () => {
      process.env.TEST_PORT = "8080";
      expect(getEnvPort("TEST_PORT")).toBe(8080);
    });

    it("should return the default port if the environment variable is not set", () => {
      expect(getEnvPort("NONEXISTENT_PORT", 9090)).toBe(9090);
    });

    it("should throw an error if the port is out of range (negative)", () => {
      process.env.TEST_PORT = "-1";
      expect(() => getEnvPort("TEST_PORT")).toThrow(
        'Environment variable error: (TEST_PORT): "-1" is not a non-negative integer',
      );
    });

    it("should throw an error if the port is out of range (too large)", () => {
      process.env.TEST_PORT = "70000";
      expect(() => getEnvPort("TEST_PORT")).toThrow(
        "Environment variable error: (TEST_PORT): Port number 70000 is out of range. Port must be between 0 and 65535.",
      );
    });
  });

  describe("getDataDir", () => {
    it("should return the DATA_DIR environment variable if set", () => {
      process.env.DATA_DIR = "/custom/data/dir";
      vi.mocked(existsSync).mockReturnValue(true);

      expect(getDataDir()).toBe("/custom/data/dir");
    });

    it("should return the default data directory if DATA_DIR is not set", () => {
      delete process.env.DATA_DIR;
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getDataDir()).toBe("/mock/cwd/data");
      expect(path.join).toHaveBeenCalledWith("/mock/cwd", "data");
    });
  });

  describe("getInputFile", () => {
    it("should return the INPUT_FILE environment variable if set", () => {
      process.env.INPUT_FILE = "/custom/input/file.gz";
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(getInputFile()).toBe("/custom/input/file.gz");
    });

    it("should return the default input file if INPUT_FILE is not set", () => {
      delete process.env.INPUT_FILE;
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(getInputFile()).toBe("/mock/cwd/ens_names.sql.gz");
      expect(path.join).toHaveBeenCalledWith("/mock/cwd", "ens_names.sql.gz");
    });

    it("should not check if the file exists when should_exist is false", () => {
      process.env.INPUT_FILE = "/nonexistent/input/file.gz";
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getInputFile(false)).toBe("/nonexistent/input/file.gz");
      expect(existsSync).toHaveBeenCalledWith("/nonexistent/input/file.gz");
      expect(accessSync).not.toHaveBeenCalled();
    });

    it("should not check if the file is readable when should_be_readable is false", () => {
      process.env.INPUT_FILE = "/unreadable/input/file.gz";
      vi.mocked(existsSync).mockReturnValue(true);

      expect(getInputFile(true, false)).toBe("/unreadable/input/file.gz");
      expect(existsSync).toHaveBeenCalledWith("/unreadable/input/file.gz");
      expect(accessSync).not.toHaveBeenCalled();
    });
  });

  describe("getPort", () => {
    it("should return the PORT environment variable if set", () => {
      process.env.PORT = "8080";
      expect(getPort()).toBe(8080);
    });

    it("should return the default port if PORT is not set", () => {
      delete process.env.PORT;
      expect(getPort()).toBe(DEFAULT_PORT);
    });
  });

  describe("default values", () => {
    it("should return the correct default data directory", () => {
      expect(getDefaultDataDir()).toBe("/mock/cwd/data");
    });

    it("should return the correct default input file", () => {
      expect(getDefaultInputFile()).toBe("/mock/cwd/ens_names.sql.gz");
    });
  });

  describe("validatePortConfiguration", () => {
    it("should not throw an error if the CLI port matches the environment variable port", () => {
      process.env.PORT = "8080";
      expect(() => validatePortConfiguration(8080)).not.toThrow();
    });

    it("should not throw an error if the environment variable is not set", () => {
      delete process.env.PORT;
      expect(() => validatePortConfiguration(3000)).not.toThrow();
    });

    it("should not throw an error if the environment variable is the default port", () => {
      process.env.PORT = DEFAULT_PORT.toString();
      expect(() => validatePortConfiguration(3000)).not.toThrow();
    });

    it("should throw an error if the CLI port does not match the environment variable port", () => {
      process.env.PORT = "8080";
      expect(() => validatePortConfiguration(3000)).toThrow(
        "Port conflict: Command line argument (3000) differs from PORT environment variable (8080). " +
          "Please use only one method to specify the port.",
      );
    });
  });

  describe("getLogLevel", () => {
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
      expect(getLogLevel()).toBe(DEFAULT_LOG_LEVEL);
    });

    it("should return log level from environment variable", () => {
      process.env.LOG_LEVEL = "debug";
      expect(getLogLevel()).toBe("debug");
    });

    it("should error when invalid log level in environment", () => {
      process.env.LOG_LEVEL = "invalid";
      expect(() => getLogLevel()).toThrow(
        'Environment variable error: (LOG_LEVEL): Invalid log level "invalid". Valid levels are: fatal, error, warn, info, debug, trace, silent.',
      );
    });
  });

  describe("isProduction", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      // Restore original NODE_ENV after each test
      if (originalNodeEnv) {
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it("should return true when NODE_ENV is 'production'", () => {
      process.env.NODE_ENV = "production";
      expect(isProduction()).toBe(true);
    });

    it("should return false when NODE_ENV is not 'production'", () => {
      process.env.NODE_ENV = "development";
      expect(isProduction()).toBe(false);
    });

    it("should return false when NODE_ENV is not set", () => {
      delete process.env.NODE_ENV;
      expect(isProduction()).toBe(false);
    });
  });

  describe("nested environment variable error handling", () => {
    it("should not duplicate error prefixes when getEnvFilePath calls getEnvString", () => {
      // This test verifies that when getEnvFilePath calls getEnvString and getEnvString throws an error,
      // the error message doesn't have duplicate "Environment variable error:" prefixes

      delete process.env.TEST_FILE;

      expect(() => getEnvFilePath("TEST_FILE")).toThrow();

      try {
        getEnvFilePath("TEST_FILE");
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = error.message;
          // Count occurrences of the prefix
          const prefixCount = (errorMessage.match(/Environment variable error:/g) || []).length;
          expect(prefixCount).toBe(1);
          expect(errorMessage).toBe(
            "Environment variable error: (TEST_FILE): Environment variable 'TEST_FILE' is not set and no default value was provided.",
          );
        }
      }
    });

    it("should not duplicate error prefixes when getEnvDirPath calls getEnvString", () => {
      delete process.env.TEST_DIR;

      expect(() => getEnvDirPath("TEST_DIR")).toThrow();

      try {
        getEnvDirPath("TEST_DIR");
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = error.message;
          const prefixCount = (errorMessage.match(/Environment variable error:/g) || []).length;
          expect(prefixCount).toBe(1);
          expect(errorMessage).toBe(
            "Environment variable error: (TEST_DIR): Environment variable 'TEST_DIR' is not set and no default value was provided.",
          );
        }
      }
    });

    it("should not duplicate error prefixes when getEnvPort calls getEnvNonNegativeNumber", () => {
      process.env.TEST_PORT = "invalid";

      expect(() => getEnvPort("TEST_PORT")).toThrow();

      try {
        getEnvPort("TEST_PORT");
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = error.message;
          const prefixCount = (errorMessage.match(/Environment variable error:/g) || []).length;
          expect(prefixCount).toBe(1);
          expect(errorMessage).toContain("Environment variable error: (TEST_PORT):");
          expect(errorMessage).not.toContain(
            "Environment variable error: (TEST_PORT): Environment variable error: (TEST_PORT):",
          );
        }
      }
    });
  });
});
