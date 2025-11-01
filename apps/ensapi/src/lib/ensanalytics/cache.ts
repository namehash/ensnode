import * as cron from "node-cron";

import logger from "@/lib/logger";

import { getTopReferrers } from "./database";
import type { CacheStats, PaginatedReferrers, ReferrerData } from "./types";

const CACHE_REFRESH_INTERVAL_MINUTES = 5;

/**
 * CacheService manages an in-memory cache of top referrers data.
 * Automatically refreshes data from the database at regular intervals.
 */
export class CacheService {
  private referrers: ReferrerData[] = [];
  private isInitialized = false;
  private refreshTask: cron.ScheduledTask | null = null;
  private lastRefreshTime: Date = new Date();

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

    this.isInitialized = true;
    logger.info(
      `ENSAnalytics cache service initialized successfully with ${this.referrers.length} referrers`,
    );
  }

  /**
   * Refreshes the cache data from the database.
   * Logs errors but doesn't throw to avoid breaking the service.
   */
  private async refreshData(): Promise<void> {
    try {
      const newReferrers = await getTopReferrers();
      this.referrers = newReferrers;
      this.lastRefreshTime = new Date();
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
   * @throws Error if cache is not initialized or empty
   */
  getTopReferrers(page: number, limit: number): PaginatedReferrers {
    if (!this.isInitialized || this.referrers.length === 0) {
      throw new Error("Cache not initialized or empty");
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReferrers = this.referrers.slice(startIndex, endIndex);

    return {
      referrers: paginatedReferrers,
      total: this.referrers.length,
      page,
      limit,
      hasNext: endIndex < this.referrers.length,
      hasPrev: page > 1,
    };
  }

  /**
   * Checks if the cache is ready to serve requests.
   * @returns True if cache is initialized and has data
   */
  isCacheReady(): boolean {
    return this.isInitialized && this.referrers.length > 0;
  }

  /**
   * Gets current cache statistics.
   * @returns Cache statistics including total referrers count and last refresh time
   */
  getCacheStats(): CacheStats {
    return {
      totalReferrers: this.referrers.length,
      isInitialized: this.isInitialized,
      lastRefresh: this.lastRefreshTime,
    };
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
