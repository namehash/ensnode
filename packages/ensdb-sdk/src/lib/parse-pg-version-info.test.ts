import { describe, expect, it } from "vitest";

import { parsePgVersionInfo } from "./parse-pg-version-info";

describe("parsePgVersionInfo", () => {
  it("parses standard PostgreSQL version string", () => {
    const versionString = "PostgreSQL 15.5 (Ubuntu 15.5-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu";

    expect(parsePgVersionInfo(versionString)).toBe("15.5");
  });

  it("parses PostgreSQL version string with different version numbers", () => {
    const versionString = "PostgreSQL 14.2 on x86_64-pc-linux-gnu";

    expect(parsePgVersionInfo(versionString)).toBe("14.2");
  });

  it("parses PostgreSQL version string with single digit minor version", () => {
    const versionString = "PostgreSQL 16.1 (Debian 16.1-1.pgdg120+1)";

    expect(parsePgVersionInfo(versionString)).toBe("16.1");
  });

  it("parses minimal PostgreSQL version string", () => {
    const versionString = "PostgreSQL 17.0";

    expect(parsePgVersionInfo(versionString)).toBe("17.0");
  });

  it("throws error for empty string", () => {
    expect(() => parsePgVersionInfo("")).toThrow(
      "Failed to parse PostgreSQL version from version string: ''",
    );
  });

  it("throws error for null", () => {
    expect(() => parsePgVersionInfo(null as unknown as string)).toThrow(
      "PostgreSQL version string must be a string",
    );
  });

  it("throws error for undefined", () => {
    expect(() => parsePgVersionInfo(undefined as unknown as string)).toThrow(
      "PostgreSQL version string must be a string",
    );
  });

  it("throws error when PostgreSQL prefix is missing", () => {
    const versionString = "MySQL 8.0.32 on x86_64";

    expect(() => parsePgVersionInfo(versionString)).toThrow(
      `Failed to parse PostgreSQL version from version string: '${versionString}'`,
    );
  });

  it("throws error when version format is invalid", () => {
    const versionString = "PostgreSQL 15 on x86_64";

    expect(() => parsePgVersionInfo(versionString)).toThrow(
      `Failed to parse PostgreSQL version from version string: '${versionString}'`,
    );
  });

  it("throws error for completely unrelated string", () => {
    const versionString = "random text without version info";

    expect(() => parsePgVersionInfo(versionString)).toThrow(
      `Failed to parse PostgreSQL version from version string: '${versionString}'`,
    );
  });

  it("parses version string with extra content after version", () => {
    const versionString = "PostgreSQL 13.14 compiled by Visual C++ build 1914, 64-bit with SSL";

    expect(parsePgVersionInfo(versionString)).toBe("13.14");
  });
});
