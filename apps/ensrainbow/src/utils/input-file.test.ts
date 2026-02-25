import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { assertInputFileReadable } from "./input-file";

describe("assertInputFileReadable", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `input-file-test-${process.pid}-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Restore permissions on any unreadable file before cleanup so the OS can remove it
    const unreadable = join(testDir, "unreadable.txt");
    try {
      chmodSync(unreadable, 0o644);
    } catch {
      // file may not exist
    }
  });

  it("does not throw for a readable file", () => {
    const filePath = join(testDir, "readable.txt");
    writeFileSync(filePath, "hello");
    expect(() => assertInputFileReadable(filePath)).not.toThrow();
  });

  it("throws for a non-existent path", () => {
    const filePath = join(testDir, "does-not-exist.txt");
    expect(() => assertInputFileReadable(filePath)).toThrowError(
      "Input file not found or not readable",
    );
  });

  it("error message for a non-existent path includes the path", () => {
    const filePath = join(testDir, "does-not-exist.txt");
    expect(() => assertInputFileReadable(filePath)).toThrowError(filePath);
  });

  it("throws for a directory path", () => {
    expect(() => assertInputFileReadable(testDir)).toThrowError("Input path is not a file");
  });

  it("error message for a directory path includes the path", () => {
    expect(() => assertInputFileReadable(testDir)).toThrowError(testDir);
  });

  it("throws for an unreadable file", { skip: process.platform === "win32" }, () => {
    const filePath = join(testDir, "unreadable.txt");
    writeFileSync(filePath, "secret");
    chmodSync(filePath, 0o000);
    expect(() => assertInputFileReadable(filePath)).toThrowError(
      "Input file not found or not readable",
    );
  });

  it(
    "error message for an unreadable file includes the path",
    { skip: process.platform === "win32" },
    () => {
      const filePath = join(testDir, "unreadable.txt");
      writeFileSync(filePath, "secret");
      chmodSync(filePath, 0o000);
      expect(() => assertInputFileReadable(filePath)).toThrowError(filePath);
    },
  );
});
