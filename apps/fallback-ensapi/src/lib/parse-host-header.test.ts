import { describe, expect, it } from "vitest";

import { parseHostHeader } from "./parse-host-header";

describe("parseHostHeader", () => {
  it.each([
    ["api.mainnet.blue.ensnode.io", "mainnet"],
    ["api.mainnet.green.ensnode.io", "mainnet"],
    ["api.sepolia.blue.ensnode.io", "sepolia"],
    ["api.sepolia.green.ensnode.io", "sepolia"],
    ["api.holesky.blue.ensnode.io", "holesky"],
    ["api.holesky.green.ensnode.io", "holesky"],
    ["api.alpha.blue.ensnode.io", "alpha"],
    ["api.alpha.green.ensnode.io", "alpha"],
    ["api.alpha-sepolia.blue.ensnode.io", "alpha-sepolia"],
    ["api.alpha-sepolia.green.ensnode.io", "alpha-sepolia"],
  ])("should parse %s to %s", (host, expected) => {
    expect(parseHostHeader(host)).toBe(expected);
  });

  it.each([
    ["mainnet.blue.ensnode.io", "host without api prefix"],
    ["", "empty string"],
    ["invalid-host", "malformed host"],
    ["api", "host with only api"],
    ["localhost:3000", "localhost"],
  ])("should return null for %s (%s)", (host) => {
    expect(parseHostHeader(host)).toBeNull();
  });
});
