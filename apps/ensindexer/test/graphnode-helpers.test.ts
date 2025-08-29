import type { LabelHash } from "@ensnode/ensnode-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

// Mock fetch globally to prevent real network calls
global.fetch = vi.fn();

import { labelByLabelHash } from "@/lib/graphnode-helpers";

describe("labelByLabelHash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty environment", () => {});

  it("heals a valid known labelHash", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          label: "vitalik",
        }),
    });

    expect(
      await labelByLabelHash("0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"),
    ).toEqual("vitalik");
  });

  it("returns null for a valid unknown labelHash", async () => {
    // labelHash comes from the ENSRainbow API logs:
    // "Unhealable labelHash request: 0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "error",
          error: "Label not found",
          errorCode: 404,
        }),
    });

    expect(
      await labelByLabelHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"),
    ).toBeNull();
  });

  it("throws an error for an invalid too short labelHash", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "error",
          error: "Invalid labelhash - must be a valid hex string",
          errorCode: 400,
        }),
    });

    await expect(
      labelByLabelHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0"),
    ).rejects.toThrow(/Invalid labelhash - must be a valid hex string/i);
  });

  it("throws an error for an invalid too long labelHash", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "error",
          error: "Invalid labelhash - must be a valid hex string",
          errorCode: 400,
        }),
    });

    await expect(
      labelByLabelHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da067"),
    ).rejects.toThrow(/Invalid labelhash - must be a valid hex string/i);
  });

  it("throws an error for an invalid labelHash not in lower-case", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "error",
          error: "Invalid labelhash - must be a valid hex string",
          errorCode: 400,
        }),
    });

    await expect(
      labelByLabelHash("0x00Ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da06"),
    ).rejects.toThrow(/Invalid labelhash - must be a valid hex string/i);
  });

  it("throws an error for an invalid labelHash missing 0x prefix", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "error",
          error: "Invalid labelhash - must be a valid hex string",
          errorCode: 400,
        }),
    });

    await expect(
      labelByLabelHash(
        "12ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0600" as LabelHash,
      ),
    ).rejects.toThrow(/Invalid labelhash - must be a valid hex string/i);
  });
});
