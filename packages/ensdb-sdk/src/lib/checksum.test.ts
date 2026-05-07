import { describe, expect, it } from "vitest";

import { createChecksum } from "./checksum";

describe("createChecksum", () => {
  it("returns a 10-character hex string", () => {
    const checksum = createChecksum("test data");

    expect(checksum).toHaveLength(10);
    expect(checksum).toMatch(/^[a-f0-9]{10}$/);
  });

  it("returns consistent results for the same input", () => {
    const input = "consistent input";
    const checksum1 = createChecksum(input);
    const checksum2 = createChecksum(input);

    expect(checksum1).toBe(checksum2);
  });

  it("returns different results for different inputs", () => {
    const checksum1 = createChecksum("input one");
    const checksum2 = createChecksum("input two");

    expect(checksum1).not.toBe(checksum2);
  });

  it("handles empty string input", () => {
    const checksum = createChecksum("");

    expect(checksum).toHaveLength(10);
    expect(checksum).toMatch(/^[a-f0-9]{10}$/);
  });

  it("handles Buffer input", () => {
    const buffer = Buffer.from("buffer data");
    const checksum = createChecksum(buffer);

    expect(checksum).toHaveLength(10);
    expect(checksum).toMatch(/^[a-f0-9]{10}$/);
  });

  it("handles Uint8Array input", () => {
    const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
    const checksum = createChecksum(uint8Array);

    expect(checksum).toHaveLength(10);
    expect(checksum).toMatch(/^[a-f0-9]{10}$/);
  });

  it("produces expected checksum for known input", () => {
    // SHA-256 of "hello" starts with "2cf24dba5f..."
    const checksum = createChecksum("hello");

    expect(checksum).toBe("2cf24dba5f");
  });
});
