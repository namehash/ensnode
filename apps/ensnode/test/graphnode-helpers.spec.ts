import { describe, expect, it } from "vitest";

import type { Labelhash } from "@ensnode/utils/types";
import { labelByHash } from "../src/lib/graphnode-helpers";

describe("labelByHash", () => {
  it("heals a valid known labelhash", async () => {
    expect(
      await labelByHash("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"),
    ).toEqual("vitalik");
  });

  it("returns null for a valid unknown labelhash", async () => {
    // labelhash comes from the ENSRainbow API logs:
    // "Unhealable labelhash request: 0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"
    expect(
      await labelByHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"),
    ).toBeNull();
  });

  it("throws an error for an invalid too short labelhash", async () => {
    await expect(
      labelByHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0"),
    ).rejects.toThrow("Invalid labelhash length 65 characters (expected 66)");
  });

  it("throws an error for an invalid too long labelhash", async () => {
    await expect(
      labelByHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da067"),
    ).rejects.toThrow("Invalid labelhash length 67 characters (expected 66)");
  });

  it("throws an error for an invalid labelhash not in lower-case", async () => {
    await expect(
      labelByHash("0x00Ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"),
    ).rejects.toThrow("Labelhash must be in lowercase");
  });

  it("throws an error for an invalid labelhash missing 0x prefix", async () => {
    await expect(
      labelByHash(
        "12ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0600" as Labelhash,
      ),
    ).rejects.toThrow("Labelhash must be 0x-prefixed");
  });
});
