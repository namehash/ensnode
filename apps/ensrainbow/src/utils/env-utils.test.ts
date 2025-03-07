import { accessSync, existsSync } from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PORT,
  getDataDir,
  getDefaultDataDir,
  getDefaultInputFile,
  getEnvDirPath,
  getEnvFilePath,
  getEnvNonNegativeNumber,
  getEnvPort,
  getEnvString,
  getInputFile,
  getPort,
  parseNonNegativeInteger,
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
        "Environment variable 'NONEXISTENT_VAR' is not set and no default value was provided.",
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
        "Invalid value 'invalid' for environment variable 'TEST_VAR'.",
      );
    });

    it("should throw an error with custom message if validation fails with string result", () => {
      process.env.TEST_VAR = "invalid";
      const validator = (value: string) => (value === "valid" ? true : "Custom error message");
      expect(() => getEnvString("TEST_VAR", undefined, validator)).toThrow("Custom error message");
    });
  });

  describe("getEnvNonNegativeNumber", () => {
    it("should return the parsed number if the environment variable is a valid non-negative integer", () => {
      process.env.TEST_NUM = "42";
      expect(getEnvNonNegativeNumber("TEST_NUM")).toBe(42);
    });

    it("should return the default value if the environment variable is not set", () => {
      expect(getEnvNonNegativeNumber("NONEXISTENT_NUM", 42)).toBe(42);
    });

    it("should throw an error if the environment variable is not set and no default is provided", () => {
      expect(() => getEnvNonNegativeNumber("NONEXISTENT_NUM")).toThrow(
        "Environment variable 'NONEXISTENT_NUM' is not set and no default value was provided.",
      );
    });

    it("should throw an error if the environment variable is not a valid number", () => {
      process.env.TEST_NUM = "not-a-number";
      expect(() => getEnvNonNegativeNumber("TEST_NUM")).toThrow(
        "Invalid value for environment variable 'TEST_NUM': \"not-a-number\" is not a valid number",
      );
    });

    it("should throw an error if the environment variable is a negative number", () => {
      process.env.TEST_NUM = "-42";
      expect(() => getEnvNonNegativeNumber("TEST_NUM")).toThrow(
        "Invalid value for environment variable 'TEST_NUM': \"-42\" is not a non-negative integer",
      );
    });

    it("should throw an error if the environment variable is negative zero", () => {
      process.env.TEST_NUM = "-0";
      expect(() => getEnvNonNegativeNumber("TEST_NUM")).toThrow(
        "Invalid value for environment variable 'TEST_NUM': Negative zero is not a valid non-negative integer",
      );
    });

    it("should throw an error if the environment variable is a floating-point number", () => {
      process.env.TEST_NUM = "42.5";
      expect(() => getEnvNonNegativeNumber("TEST_NUM")).toThrow(
        "Invalid value for environment variable 'TEST_NUM': \"42.5\" is not an integer",
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
        "File specified by environment variable 'TEST_FILE' does not exist: '/path/to/nonexistent/file'. " +
          "Please check that the file exists and the path is correct.",
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
        "File specified by environment variable 'TEST_FILE' is not readable: '/path/to/unreadable/file'. " +
          "Please check file permissions.",
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
        "Directory specified by environment variable 'TEST_DIR' does not exist: '/path/to/nonexistent/dir'. " +
          "Please check that the directory exists and the path is correct.",
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
        "Invalid value for environment variable 'TEST_PORT': \"-1\" is not a non-negative integer",
      );
    });

    it("should throw an error if the port is out of range (too large)", () => {
      process.env.TEST_PORT = "70000";
      expect(() => getEnvPort("TEST_PORT")).toThrow(
        "Invalid port number '70000' specified by environment variable 'TEST_PORT'. " +
          "Port must be between 0 and 65535.",
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

  describe("parseNonNegativeInteger", () => {
    it("should parse a valid non-negative integer", () => {
      expect(parseNonNegativeInteger("42")).toBe(42);
    });

    it("should parse zero", () => {
      expect(parseNonNegativeInteger("0")).toBe(0);
    });

    it("should throw an error for empty strings", () => {
      expect(() => parseNonNegativeInteger("")).toThrow("Input cannot be empty");
    });

    it("should throw an error for negative zero", () => {
      expect(() => parseNonNegativeInteger("-0")).toThrow(
        "Negative zero is not a valid non-negative integer",
      );
    });

    it("should throw an error for non-numeric strings", () => {
      expect(() => parseNonNegativeInteger("not-a-number")).toThrow(
        '"not-a-number" is not a valid number',
      );
    });

    it("should throw an error for non-finite numbers", () => {
      expect(() => parseNonNegativeInteger("Infinity")).toThrow(
        '"Infinity" is not a finite number',
      );
    });

    it("should throw an error for non-integer numbers", () => {
      expect(() => parseNonNegativeInteger("42.5")).toThrow('"42.5" is not an integer');
    });

    it("should throw an error for negative numbers", () => {
      expect(() => parseNonNegativeInteger("-42")).toThrow('"-42" is not a non-negative integer');
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
});
