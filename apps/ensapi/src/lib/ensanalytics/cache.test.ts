import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CacheService } from "./cache";
import * as database from "./database";
import type { ReferrerData } from "./types";

// Mock the database module
vi.mock("./database");

// Mock node-cron
vi.mock("node-cron", () => ({
  default: {
    schedule: vi.fn(() => ({
      stop: vi.fn(),
    })),
  },
  schedule: vi.fn(() => ({
    stop: vi.fn(),
  })),
}));

// Mock config
vi.mock("@/config", () => ({
  default: {
    databaseSchemaName: "public",
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CacheService", () => {
  let cacheService: CacheService;
  const mockReferrers: ReferrerData[] = [
    { referrer: "0x1111111111111111111111111111111111111111", total_referrals: 100 },
    { referrer: "0x2222222222222222222222222222222222222222", total_referrals: 75 },
    { referrer: "0x3333333333333333333333333333333333333333", total_referrals: 50 },
    { referrer: "0x4444444444444444444444444444444444444444", total_referrals: 25 },
    { referrer: "0x5555555555555555555555555555555555555555", total_referrals: 10 },
  ];

  beforeEach(() => {
    cacheService = new CacheService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cacheService.shutdown();
  });

  describe("initialize", () => {
    it("should initialize successfully with data from database", async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue(mockReferrers);

      await cacheService.initialize();

      expect(cacheService.isCacheReady()).toBe(true);
      expect(database.getTopReferrers).toHaveBeenCalledTimes(1);
    });

    it("should handle initial data load failure gracefully", async () => {
      vi.mocked(database.getTopReferrers).mockRejectedValue(new Error("Database error"));

      // Initialize should not throw - it catches errors to avoid breaking the service
      await expect(cacheService.initialize()).resolves.not.toThrow();

      // Cache should be marked as initialized but not ready (no data)
      expect(cacheService.isCacheReady()).toBe(false);
      const stats = cacheService.getCacheStats();
      expect(stats.isInitialized).toBe(true);
      expect(stats.totalReferrers).toBe(0);
    });
  });

  describe("getTopReferrers", () => {
    beforeEach(async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue(mockReferrers);
      await cacheService.initialize();
    });

    it("should return paginated results for first page", () => {
      const result = cacheService.getTopReferrers(1, 2);

      expect(result).toEqual({
        referrers: [mockReferrers[0], mockReferrers[1]],
        total: 5,
        page: 1,
        limit: 2,
        hasNext: true,
        hasPrev: false,
      });
    });

    it("should return paginated results for middle page", () => {
      const result = cacheService.getTopReferrers(2, 2);

      expect(result).toEqual({
        referrers: [mockReferrers[2], mockReferrers[3]],
        total: 5,
        page: 2,
        limit: 2,
        hasNext: true,
        hasPrev: true,
      });
    });

    it("should return paginated results for last page", () => {
      const result = cacheService.getTopReferrers(3, 2);

      expect(result).toEqual({
        referrers: [mockReferrers[4]],
        total: 5,
        page: 3,
        limit: 2,
        hasNext: false,
        hasPrev: true,
      });
    });

    it("should return empty array when page is beyond available data", () => {
      const result = cacheService.getTopReferrers(10, 2);

      expect(result).toEqual({
        referrers: [],
        total: 5,
        page: 10,
        limit: 2,
        hasNext: false,
        hasPrev: true,
      });
    });

    it("should return all items when limit is larger than total", () => {
      const result = cacheService.getTopReferrers(1, 100);

      expect(result).toEqual({
        referrers: mockReferrers,
        total: 5,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false,
      });
    });

    it("should throw error if cache is not initialized", () => {
      const uninitializedCache = new CacheService();

      expect(() => uninitializedCache.getTopReferrers(1, 10)).toThrow(
        "Cache not initialized or empty",
      );
    });
  });

  describe("isCacheReady", () => {
    it("should return false before initialization", () => {
      expect(cacheService.isCacheReady()).toBe(false);
    });

    it("should return true after successful initialization", async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue(mockReferrers);

      await cacheService.initialize();

      expect(cacheService.isCacheReady()).toBe(true);
    });

    it("should return false if initialized with empty data", async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue([]);

      await cacheService.initialize();

      expect(cacheService.isCacheReady()).toBe(false);
    });
  });

  describe("getCacheStats", () => {
    it("should return correct stats before initialization", () => {
      const stats = cacheService.getCacheStats();

      expect(stats).toEqual({
        totalReferrers: 0,
        isInitialized: false,
        lastRefresh: expect.any(Date),
      });
    });

    it("should return correct stats after initialization", async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue(mockReferrers);

      await cacheService.initialize();

      const stats = cacheService.getCacheStats();

      expect(stats).toEqual({
        totalReferrers: 5,
        isInitialized: true,
        lastRefresh: expect.any(Date),
      });
    });
  });

  describe("shutdown", () => {
    it("should stop refresh task on shutdown", async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue(mockReferrers);

      await cacheService.initialize();
      await cacheService.shutdown();

      // Cache should still be ready after shutdown (data persists)
      expect(cacheService.isCacheReady()).toBe(true);
    });

    it("should handle shutdown without initialization gracefully", async () => {
      await expect(cacheService.shutdown()).resolves.not.toThrow();
    });
  });
});
