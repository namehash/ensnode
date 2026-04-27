import { describe, expect, it } from "vitest";

import { advisoryLockId } from "./advisory-lock-id";

describe("advisoryLockId", () => {
  it("returns a bigint for any string input", () => {
    expect(advisoryLockId("test-name")).toBeTypeOf("bigint");
    expect(advisoryLockId("")).toBeTypeOf("bigint");
    expect(advisoryLockId("schema-migrations")).toBeTypeOf("bigint");
  });

  it("returns consistent (deterministic) results for the same input", () => {
    expect(advisoryLockId("name")).toBe(advisoryLockId("name"));
    expect(advisoryLockId("")).toBe(advisoryLockId(""));
  });

  it("returns different results for different inputs", () => {
    expect(advisoryLockId("name-one")).not.toBe(advisoryLockId("name-two"));
  });

  it("produces expected lock ID for known input", () => {
    // SHA-256 of "hello" -> first 8 bytes as signed 64-bit big-endian
    expect(advisoryLockId("hello")).toBe(3238736544897475342n);
  });

  it("produces values within PostgreSQL bigint range", () => {
    // PostgreSQL bigint is signed 64-bit
    const result = advisoryLockId("any-name");

    expect(result).toBeGreaterThanOrEqual(-9223372036854775808n);
    expect(result).toBeLessThanOrEqual(9223372036854775807n);
  });
});
