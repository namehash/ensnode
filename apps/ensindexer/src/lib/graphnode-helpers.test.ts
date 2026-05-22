import type { LabelHash } from "enssdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupConfigMock, setupEnsDbConfigMock } from "@/lib/__test__/mockConfig";
import "@/lib/__test__/mockLogger";

// Setup mocks before any imports that depend on them
setupEnsDbConfigMock();
setupConfigMock();

// Use real p-retry logic but with 0 timeouts so tests don't incur actual backoff delays.
vi.mock("p-retry", async () => {
  const { default: actualPRetry } = await vi.importActual<typeof import("p-retry")>("p-retry");
  return {
    default: (
      fn: Parameters<typeof actualPRetry>[0],
      options?: Parameters<typeof actualPRetry>[1],
    ) => actualPRetry(fn, { ...options, minTimeout: 0, maxTimeout: 0 }),
  };
});

// Mock fetch globally to prevent real network calls
global.fetch = vi.fn();

import { logger } from "@/lib/logger";

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

  it("returns null when ENSRainbow heals to a label that does not hash back to the labelHash", async () => {
    // Poisoned rainbow record: the on-chain label is `"007"` (with quotes), whose labelhash is
    // 0x00677002…, but a CSV-mangled label set heals it to `007` (quotes stripped). `007` hashes to
    // a different labelHash, so the heal must be rejected and treated as unhealable (null).
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "success",
          label: "007", // keccak256("007") !== 0x00677002…
        }),
    });

    expect(
      await labelByLabelHash("0x00677002a68cb48598b0a3fec5d666ecb3641db6efd494d01ca33eb0b05e98ed"),
    ).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);
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

  it("throws an error for an invalid labelHash missing 0x prefix and too long", async () => {
    // Validation happens client-side; fetch is never called
    await expect(
      labelByLabelHash(
        "12ca5d0b4ef1129e04bfe7d35ac9def2f4f91daeb202cbe6e613f1dd17b2da0600" as LabelHash,
      ), // 66 hex chars
    ).rejects.toThrow(/Invalid labelHash length/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  describe("retry behavior", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // Use unique labelHashes in each test to prevent LRU cache hits from other tests
    // carrying over cacheable responses (HealSuccess, HealNotFoundError) and bypassing fetch.

    it("retries on network/fetch failure and succeeds on a later attempt", async () => {
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      (fetch as any)
        .mockRejectedValueOnce(new Error("network error"))
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: "success", label: "networkretry" }),
        });

      // labelhash("networkretry"); the healed label must hash back to the requested labelHash
      const result = await labelByLabelHash(
        "0x5add779c9f3879ab11b8986aad4918f53c74eadffd021e9e69190adfc209b602" as LabelHash,
      );

      expect(result).toEqual("networkretry");
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("retries on HealServerError and succeeds on a later attempt", async () => {
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ status: "error", error: "Internal server error", errorCode: 500 }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: "success", label: "servererror" }),
        });

      // labelhash("servererror"); the healed label must hash back to the requested labelHash
      const result = await labelByLabelHash(
        "0x2ff233f09c5c35615c73fbcc0961cce9d3399164381467a5a9839f6434d286c3" as LabelHash,
      );

      expect(result).toEqual("servererror");
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("does not retry HealNotFoundError — returns null after a single call", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "error", error: "Label not found", errorCode: 404 }),
      });

      const result = await labelByLabelHash(
        "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" as LabelHash,
      );

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry HealBadRequestError — throws after a single call", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "error",
            error: "Invalid labelhash",
            errorCode: 400,
          }),
      });

      await expect(
        labelByLabelHash(
          "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" as LabelHash,
        ),
      ).rejects.toThrow(/Invalid labelhash/i);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("throws after exhausting retries on persistent network/fetch failures", async () => {
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      (fetch as any).mockRejectedValue(new Error("network error"));

      await expect(
        labelByLabelHash(
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as LabelHash,
        ),
      ).rejects.toThrow(/ENSRainbow Heal Request Failed/i);

      // 1 initial attempt + 3 retries = 4 total
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(warnSpy).toHaveBeenCalledTimes(4);
    });

    it("throws after exhausting retries on persistent HealServerError responses", async () => {
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ status: "error", error: "Internal server error", errorCode: 500 }),
      });

      const err = await labelByLabelHash(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as LabelHash,
      ).then(
        () => null as unknown as Error,
        (e: unknown) => e as Error,
      );
      expect(err).not.toBeNull();
      expect(err!.message).toMatch(/Internal server error/i);
      expect(err!.cause).toBeInstanceOf(Error);
      expect((err!.cause as Error).message).toBe("Internal server error");

      // 1 initial attempt + 3 retries = 4 total
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(warnSpy).toHaveBeenCalledTimes(4);
    });
  });
});
