import { accessSync, existsSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseCliDirPath,
  parseCliFilePath,
  parseCliPort,
  resolveDirPath,
  resolveFilePath,
  resolveLogLevel,
  resolvePort,
} from "./command-utils";
import * as envUtils from "./env-utils";

// mock fs functions
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  accessSync: vi.fn(),
  constants: {
    R_OK: 4,
  },
}));

// mock env-utils functions
vi.mock("./env-utils", () => ({
  getEnvFilePath: vi.fn(),
  getEnvDirPath: vi.fn(),
  getEnvPort: vi.fn(),
}));

describe("command-utils", () => {
  beforeEach(() => {
    // reset mocks
    vi.mocked(existsSync).mockReset();
    vi.mocked(accessSync).mockReset();
    vi.mocked(envUtils.getEnvFilePath).mockReset();
    vi.mocked(envUtils.getEnvDirPath).mockReset();
    vi.mocked(envUtils.getEnvPort).mockReset();
  });

  describe("parseCliFilePath", () => {
    it("should return the file path if the file exists and is readable", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(parseCliFilePath("/path/to/file")).toBe("/path/to/file");
      expect(existsSync).toHaveBeenCalledWith("/path/to/file");
      expect(accessSync).toHaveBeenCalled();
    });

    it("should throw an error with command-specific prefix if the file does not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => parseCliFilePath("/path/to/nonexistent/file")).toThrow(
        "Command argument error: (filePath): File '/path/to/nonexistent/file' does not exist.",
      );
    });

    it("should not throw an error if the file does not exist but should_exist is false", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(parseCliFilePath("/path/to/nonexistent/file", false)).toBe(
        "/path/to/nonexistent/file",
      );
      expect(existsSync).toHaveBeenCalledWith("/path/to/nonexistent/file");
      expect(accessSync).not.toHaveBeenCalled();
    });

    it("should not throw an error if the file is not readable but should_be_readable is false", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(parseCliFilePath("/path/to/unreadable/file", true, false)).toBe(
        "/path/to/unreadable/file",
      );
      expect(existsSync).toHaveBeenCalledWith("/path/to/unreadable/file");
      expect(accessSync).not.toHaveBeenCalled();
    });

    it("should throw an error if the file is not readable and should_be_readable is true", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(() => parseCliFilePath("/path/to/unreadable/file")).toThrow(
        "Command argument error: (filePath): File '/path/to/unreadable/file' is not readable.",
      );
    });
  });

  describe("parseCliDirPath", () => {
    it("should return the directory path if the directory exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      expect(parseCliDirPath("/path/to/dir")).toBe("/path/to/dir");
      expect(existsSync).toHaveBeenCalledWith("/path/to/dir");
    });

    it("should throw an error with command-specific prefix if the directory does not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => parseCliDirPath("/path/to/nonexistent/dir")).toThrow(
        "Command argument error: (dirPath): Directory '/path/to/nonexistent/dir' does not exist.",
      );
    });

    it("should not throw an error if the directory does not exist but allowNonExistent is true", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(parseCliDirPath("/path/to/nonexistent/dir", true)).toBe("/path/to/nonexistent/dir");
      expect(existsSync).not.toHaveBeenCalled();
    });
  });

  describe("parseCliPort", () => {
    it("should return the port number if it is valid", () => {
      expect(parseCliPort(8080)).toBe(8080);
    });

    it("should throw an error with command-specific prefix if the port is invalid", () => {
      expect(() => parseCliPort(-1)).toThrow(
        "Command argument error: (port): Invalid port number: -1. Port must be a non-negative integer.",
      );
    });

    it("should throw an error if the port is NaN", () => {
      expect(() => parseCliPort(NaN)).toThrow(
        "Command argument error: (port): Invalid port number: NaN. Port must be a non-negative integer.",
      );
    });

    it("should throw an error if the port is not an integer", () => {
      expect(() => parseCliPort(42.5)).toThrow(
        "Command argument error: (port): Invalid port number: 42.5. Port must be a non-negative integer.",
      );
    });

    it("should throw an error if the port is out of range", () => {
      expect(() => parseCliPort(70000)).toThrow(
        "Command argument error: (port): Port number 70000 is out of range. Port must be between 0 and 65535.",
      );
    });
  });

  describe("resolveFilePath", () => {
    it("should use the command-line argument if provided", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(resolveFilePath("/cli/path", "ENV_VAR")).toBe("/cli/path");
      expect(envUtils.getEnvFilePath).not.toHaveBeenCalled();
    });

    it("should fall back to environment variable if command-line argument is not provided", () => {
      vi.mocked(envUtils.getEnvFilePath).mockReturnValue("/env/path");

      expect(resolveFilePath(undefined, "ENV_VAR")).toBe("/env/path");
      expect(envUtils.getEnvFilePath).toHaveBeenCalledWith("ENV_VAR", undefined, true, true);
    });

    it("should pass should_exist parameter to parseCliFilePath and getEnvFilePath", () => {
      // Test with CLI path
      vi.mocked(existsSync).mockReturnValue(false);
      expect(resolveFilePath("/cli/path", "ENV_VAR", undefined, false)).toBe("/cli/path");

      // Test with env var
      vi.mocked(envUtils.getEnvFilePath).mockReturnValue("/env/path");
      expect(resolveFilePath(undefined, "ENV_VAR", undefined, false)).toBe("/env/path");
      expect(envUtils.getEnvFilePath).toHaveBeenCalledWith("ENV_VAR", undefined, false, true);
    });

    it("should pass should_be_readable parameter to parseCliFilePath and getEnvFilePath", () => {
      // Test with CLI path
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });
      expect(resolveFilePath("/cli/path", "ENV_VAR", undefined, true, false)).toBe("/cli/path");

      // Test with env var
      vi.mocked(envUtils.getEnvFilePath).mockReturnValue("/env/path");
      expect(resolveFilePath(undefined, "ENV_VAR", undefined, true, false)).toBe("/env/path");
      expect(envUtils.getEnvFilePath).toHaveBeenCalledWith("ENV_VAR", undefined, true, false);
    });

    it("should pass defaultValue parameter to getEnvFilePath", () => {
      vi.mocked(envUtils.getEnvFilePath).mockReturnValue("/default/path");

      expect(resolveFilePath(undefined, "ENV_VAR", "/default/path")).toBe("/default/path");
      expect(envUtils.getEnvFilePath).toHaveBeenCalledWith("ENV_VAR", "/default/path", true, true);
    });
  });

  describe("resolveDirPath", () => {
    it("should use the command-line argument if provided", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      expect(resolveDirPath("/cli/dir", "ENV_VAR")).toBe("/cli/dir");
      expect(envUtils.getEnvDirPath).not.toHaveBeenCalled();
    });

    it("should fall back to environment variable if command-line argument is not provided", () => {
      vi.mocked(envUtils.getEnvDirPath).mockReturnValue("/env/dir");

      expect(resolveDirPath(undefined, "ENV_VAR")).toBe("/env/dir");
      expect(envUtils.getEnvDirPath).toHaveBeenCalledWith("ENV_VAR", undefined, false);
    });

    it("should pass allowNonExistent parameter to parseCliDirPath and getEnvDirPath", () => {
      // Test with CLI path
      vi.mocked(existsSync).mockReturnValue(false);
      expect(resolveDirPath("/cli/dir", "ENV_VAR", undefined, true)).toBe("/cli/dir");

      // Test with env var
      vi.mocked(envUtils.getEnvDirPath).mockReturnValue("/env/dir");
      expect(resolveDirPath(undefined, "ENV_VAR", undefined, true)).toBe("/env/dir");
      expect(envUtils.getEnvDirPath).toHaveBeenCalledWith("ENV_VAR", undefined, true);
    });

    it("should pass defaultValue parameter to getEnvDirPath", () => {
      vi.mocked(envUtils.getEnvDirPath).mockReturnValue("/default/dir");

      expect(resolveDirPath(undefined, "ENV_VAR", "/default/dir")).toBe("/default/dir");
      expect(envUtils.getEnvDirPath).toHaveBeenCalledWith("ENV_VAR", "/default/dir", false);
    });
  });

  describe("resolvePort", () => {
    it("should use the command-line argument if provided", () => {
      expect(resolvePort(8080, "ENV_VAR")).toBe(8080);
      expect(envUtils.getEnvPort).not.toHaveBeenCalled();
    });

    it("should fall back to environment variable if command-line argument is not provided", () => {
      vi.mocked(envUtils.getEnvPort).mockReturnValue(3000);

      expect(resolvePort(undefined, "ENV_VAR")).toBe(3000);
      expect(envUtils.getEnvPort).toHaveBeenCalledWith("ENV_VAR", undefined);
    });

    it("should pass defaultValue parameter to getEnvPort", () => {
      vi.mocked(envUtils.getEnvPort).mockReturnValue(9090);

      expect(resolvePort(undefined, "ENV_VAR", 9090)).toBe(9090);
      expect(envUtils.getEnvPort).toHaveBeenCalledWith("ENV_VAR", 9090);
    });
  });

  describe("resolveLogLevel", () => {
    it("should use the command-line argument if provided", () => {
      expect(resolveLogLevel("debug", "LOG_LEVEL")).toBe("debug");
    });

    it("should throw an error with command-specific prefix if the command-line log level is invalid", () => {
      expect(() => resolveLogLevel("invalid", "LOG_LEVEL")).toThrow(
        'Command argument error: (logLevel): Invalid log level "invalid". Valid levels are: fatal, error, warn, info, debug, trace, silent.',
      );
    });

    it("should fall back to environment variable if command-line argument is not provided", () => {
      process.env.LOG_LEVEL = "debug";
      expect(resolveLogLevel(undefined, "LOG_LEVEL")).toBe("debug");
      delete process.env.LOG_LEVEL;
    });

    it("should throw an error if the environment variable contains an invalid log level", () => {
      process.env.LOG_LEVEL = "invalid";
      expect(() => resolveLogLevel(undefined, "LOG_LEVEL")).toThrow(
        'Environment variable error: (LOG_LEVEL): Invalid log level "invalid". Valid levels are: fatal, error, warn, info, debug, trace, silent.',
      );
      delete process.env.LOG_LEVEL;
    });

    it("should fall back to default value if neither command-line argument nor environment variable is provided", () => {
      expect(resolveLogLevel(undefined, "LOG_LEVEL", "info")).toBe("info");
    });

    it("should throw an error if no log level is specified and no default value is provided", () => {
      expect(() => resolveLogLevel(undefined, "LOG_LEVEL")).toThrow(
        "No log level specified and no default value provided.",
      );
    });
  });
});
