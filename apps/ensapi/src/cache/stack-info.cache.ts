import config from "@/config";

import { minutesToSeconds } from "date-fns";

import {
  buildEnsNodeStackInfo,
  type CachedResult,
  type EnsNodeStackInfo,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { ensDbClient } from "@/lib/ensdb/singleton";
import { lazyProxy } from "@/lib/lazy";

/**
 * Loads the ENSNode stack info, either from cache if available,
 * or by building it from the public configs of ENSApi and ENSDb.
 *
 * The ENSNode Stack Info object is considered immutable for
 * the lifecycle of an ENSApi process instance, so once it is successfully
 * loaded, it will be cached indefinitely.
 */
async function loadEnsNodeStackInfo(
  cachedResult?: CachedResult<EnsNodeStackInfo>,
): Promise<EnsNodeStackInfo> {
  if (cachedResult && !(cachedResult.result instanceof Error)) {
    return cachedResult.result;
  }

  const ensApiPublicConfig = buildEnsApiPublicConfig(config);
  const ensDbPublicConfig = await ensDbClient.buildEnsDbPublicConfig();

  return buildEnsNodeStackInfo(ensApiPublicConfig, ensDbPublicConfig);
}

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
// SWRCache with proactivelyInitialize:true starts background polling immediately
// on construction, which would trigger ensDbClient before env vars are available.
/**
 * Cache for ENSNode stack info
 * Once successfully loaded, the ENSNode Stack Info is cached indefinitely and
 * never revalidated. This ensures the JSON is only fetched once during
 * the application lifecycle.
 *
 * Configuration:
 * - ttl: Infinity - Never expires once cached
 * - errorTtl: 1 minute - If loading fails, retry on next access after 1 minute
 * - proactiveRevalidationInterval: undefined - No proactive revalidation
 * - proactivelyInitialize: true - Load immediately on startup
 */
export const stackInfoCache = lazyProxy(
  () =>
    /**
     * Cache for ENSNode stack info
     *
     * Once initialized successfully, this cache will always return
     * the same stack info for the lifecycle of the ENSApi instance.
     *
     * If initialization fails, it will keep retrying on access until it succeeds, which is desirable because the stack info is critical for the functioning of the application and we want to recover from transient initialization failures without requiring a restart.
     */
    new SWRCache<EnsNodeStackInfo>({
      fn: loadEnsNodeStackInfo,
      ttl: Number.POSITIVE_INFINITY,
      errorTtl: minutesToSeconds(1),
      proactiveRevalidationInterval: undefined,
      proactivelyInitialize: true,
    }),
);
