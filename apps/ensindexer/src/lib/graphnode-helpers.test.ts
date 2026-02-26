import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LabelHash } from "@ensnode/ensnode-sdk";

import { setupConfigMock } from "@/lib/__test__/mockConfig";

setupConfigMock(); // setup config mock before importing dependent modules

// Mock fetch globally to prevent real network calls
global.fetch = vi.fn();

import { labelByLabelHash } from "./graphnode-helpers";

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

  it("normalizes a 63-char hex labelHash by prepending '0' and heals it", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          label: "vitalik",
        }),
    });

    expect(
      await labelByLabelHash(
        "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103c" as LabelHash, // 63 hex chars
      ),
    ).toEqual("vitalik");

    const [[calledUrl]] = (fetch as any).mock.calls;
    // Verify the client prepended a '0' — the normalized 64-char hash is used in the request
    expect(calledUrl.toString()).toContain(
      "0x0af2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103c",
    );
  });

  it("propagates a server 400 error as a thrown exception", async () => {
    // The 63-char hash is normalized client-side (leading '0' prepended), so fetch IS called.
    // This test verifies that a 400 response from the server is propagated as a thrown error.
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
      labelByLabelHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0"), // 63 hex chars, normalized before sending
    ).rejects.toThrow(/Invalid labelhash - must be a valid hex string/i);
  });

  it("throws an error for an invalid too long labelHash", async () => {
    // Validation happens client-side; fetch is never called
    await expect(
      labelByLabelHash("0x00ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da067"), // 65 hex chars
    ).rejects.toThrow(/Invalid labelHash length/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("normalizes a labelHash with uppercase chars and heals it", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          label: "nick",
        }),
    });

    // Use a hash distinct from other tests to avoid LRU cache hits suppressing the fetch call
    expect(
      await labelByLabelHash(
        "0x5D5727cb0fb76e4944eafb88ec9a3cf0b3c9025a4b2f947729137c5d7f84f68f" as LabelHash,
      ),
    ).toEqual("nick");

    const [[calledUrl]] = (fetch as any).mock.calls;
    expect(calledUrl.toString()).toContain(
      "0x5d5727cb0fb76e4944eafb88ec9a3cf0b3c9025a4b2f947729137c5d7f84f68f",
    );
  });

  it("throws an error for an invalid labelHash missing 0x prefix and too long", async () => {
    // Validation happens client-side; fetch is never called
    await expect(
      labelByLabelHash(
        "12ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0600" as LabelHash,
      ), // 66 hex chars
    ).rejects.toThrow(/Invalid labelHash length/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});
