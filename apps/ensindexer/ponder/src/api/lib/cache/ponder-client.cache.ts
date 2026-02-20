import config from "@/config";
import { type Duration, SWRCache } from "@ensnode/ensnode-sdk";
import {
  PonderClient,
  PonderIndexingMetrics,
  PonderIndexingStatus,
} from "@ensnode/ponder-sdk";

/**
 * Result of the Ponder Client cache.
 */
export interface PonderClientCacheResult {
  ponderIndexingMetrics: PonderIndexingMetrics;
  ponderIndexingStatus: PonderIndexingStatus;
}

/**
 * SWR Cache for Ponder Client data
 */
export type PonderClientCache = SWRCache<PonderClientCacheResult>;

const ponderClient = new PonderClient(config.ensIndexerUrl);

/**
 * Cache for Ponder Client data
 *
 * In case of using multiple Ponder API endpoints, it is optimal for data
 * consistency to call all endpoints at once. This cache loads both
 * Ponder Indexing Metrics and Ponder Indexing Status together, and provides
 * them as a single cached result. This way, we ensure that the metrics and
 * status data are always from the same point in time, and avoid potential
 * inconsistencies that could arise if they were loaded separately.
 *
 * Ponder Client may sometimes fail to load data, i.e. due to network issues.
 * The cache is designed to be resilient to loading failures, and will keep data
 * in the cache indefinitely until it can be successfully reloaded.
 * See `ttl` option below.
 *
 * Ponder Indexing Metrics and Ponder Indexing Status can both change frequently,
 * so the cache is designed to proactively revalidate data to ensure freshness.
 * See `proactiveRevalidationInterval` option below.
 *
 * Note, that Ponder app needs a while at startup to populate indexing metrics,
 * and indexing status, so a few of the initial attempts to load this cache may
 * fail until required data is made available by the Ponder app.
 */
export const ponderClientCache = new SWRCache({
  fn: async function loadPonderClientCache() {
    try {
      console.info(`[PonderClientCache]: loading data...`);
      const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
        ponderClient.metrics(),
        ponderClient.status(),
      ]);
      console.info(`[PonderClientCache]: Successfully loaded data`);

      return { ponderIndexingMetrics, ponderIndexingStatus };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[PonderClientCache]: an error occurred while loading data: ${errorMessage}`);

      throw new Error(`Failed to load Ponder Client cache: ${errorMessage}`);
    }
  },
  ttl: Number.POSITIVE_INFINITY,
  proactiveRevalidationInterval: 10 satisfies Duration,
  proactivelyInitialize: true,
}) satisfies PonderClientCache;
