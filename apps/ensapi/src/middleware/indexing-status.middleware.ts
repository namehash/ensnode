import config from "@/config";

import pMemoize from "p-memoize";
import pReflect from "p-reflect";

import { ENSNodeClient, TtlCache } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL_MS = 5_000; // 5 seconds

// memoizes the reflected indexing-status-with-retries promise across TTL_MS
const fetcher = pMemoize(async () => pReflect(client.indexingStatus()), {
  cache: new TtlCache(TTL_MS),
});

export type IndexingStatusVariables = {
  indexingStatus: Awaited<ReturnType<typeof fetcher>>;
};

/**
 * Middleware that fetches and caches ENSIndexer indexing status.
 *
 * Retrieves the current indexing status from the configured ENSIndexer instance
 * and caches it for TTL_MS duration to avoid excessive API calls. Sets the
 * `indexingStatus` variable on the context for use by other middleware and handlers.
 */
export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  c.set("indexingStatus", await fetcher());
  await next();
});
