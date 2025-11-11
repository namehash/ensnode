import pMemoize from "p-memoize";

import { TtlCache, getEthnamesSubregistryId } from "@ensnode/ensnode-sdk";
import { ENSAWARDS_START_DATE, ENSAWARDS_END_DATE } from "@namehash/ens-referrals";

import config from "@/config";
import { getTopReferrers } from "@/lib/ensanalytics/database";
import { factory } from "@/lib/hono-factory";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

// memoizes the getTopReferrers promise across TTL_MS
export const fetcher = pMemoize(
  async () => {
    const subregistryId = getEthnamesSubregistryId(config.namespace);
    return getTopReferrers(ENSAWARDS_START_DATE, ENSAWARDS_END_DATE, subregistryId);
  },
  {
    cache: new TtlCache(TTL_MS),
  },
);

export type TopReferrersCacheVariables = {
  topReferrersCache: Awaited<ReturnType<typeof fetcher>>;
};

/**
 * Middleware that fetches and caches top referrers data.
 *
 * Retrieves the top referrers from the database and caches them for TTL_MS
 * duration to avoid excessive database queries. Sets the `topReferrersCache`
 * variable on the context for use by other middleware and handlers.
 */
export const topReferrersCacheMiddleware = factory.createMiddleware(async (c, next) => {
  c.set("topReferrersCache", await fetcher());
  await next();
});
