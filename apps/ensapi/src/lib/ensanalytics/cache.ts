import { getUnixTime } from "date-fns";
import * as cron from "node-cron";

import logger from "@/lib/logger";

import { getTopReferrers } from "./database";
import type { PaginatedReferrers, ReferrerCache } from "./types";

const CACHE_REFRESH_INTERVAL_MINUTES = 5;

/**
 * CacheService manages an in-memory cache of top referrers data.
 * Automatically refreshes data from the database at regular intervals.
 */
export class CacheService {
  private cache: ReferrerCache | null = null;
  private refreshTask: cron.ScheduledTask | null = null;

  /**
   * Initializes the cache service by loading initial data and setting up automatic refresh.
   * @throws Error if initial data load fails
   */
  async initialize(): Promise<void> {
    logger.info("Initializing ENSAnalytics cache service...");

    // Load initial data
    await this.refreshData();

    // Set up automatic refresh every N minutes
    this.refreshTask = cron.schedule(`*/${CACHE_REFRESH_INTERVAL_MINUTES} * * * *`, async () => {
      logger.info("Refreshing referrers cache...");
      await this.refreshData();
    });

    const referrerCount = this.cache?.referrers.length ?? 0;
    logger.info(
      `ENSAnalytics cache service initialized successfully with ${referrerCount} referrers`,
    );
  }

  /**
   * Refreshes the cache data from the database.
   * Logs errors but doesn't throw to avoid breaking the service.
   */
  private async refreshData(): Promise<void> {
    try {
      const newReferrers = await getTopReferrers();
      // Atomic update: create a new cache object with all fields updated together
      this.cache = {
        referrers: newReferrers,
        updatedAt: getUnixTime(new Date()),
      };
      logger.info(`Cache refreshed with ${newReferrers.length} referrers`);
    } catch (error) {
      logger.error({ error }, "Failed to refresh cache - continuing with stale data");
      // Don't throw error here to avoid breaking the service
      // The cache will continue to serve stale data
    }
  }

  /**
   * Retrieves a paginated list of top referrers from the cache.
   *
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page
   * @returns Paginated referrers data with navigation metadata
   * @throws Error if cache is not initialized, empty, or invalid pagination parameters
   */
  getTopReferrers(page: number, limit: number): PaginatedReferrers {
    if (!this.cache || this.cache.referrers.length === 0) {
      throw new Error("Cache not initialized or empty");
    }

    // Validate pagination parameters
    if (page < 1) {
      throw new Error("Page number must be greater than or equal to 1");
    }

    if (limit <= 0) {
      throw new Error("Limit must be greater than 0");
    }

    const startIndex = (page - 1) * limit;

    // Check if the requested page is beyond available data
    if (startIndex >= this.cache.referrers.length) {
      const maxPage = Math.ceil(this.cache.referrers.length / limit);
      throw new Error(
        `Page number ${page} exceeds available data. Maximum page is ${maxPage} for limit ${limit}`,
      );
    }

    const endIndex = startIndex + limit;
    const paginatedReferrers = this.cache.referrers.slice(startIndex, endIndex);

    return {
      referrers: paginatedReferrers,
      total: this.cache.referrers.length,
      page,
      limit,
      hasNext: endIndex < this.cache.referrers.length,
      hasPrev: page > 1,
      updatedAt: this.cache.updatedAt,
    };
  }

  /**
   * Checks if the cache is ready to serve requests.
   * @returns True if cache is initialized and has data
   */
  isCacheReady(): boolean {
    return this.cache !== null && this.cache.referrers.length > 0;
  }

  /**
   * Gets the current cache data.
   * @returns The cache object if initialized, null otherwise
   */
  getCache(): ReferrerCache | null {
    return this.cache;
  }

  /**
   * Shuts down the cache service by stopping the refresh task.
   */
  async shutdown(): Promise<void> {
    if (this.refreshTask) {
      this.refreshTask.stop();
      logger.info("ENSAnalytics cache service shut down");
    }
  }
}

// Create a singleton instance
export const cacheService = new CacheService();
