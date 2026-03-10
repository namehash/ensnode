import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { EnsRainbowClientWithRetry } from "./ensrainbow-client-with-retry";

function createMockClient(): EnsRainbow.ApiClient {
  return {
    count: vi.fn(),
    config: vi.fn(),
    heal: vi.fn(),
    health: vi.fn(),
    version: vi.fn(),
    getOptions: vi.fn().mockReturnValue({ endpointUrl: "http://localhost:3223" }),
  };
}

function healSuccess(label = "vitalik"): EnsRainbow.HealSuccess {
  return { status: "success" as const, label };
}

function healNotFoundError(): EnsRainbow.HealNotFoundError {
  return { status: "error" as const, error: "Label not found", errorCode: 404 as const };
}

function healBadRequestError(): EnsRainbow.HealBadRequestError {
  return {
    status: "error" as const,
    error: "Invalid labelhash",
    errorCode: 400 as const,
  };
}

function healServerError(message = "Internal server error"): EnsRainbow.HealServerError {
  return { status: "error" as const, error: message, errorCode: 500 as const };
}

const TEST_LABEL_HASH = "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc";

describe("EnsRainbowClientWithRetry", () => {
  let inner: EnsRainbow.ApiClient;
  let wrapper: EnsRainbowClientWithRetry;

  beforeEach(() => {
    vi.clearAllMocks();
    inner = createMockClient();
    wrapper = new EnsRainbowClientWithRetry(inner, {
      retries: 3,
      minTimeout: 1,
      maxTimeout: 1,
    });
  });

  describe("delegation (non-heal methods)", () => {
    it("delegates count() to inner client", async () => {
      const expected = { count: 42 };
      vi.mocked(inner.count).mockResolvedValue(expected as any);

      const result = await wrapper.count();

      expect(result).toBe(expected);
      expect(inner.count).toHaveBeenCalledTimes(1);
    });

    it("delegates config() to inner client", async () => {
      const expected = { version: "1.0.0" };
      vi.mocked(inner.config).mockResolvedValue(expected as any);

      const result = await wrapper.config();

      expect(result).toBe(expected);
      expect(inner.config).toHaveBeenCalledTimes(1);
    });

    it("delegates health() to inner client", async () => {
      const expected = { status: "ok" };
      vi.mocked(inner.health).mockResolvedValue(expected as any);

      const result = await wrapper.health();

      expect(result).toBe(expected);
      expect(inner.health).toHaveBeenCalledTimes(1);
    });

    it("delegates version() to inner client", async () => {
      const expected = { version: "1.0.0" };
      vi.mocked(inner.version).mockResolvedValue(expected as any);

      const result = await wrapper.version();

      expect(result).toBe(expected);
      expect(inner.version).toHaveBeenCalledTimes(1);
    });

    it("delegates getOptions() to inner client", () => {
      const result = wrapper.getOptions();

      expect(result).toEqual({ endpointUrl: "http://localhost:3223" });
      expect(inner.getOptions).toHaveBeenCalledTimes(1);
    });
  });

  describe("heal() retry behavior", () => {
    it("returns immediately on HealSuccess without retry", async () => {
      const success = healSuccess();
      vi.mocked(inner.heal).mockResolvedValue(success);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toBe(success);
      expect(inner.heal).toHaveBeenCalledTimes(1);
      expect(inner.heal).toHaveBeenCalledWith(TEST_LABEL_HASH);
    });

    it("returns immediately on HealNotFoundError without retry", async () => {
      const notFound = healNotFoundError();
      vi.mocked(inner.heal).mockResolvedValue(notFound);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toBe(notFound);
      expect(inner.heal).toHaveBeenCalledTimes(1);
    });

    it("returns immediately on HealBadRequestError without retry", async () => {
      const badRequest = healBadRequestError();
      vi.mocked(inner.heal).mockResolvedValue(badRequest);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toBe(badRequest);
      expect(inner.heal).toHaveBeenCalledTimes(1);
    });

    it("retries on thrown error and succeeds", async () => {
      const success = healSuccess();
      vi.mocked(inner.heal)
        .mockRejectedValueOnce(new Error("fetch failed"))
        .mockResolvedValueOnce(success);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toBe(success);
      expect(inner.heal).toHaveBeenCalledTimes(2);
    });

    it("retries on HealServerError response and succeeds", async () => {
      const success = healSuccess();
      vi.mocked(inner.heal).mockResolvedValueOnce(healServerError()).mockResolvedValueOnce(success);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toBe(success);
      expect(inner.heal).toHaveBeenCalledTimes(2);
    });

    it("exhausts all retries on persistent thrown error and rethrows", async () => {
      vi.mocked(inner.heal).mockRejectedValue(new Error("network down"));

      await expect(wrapper.heal(TEST_LABEL_HASH)).rejects.toThrow("network down");

      // 1 initial + 3 retries = 4 attempts
      expect(inner.heal).toHaveBeenCalledTimes(4);
    });

    it("returns HealServerError after exhausting all retries", async () => {
      const serverError = healServerError("server overloaded");
      vi.mocked(inner.heal).mockResolvedValue(serverError);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toEqual(serverError);
      expect(inner.heal).toHaveBeenCalledTimes(4);
    });

    it("calls console.warn on each failed attempt", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mocked(inner.heal)
        .mockRejectedValueOnce(new Error("timeout"))
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce(healSuccess());

      await wrapper.heal(TEST_LABEL_HASH);

      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy.mock.calls[0]![0]).toMatch(/attempt 1/);
      expect(warnSpy.mock.calls[0]![0]).toMatch(/timeout/);
      expect(warnSpy.mock.calls[0]![0]).toMatch(/3 retries left/);
      expect(warnSpy.mock.calls[1]![0]).toMatch(/attempt 2/);
      expect(warnSpy.mock.calls[1]![0]).toMatch(/timeout/);
      expect(warnSpy.mock.calls[1]![0]).toMatch(/2 retries left/);

      warnSpy.mockRestore();
    });

    it("mixes thrown errors and HealServerError before succeeding", async () => {
      const success = healSuccess("nick");
      vi.mocked(inner.heal)
        .mockRejectedValueOnce(new Error("connection reset"))
        .mockResolvedValueOnce(healServerError())
        .mockResolvedValueOnce(success);

      const result = await wrapper.heal(TEST_LABEL_HASH);

      expect(result).toBe(success);
      expect(inner.heal).toHaveBeenCalledTimes(3);
    });
  });

  describe("custom retry options", () => {
    it("uses provided retry count", async () => {
      const customWrapper = new EnsRainbowClientWithRetry(inner, {
        retries: 1,
        minTimeout: 1,
        maxTimeout: 1,
      });

      vi.mocked(inner.heal).mockRejectedValue(new Error("fail"));

      await expect(customWrapper.heal(TEST_LABEL_HASH)).rejects.toThrow("fail");

      // 1 initial + 1 retry = 2 attempts
      expect(inner.heal).toHaveBeenCalledTimes(2);
    });
  });
});
