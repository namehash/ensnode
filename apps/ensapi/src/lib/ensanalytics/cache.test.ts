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
    { referrer: "0x1111111111111111111111111111111111111111", totalReferrals: 100 },
    { referrer: "0x2222222222222222222222222222222222222222", totalReferrals: 75 },
    { referrer: "0x3333333333333333333333333333333333333333", totalReferrals: 50 },
    { referrer: "0x4444444444444444444444444444444444444444", totalReferrals: 25 },
    { referrer: "0x5555555555555555555555555555555555555555", totalReferrals: 10 },
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

      // Cache should not be initialized or ready since data load failed
      expect(cacheService.isCacheReady()).toBe(false);
      const cache = cacheService.getCache();
      expect(cache).toBe(null);
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
        updatedAt: expect.any(Number),
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
        updatedAt: expect.any(Number),
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
        updatedAt: expect.any(Number),
      });
    });

    it("should throw error when page is beyond available data", () => {
      expect(() => cacheService.getTopReferrers(10, 2)).toThrow(
        "Page number 10 exceeds available data. Maximum page is 3 for limit 2",
      );
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
        updatedAt: expect.any(Number),
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

  describe("getCache", () => {
    it("should return null before initialization", () => {
      const cache = cacheService.getCache();

      expect(cache).toBe(null);
    });

    it("should return cache data after initialization", async () => {
      vi.mocked(database.getTopReferrers).mockResolvedValue(mockReferrers);

      await cacheService.initialize();

      const cache = cacheService.getCache();

      expect(cache).not.toBe(null);
      expect(cache?.referrers).toEqual(mockReferrers);
      expect(cache?.updatedAt).toEqual(expect.any(Number));
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
