import { accessSync, existsSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VALID_LOG_LEVELS } from "./config";
import {
  parseDirPath,
  parseFilePath,
  parseLogLevel,
  parseNonNegativeInteger,
  parsePort,
} from "./parsing-utils";

// mock fs functions
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  accessSync: vi.fn(),
  constants: {
    R_OK: 4,
  },
}));

describe("parsing-utils", () => {
  beforeEach(() => {
    // reset mocks
    vi.mocked(existsSync).mockReset();
    vi.mocked(accessSync).mockReset();
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
        'Invalid log level "invalid". Valid levels are: fatal, error, warn, info, debug, trace, silent.',
      );
    });
  });

  describe("parseFilePath", () => {
    it("should return the file path if the file exists and is readable", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockReturnValue(undefined);

      expect(parseFilePath("/path/to/file")).toBe("/path/to/file");
      expect(existsSync).toHaveBeenCalledWith("/path/to/file");
      expect(accessSync).toHaveBeenCalled();
    });

    it("should throw an error if the file does not exist and should_exist is true", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => parseFilePath("/path/to/nonexistent/file")).toThrow(
        "File '/path/to/nonexistent/file' does not exist.",
      );
    });

    it("should not throw an error if the file does not exist but should_exist is false", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(parseFilePath("/path/to/nonexistent/file", false)).toBe("/path/to/nonexistent/file");
      expect(existsSync).toHaveBeenCalledWith("/path/to/nonexistent/file");
      expect(accessSync).not.toHaveBeenCalled();
    });

    it("should throw an error if the file is not readable and should_be_readable is true", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(() => parseFilePath("/path/to/unreadable/file")).toThrow(
        "File '/path/to/unreadable/file' is not readable.",
      );
    });

    it("should not throw an error if the file is not readable but should_be_readable is false", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      expect(parseFilePath("/path/to/unreadable/file", true, false)).toBe(
        "/path/to/unreadable/file",
      );
      expect(existsSync).toHaveBeenCalledWith("/path/to/unreadable/file");
      expect(accessSync).not.toHaveBeenCalled();
    });
  });

  describe("parseDirPath", () => {
    it("should return the directory path if the directory exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      expect(parseDirPath("/path/to/dir")).toBe("/path/to/dir");
      expect(existsSync).toHaveBeenCalledWith("/path/to/dir");
    });

    it("should throw an error if the directory does not exist and allowNonExistent is false", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => parseDirPath("/path/to/nonexistent/dir")).toThrow(
        "Directory '/path/to/nonexistent/dir' does not exist.",
      );
    });

    it("should return the directory path if the directory does not exist but allowNonExistent is true", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(parseDirPath("/path/to/nonexistent/dir", true)).toBe("/path/to/nonexistent/dir");
    });
  });

  describe("parsePort", () => {
    it("should return the port number if it is valid", () => {
      expect(parsePort(8080)).toBe(8080);
    });

    it("should throw an error if the port is not a number", () => {
      expect(() => parsePort(NaN)).toThrow(
        "Invalid port number: NaN. Port must be a non-negative integer.",
      );
    });

    it("should throw an error if the port is negative", () => {
      expect(() => parsePort(-1)).toThrow(
        "Invalid port number: -1. Port must be a non-negative integer.",
      );
    });

    it("should throw an error if the port is not an integer", () => {
      expect(() => parsePort(42.5)).toThrow(
        "Invalid port number: 42.5. Port must be a non-negative integer.",
      );
    });

    it("should throw an error if the port is out of range", () => {
      expect(() => parsePort(70000)).toThrow(
        "Port number 70000 is out of range. Port must be between 0 and 65535.",
      );
    });
  });
});
