import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EnsDbReader } from "@ensnode/ensdb-sdk";

import { waitForEnsDbToBeReady } from "./ensdb";

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const ENSINDEXER_SCHEMA_NAME = "ensindexer_test";

const createEnsDbClient = ({ isReady }: { isReady: boolean }) =>
  ({
    isReady: vi.fn().mockResolvedValue(isReady),
    ensIndexerSchemaName: ENSINDEXER_SCHEMA_NAME,
  }) as unknown as EnsDbReader;

describe("waitForEnsDbToBeReady", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves when the ENSDb instance is ready immediately", async () => {
    const ensDbClient = createEnsDbClient({ isReady: true });

    await expect(waitForEnsDbToBeReady(ensDbClient)).resolves.toBeUndefined();
    expect(ensDbClient.isReady).toHaveBeenCalledTimes(1);
  });

  it("retries until the ENSDb instance becomes ready", async () => {
    const ensDbClient = {
      isReady: vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true),
      ensIndexerSchemaName: ENSINDEXER_SCHEMA_NAME,
    } as unknown as EnsDbReader;

    const promise = waitForEnsDbToBeReady(ensDbClient);

    // Advance past the 60-second retry interval to trigger the second attempt.
    await vi.advanceTimersByTimeAsync(60_000);

    await expect(promise).resolves.toBeUndefined();
    expect(ensDbClient.isReady).toHaveBeenCalledTimes(2);
  });

  it("rejects when the ENSDb instance never becomes ready", async () => {
    const ensDbClient = createEnsDbClient({ isReady: false });

    const promise = waitForEnsDbToBeReady(ensDbClient);
    // Attach a no-op catch to prevent the promise from being reported as an
    // unhandled rejection while the fake timers are advancing.
    promise.catch(() => {});

    // Advance past all 15 retry intervals (15 × 60s = 900s).
    await vi.advanceTimersByTimeAsync(900_000);

    await expect(promise).rejects.toThrow("ENSDb instance is not ready yet.");
    expect(ensDbClient.isReady).toHaveBeenCalledTimes(16); // initial + 15 retries
  });
});
