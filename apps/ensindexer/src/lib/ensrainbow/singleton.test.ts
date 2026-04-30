import { describe, expect, it } from "vitest";

import "@/lib/__test__/mockLogger";

import { setupConfigMock } from "@/lib/__test__/mockConfig";

setupConfigMock();

import { EnsRainbowHttpError } from "@ensnode/ensrainbow-sdk";

import { shouldRetryReadinessCheck } from "./singleton";

/**
 * `shouldRetryReadinessCheck` is the heart of the readiness-check retry policy used by
 * `waitForEnsRainbowToBeReady`. The integration with `p-retry` is a thin wiring (passing this
 * predicate into `pRetry({ shouldRetry })`), so we exhaustively unit-test the predicate here
 * rather than running the full retry loop with fake timers (which is fragile against `p-retry`
 * internals and module-cache resets).
 */
describe("shouldRetryReadinessCheck", () => {
  it("retries on EnsRainbowHttpError with status 503 (still bootstrapping)", () => {
    const error = new EnsRainbowHttpError("not ready", 503, "Service Unavailable");
    expect(shouldRetryReadinessCheck(error)).toBe(true);
  });

  it("aborts on EnsRainbowHttpError with status 404 (likely misconfigured base URL)", () => {
    const error = new EnsRainbowHttpError("not found", 404, "Not Found");
    expect(shouldRetryReadinessCheck(error)).toBe(false);
  });

  it("aborts on EnsRainbowHttpError with status 500 (server error)", () => {
    const error = new EnsRainbowHttpError("boom", 500, "Internal Server Error");
    expect(shouldRetryReadinessCheck(error)).toBe(false);
  });

  it("aborts on EnsRainbowHttpError with status 502 (bad gateway)", () => {
    const error = new EnsRainbowHttpError("bad gateway", 502, "Bad Gateway");
    expect(shouldRetryReadinessCheck(error)).toBe(false);
  });

  it("aborts on EnsRainbowHttpError with status 401 (auth misconfiguration)", () => {
    const error = new EnsRainbowHttpError("unauthorized", 401, "Unauthorized");
    expect(shouldRetryReadinessCheck(error)).toBe(false);
  });

  it("retries on plain Error (network/DNS/ECONNREFUSED), since these are transient during cold start", () => {
    expect(shouldRetryReadinessCheck(new TypeError("fetch failed"))).toBe(true);
    expect(shouldRetryReadinessCheck(new Error("connect ECONNREFUSED 127.0.0.1:3223"))).toBe(true);
  });

  it("retries on non-Error rejection values (defensive fallback)", () => {
    expect(shouldRetryReadinessCheck("string error")).toBe(true);
    expect(shouldRetryReadinessCheck(undefined)).toBe(true);
    expect(shouldRetryReadinessCheck(null)).toBe(true);
    expect(shouldRetryReadinessCheck({ message: "weird" })).toBe(true);
  });
});
