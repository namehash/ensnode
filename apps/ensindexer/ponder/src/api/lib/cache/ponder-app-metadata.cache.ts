import config from "@/config";

import { type Duration, SWRCache } from "@ensnode/ensnode-sdk";
import {
  PonderClient,
  type PonderIndexingMetrics,
  type PonderIndexingStatus,
} from "@ensnode/ponder-sdk";

/**
 * Metadata from a Ponder app.
 */
export interface PonderAppMetadata {
  ponderIndexingMetrics: PonderIndexingMetrics;
  ponderIndexingStatus: PonderIndexingStatus;
}

/**
 * SWR Cache for Ponder App Metadata
 */
export type PonderAppMetadataCache = SWRCache<PonderAppMetadata>;

const ponderClient = new PonderClient(config.ensIndexerUrl);

/**
 * Cache for Ponder App Metadata
 * In case of using multiple Ponder API endpoints, it is optimal for data
 * consistency to call all endpoints at once. This cache loads both
 * Ponder Indexing Metrics and Ponder Indexing Status together, and provides
 * them as a single cached result. This way, we ensure that the metrics and
 * status data are always from (approximately) the same point in time, and
 * minimize potential inconsistencies that could arise if they were loaded
 * separately.
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
export const ponderAppMetadataCache = new SWRCache({
  fn: async function loadPonderClientCache() {
    try {
      const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
        ponderClient.metrics(),
        ponderClient.status(),
      ]);

      return { ponderIndexingMetrics, ponderIndexingStatus };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[PonderAppMetadataCache]: an error occurred while loading data: ${errorMessage}`,
      );

      throw new Error(`Failed to load Ponder App Metadata cache: ${errorMessage}`);
    }
  },
  ttl: Number.POSITIVE_INFINITY,
  proactiveRevalidationInterval: 1 satisfies Duration,
}) satisfies PonderAppMetadataCache;
