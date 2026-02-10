import type {
  ReferralProgramEditionConfig,
  ReferralProgramEditionConfigSet,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addDuration,
  type CrossChainIndexingStatusSnapshot,
  parseEth,
  parseUsdc,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { ASSUMED_CHAIN_REORG_SAFE_DURATION } from "@/lib/ensanalytics/referrer-leaderboard/closeout";

// Mock the cache module to avoid config loading
vi.mock("@/cache/referral-leaderboard-editions.cache", () => ({
  createEditionLeaderboardBuilder: vi.fn(),
}));

import { createEditionLeaderboardBuilder } from "@/cache/referral-leaderboard-editions.cache";

import { checkAndUpgradeImmutableCaches, upgradeEditionCache } from "./cache-upgrade";

describe("Cache upgrade to immutable storage", () => {
  const now = Math.floor(Date.now() / 1000);

  // Shared test fixtures
  const baseSubregistryId = {
    chainId: 1,
    address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85" as const,
  };

  const baseAggregatedMetrics = {
    grandTotalReferrals: 0,
    grandTotalIncrementalDuration: 0,
    grandTotalRevenueContribution: parseEth("0"),
    grandTotalQualifiedReferrersFinalScore: 0,
    minFinalScoreToQualify: 0,
  };

  const createBaseRules = (startTime: number, endTime: number) => ({
    totalAwardPoolValue: parseUsdc("10000"),
    maxQualifiedReferrers: 100,
    startTime,
    endTime,
    subregistryId: baseSubregistryId,
    rulesUrl: new URL("https://example.com/rules"),
  });

  const createMockIndexingStatus = (timestamp: number): CrossChainIndexingStatusSnapshot =>
    ({
      omnichainSnapshot: {
        chains: new Map([[1, { latestIndexedBlock: { timestamp } }]]),
      },
    }) as unknown as CrossChainIndexingStatusSnapshot;

  describe("upgradeEditionCache", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should successfully upgrade cache when edition is immutably closed", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200; // 20 minutes ago
      const immutableTimestamp = addDuration(closedEndTime, ASSUMED_CHAIN_REORG_SAFE_DURATION) + 1;

      const builderWithImmutableData = async () => ({
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
        aggregatedMetrics: baseAggregatedMetrics,
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
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
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
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
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
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
        aggregatedMetrics: baseAggregatedMetrics,
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
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
      };

      await upgradeEditionCache(editionSlug, oldCache, editionConfig, caches);

      // Old cache should still be there
      expect(caches.get(editionSlug)).toBe(oldCache);
    });
  });

  describe("checkAndUpgradeImmutableCaches", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should prevent concurrent upgrades of the same edition", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200; // 20 minutes ago
      const immutableTimestamp = addDuration(closedEndTime, ASSUMED_CHAIN_REORG_SAFE_DURATION) + 1;

      // Create a controllable promise to keep the first upgrade in progress
      let resolveFirstUpgrade: () => void;
      const firstUpgradePromise = new Promise<void>((resolve) => {
        resolveFirstUpgrade = resolve;
      });

      let builderCallCount = 0;
      const controllableBuilder = async () => {
        builderCallCount++;
        await firstUpgradePromise; // Block until we resolve it
        return {
          rules: createBaseRules(closedEndTime - 3600, closedEndTime),
          aggregatedMetrics: baseAggregatedMetrics,
          referrers: new Map(),
          accurateAsOf: immutableTimestamp,
        };
      };

      // Mock the builder to return our controllable builder
      vi.mocked(createEditionLeaderboardBuilder).mockReturnValue(controllableBuilder);

      // Create a regular cache that needs upgrading
      const oldCache = new SWRCache({
        fn: async () => ({
          rules: createBaseRules(closedEndTime - 3600, closedEndTime),
          aggregatedMetrics: baseAggregatedMetrics,
          referrers: new Map(),
          accurateAsOf: now,
        }),
        ttl: minutesToSeconds(5),
        proactiveRevalidationInterval: minutesToSeconds(1),
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, oldCache);

      const editionConfigSet = new Map() as ReferralProgramEditionConfigSet;
      editionConfigSet.set(editionSlug, {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
      });

      const indexingStatus = createMockIndexingStatus(immutableTimestamp);

      // Call checkAndUpgradeImmutableCaches twice concurrently
      const firstCall = checkAndUpgradeImmutableCaches(caches, editionConfigSet, indexingStatus);
      const secondCall = checkAndUpgradeImmutableCaches(caches, editionConfigSet, indexingStatus);

      // Both calls should return immediately (non-blocking)
      await Promise.all([firstCall, secondCall]);

      // At this point, the first upgrade should be in progress, second should have been skipped
      // The builder should have been called only once (for the first upgrade attempt)
      expect(builderCallCount).toBe(1);

      // The old cache should still be in place (upgrade not complete yet)
      expect(caches.get(editionSlug)).toBe(oldCache);

      // Now resolve the first upgrade
      resolveFirstUpgrade!();

      // Wait for the upgrade to complete
      await vi.waitFor(
        () => {
          const currentCache = caches.get(editionSlug);
          expect(currentCache).not.toBe(oldCache);
          expect(currentCache?.isIndefinitelyStored()).toBe(true);
        },
        { timeout: 1000 },
      );

      // Verify the builder was still only called once (no duplicate upgrade)
      expect(builderCallCount).toBe(1);
    });

    it("should skip caches that are already indefinitely stored", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200;
      const immutableTimestamp = addDuration(closedEndTime, ASSUMED_CHAIN_REORG_SAFE_DURATION) + 1;

      // Create an already-upgraded cache (infinite TTL, no revalidation)
      const alreadyUpgradedCache = new SWRCache({
        fn: async () => ({
          rules: createBaseRules(closedEndTime - 3600, closedEndTime),
          aggregatedMetrics: baseAggregatedMetrics,
          referrers: new Map(),
          accurateAsOf: immutableTimestamp,
        }),
        ttl: Number.POSITIVE_INFINITY,
        proactiveRevalidationInterval: undefined,
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, alreadyUpgradedCache);

      const editionConfigSet = new Map() as ReferralProgramEditionConfigSet;
      editionConfigSet.set(editionSlug, {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
      });

      const indexingStatus = createMockIndexingStatus(immutableTimestamp);

      // Mock should never be called since cache is already upgraded
      vi.mocked(createEditionLeaderboardBuilder).mockImplementation(() => {
        throw new Error("Builder should not be called for already upgraded cache");
      });

      await checkAndUpgradeImmutableCaches(caches, editionConfigSet, indexingStatus);

      // Cache should remain the same
      expect(caches.get(editionSlug)).toBe(alreadyUpgradedCache);
      expect(alreadyUpgradedCache.isIndefinitelyStored()).toBe(true);
      expect(createEditionLeaderboardBuilder).not.toHaveBeenCalled();
    });

    it("should skip caches that are not yet immutably closed", async () => {
      const editionSlug = "test-edition";
      const recentEndTime = now - 60; // Only 1 minute ago, not past safety window
      const notImmutableTimestamp = now;

      // Create a regular cache for an edition that hasn't closed long enough
      const notReadyCache = new SWRCache({
        fn: async () => ({
          rules: createBaseRules(recentEndTime - 3600, recentEndTime),
          aggregatedMetrics: baseAggregatedMetrics,
          referrers: new Map(),
          accurateAsOf: now,
        }),
        ttl: minutesToSeconds(5),
        proactiveRevalidationInterval: minutesToSeconds(1),
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, notReadyCache);

      const editionConfigSet = new Map() as ReferralProgramEditionConfigSet;
      editionConfigSet.set(editionSlug, {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: createBaseRules(recentEndTime - 3600, recentEndTime),
      });

      const indexingStatus = createMockIndexingStatus(notImmutableTimestamp);

      // Mock should never be called since edition is not immutably closed yet
      vi.mocked(createEditionLeaderboardBuilder).mockImplementation(() => {
        throw new Error("Builder should not be called for not-yet-closed edition");
      });

      await checkAndUpgradeImmutableCaches(caches, editionConfigSet, indexingStatus);

      // Cache should remain the same (not upgraded)
      expect(caches.get(editionSlug)).toBe(notReadyCache);
      expect(notReadyCache.isIndefinitelyStored()).toBe(false);
      expect(createEditionLeaderboardBuilder).not.toHaveBeenCalled();
    });

    it("should keep old cache if upgrade initialization fails", async () => {
      const editionSlug = "test-edition";
      const closedEndTime = now - 1200;
      const immutableTimestamp = addDuration(closedEndTime, ASSUMED_CHAIN_REORG_SAFE_DURATION) + 1;

      // Create a regular cache that would normally be upgraded
      const oldCache = new SWRCache({
        fn: async () => ({
          rules: createBaseRules(closedEndTime - 3600, closedEndTime),
          aggregatedMetrics: baseAggregatedMetrics,
          referrers: new Map(),
          accurateAsOf: now,
        }),
        ttl: minutesToSeconds(5),
        proactiveRevalidationInterval: minutesToSeconds(1),
        errorTtl: minutesToSeconds(1),
        proactivelyInitialize: false,
      });

      const caches = new Map();
      caches.set(editionSlug, oldCache);

      const editionConfigSet = new Map() as ReferralProgramEditionConfigSet;
      editionConfigSet.set(editionSlug, {
        slug: editionSlug,
        displayName: "Test Edition",
        rules: createBaseRules(closedEndTime - 3600, closedEndTime),
      });

      const indexingStatus = createMockIndexingStatus(immutableTimestamp);

      // Mock builder to fail
      const failingBuilder = async () => {
        throw new Error("Simulated initialization failure");
      };
      vi.mocked(createEditionLeaderboardBuilder).mockReturnValue(failingBuilder);

      await checkAndUpgradeImmutableCaches(caches, editionConfigSet, indexingStatus);

      // Wait for the upgrade attempt to complete and verify it failed gracefully
      await vi.waitFor(
        () => {
          expect(createEditionLeaderboardBuilder).toHaveBeenCalledOnce();
          // Old cache should still be in place (upgrade failed)
          expect(caches.get(editionSlug)).toBe(oldCache);
          expect(oldCache.isIndefinitelyStored()).toBe(false);
        },
        { timeout: 1000 },
      );
    });
  });
});
