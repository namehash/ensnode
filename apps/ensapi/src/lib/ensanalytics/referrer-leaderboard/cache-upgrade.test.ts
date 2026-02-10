import type { ReferralProgramEditionConfig } from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addDuration, parseEth, parseUsdc, SWRCache } from "@ensnode/ensnode-sdk";

import { ASSUMED_CHAIN_REORG_SAFE_DURATION } from "@/lib/ensanalytics/referrer-leaderboard/closeout";

// Mock the cache module to avoid config loading
vi.mock("@/cache/referral-leaderboard-editions.cache", () => ({
  createEditionLeaderboardBuilder: vi.fn(),
}));

import { createEditionLeaderboardBuilder } from "@/cache/referral-leaderboard-editions.cache";

import { upgradeEditionCache } from "./cache-upgrade";

describe("Cache upgrade to immutable storage", () => {
  const now = Math.floor(Date.now() / 1000);

  // Mock leaderboard builder function
  const mockBuilder = async () => ({
    rules: {
      totalAwardPoolValue: parseUsdc("10000"),
      maxQualifiedReferrers: 100,
      startTime: now - 3600,
      endTime: now - 1200,
      subregistryId: { chainId: 1, address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const },
      rulesUrl: new URL("https://example.com/rules"),
    },
    aggregatedMetrics: {
      grandTotalReferrals: 0,
      grandTotalIncrementalDuration: 0,
      grandTotalRevenueContribution: parseEth("0"),
      grandTotalQualifiedReferrersFinalScore: 0,
      minFinalScoreToQualify: 0,
    },
    referrers: new Map(),
    accurateAsOf: now,
  });

  it("should detect regular cache as NOT indefinitely stored", () => {
    const cache = new SWRCache({
      fn: mockBuilder,
      ttl: minutesToSeconds(5),
      proactiveRevalidationInterval: minutesToSeconds(1),
      errorTtl: minutesToSeconds(1),
      proactivelyInitialize: false,
    });

    expect(cache.isIndefinitelyStored()).toBe(false);
  });

  it("should detect immutable cache as indefinitely stored", () => {
    const cache = new SWRCache({
      fn: mockBuilder,
      ttl: Number.POSITIVE_INFINITY,
      proactiveRevalidationInterval: undefined,
      errorTtl: minutesToSeconds(1),
      proactivelyInitialize: false,
    });

    expect(cache.isIndefinitelyStored()).toBe(true);
  });

  it("should NOT detect cache with infinite TTL but proactive revalidation as indefinitely stored", () => {
    const cache = new SWRCache({
      fn: mockBuilder,
      ttl: Number.POSITIVE_INFINITY,
      proactiveRevalidationInterval: minutesToSeconds(1),
      errorTtl: minutesToSeconds(1),
      proactivelyInitialize: false,
    });

    expect(cache.isIndefinitelyStored()).toBe(false);
  });

  describe("upgradeEditionCache", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should successfully upgrade cache when edition is immutably closed", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200; // 20 minutes ago
      const immutableTimestamp = addDuration(closedEndTime, ASSUMED_CHAIN_REORG_SAFE_DURATION) + 1;

      const builderWithImmutableData = async () => ({
        rules: {
          totalAwardPoolValue: parseUsdc("10000"),
          maxQualifiedReferrers: 100,
          startTime: closedEndTime - 3600,
          endTime: closedEndTime,
          subregistryId: {
            chainId: 1,
            address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const,
          },
          rulesUrl: new URL("https://example.com/rules"),
        },
        aggregatedMetrics: {
          grandTotalReferrals: 0,
          grandTotalIncrementalDuration: 0,
          grandTotalRevenueContribution: parseEth("0"),
          grandTotalQualifiedReferrersFinalScore: 0,
          minFinalScoreToQualify: 0,
        },
        referrers: new Map(),
        accurateAsOf: immutableTimestamp,
      });

      // Mock the builder to return our test data
      vi.mocked(createEditionLeaderboardBuilder).mockReturnValue(builderWithImmutableData);

      const oldCache = new SWRCache({
        fn: builderWithImmutableData,
        ttl: minutesToSeconds(5),
        proactiveRevalidationInterval: minutesToSeconds(1),
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, oldCache);

      const editionConfig: ReferralProgramEditionConfig = {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: {
          totalAwardPoolValue: parseUsdc("10000"),
          maxQualifiedReferrers: 100,
          startTime: closedEndTime - 3600,
          endTime: closedEndTime,
          subregistryId: {
            chainId: 1,
            address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const,
          },
          rulesUrl: new URL("https://example.com/rules"),
        },
      };

      await upgradeEditionCache(editionSlug, oldCache, editionConfig, caches);

      const upgradedCache = caches.get(editionSlug);
      expect(upgradedCache).not.toBe(oldCache);
      expect(upgradedCache?.isIndefinitelyStored()).toBe(true);
    });

    it("should keep old cache if new cache fails to initialize", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200;

      const failingBuilder = async () => {
        throw new Error("Failed to build leaderboard");
      };

      // Mock the builder to return a failing builder
      vi.mocked(createEditionLeaderboardBuilder).mockReturnValue(failingBuilder);

      const oldCache = new SWRCache({
        fn: failingBuilder,
        ttl: minutesToSeconds(5),
        proactiveRevalidationInterval: minutesToSeconds(1),
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, oldCache);

      const editionConfig: ReferralProgramEditionConfig = {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: {
          totalAwardPoolValue: parseUsdc("10000"),
          maxQualifiedReferrers: 100,
          startTime: closedEndTime - 3600,
          endTime: closedEndTime,
          subregistryId: {
            chainId: 1,
            address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const,
          },
          rulesUrl: new URL("https://example.com/rules"),
        },
      };

      await upgradeEditionCache(editionSlug, oldCache, editionConfig, caches);

      // Old cache should still be there
      expect(caches.get(editionSlug)).toBe(oldCache);
    });

    it("should keep old cache if new data is not fresh enough", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200;
      const notFreshEnoughTimestamp = closedEndTime + 30; // Not past safety window

      const builderWithStaleData = async () => ({
        rules: {
          totalAwardPoolValue: parseUsdc("10000"),
          maxQualifiedReferrers: 100,
          startTime: closedEndTime - 3600,
          endTime: closedEndTime,
          subregistryId: {
            chainId: 1,
            address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const,
          },
          rulesUrl: new URL("https://example.com/rules"),
        },
        aggregatedMetrics: {
          grandTotalReferrals: 0,
          grandTotalIncrementalDuration: 0,
          grandTotalRevenueContribution: parseEth("0"),
          grandTotalQualifiedReferrersFinalScore: 0,
          minFinalScoreToQualify: 0,
        },
        referrers: new Map(),
        accurateAsOf: notFreshEnoughTimestamp,
      });

      // Mock the builder to return stale data
      vi.mocked(createEditionLeaderboardBuilder).mockReturnValue(builderWithStaleData);

      const oldCache = new SWRCache({
        fn: builderWithStaleData,
        ttl: minutesToSeconds(5),
        proactiveRevalidationInterval: minutesToSeconds(1),
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, oldCache);

      const editionConfig: ReferralProgramEditionConfig = {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: {
          totalAwardPoolValue: parseUsdc("10000"),
          maxQualifiedReferrers: 100,
          startTime: closedEndTime - 3600,
          endTime: closedEndTime,
          subregistryId: {
            chainId: 1,
            address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const,
          },
          rulesUrl: new URL("https://example.com/rules"),
        },
      };

      await upgradeEditionCache(editionSlug, oldCache, editionConfig, caches);

      // Old cache should still be there
      expect(caches.get(editionSlug)).toBe(oldCache);
    });
  });
});
