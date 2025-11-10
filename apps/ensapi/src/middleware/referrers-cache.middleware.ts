import { getUnixTime } from "date-fns";
import pMemoize from "p-memoize";

import { TtlCache } from "@ensnode/ensnode-sdk";

import { getTopReferrers } from "@/lib/ensanalytics/database";
import type { ReferrerCache } from "@/lib/ensanalytics/types";
import { factory } from "@/lib/hono-factory";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

// memoizes the getTopReferrers promise across TTL_MS
export const fetcher = pMemoize(
  async (): Promise<ReferrerCache> => {
    const referrers = await getTopReferrers();
    return {
      referrers,
      updatedAt: getUnixTime(new Date()),
    };
  },
  {
    cache: new TtlCache(TTL_MS),
  },
);

export type ReferrersCacheVariables = {
  referrersCache: Awaited<ReturnType<typeof fetcher>>;
};

/**
 * Middleware that fetches and caches top referrers data.
 *
 * Retrieves the top referrers from the database and caches them for TTL_MS
 * duration to avoid excessive database queries. Sets the `referrersCache`
 * variable on the context for use by other middleware and handlers.
 */
export const referrersCacheMiddleware = factory.createMiddleware(async (c, next) => {
  c.set("referrersCache", await fetcher());
  await next();
});
