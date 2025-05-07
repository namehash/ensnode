import { describe, expect, it, vi } from "vitest";
import type { LabelHash } from "@ensnode/utils";
import { setupConfigMock } from "./utils/mockConfig";

// Set up the mock before importing modules that depend on config
setupConfigMock();

// Now safely import the module being tested
import { labelByLabelHash } from "@/lib/graphnode-helpers";

describe("labelByLabelHash", () => {
  it("empty environment", () => {});

  it("heals a valid known labelHash", async () => {
    expect(
      await labelByLabelHash(
        "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
      )
    ).toEqual("vitalik");
  });

  it("returns null for a valid unknown labelHash", async () => {
    // labelHash comes from the ENSRainbow API logs:
    // "Unhealable labelHash request: 0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"
    expect(
      await labelByLabelHash(
        "0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"
      )
    ).toBeNull();
  });

  it("throws an error for an invalid too short labelHash", async () => {
    await expect(
      labelByLabelHash(
        "0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0"
      )
    ).rejects.toThrow(/Invalid labelHash length/i);
  });

  it("throws an error for an invalid too long labelHash", async () => {
    await expect(
      labelByLabelHash(
        "0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da067"
      )
    ).rejects.toThrow(/Invalid labelHash length/i);
  });

  it("throws an error for an invalid labelHash not in lower-case", async () => {
    await expect(
      labelByLabelHash(
        "0x00Ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"
      )
    ).rejects.toThrow(/lowercase/i);
  });

  it("throws an error for an invalid labelHash missing 0x prefix", async () => {
    await expect(
      labelByLabelHash(
        "12ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0600" as LabelHash
      )
    ).rejects.toThrow(/0x-prefixed/i);
  });
});
