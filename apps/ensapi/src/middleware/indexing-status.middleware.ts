import config from "@/config";

import pReflect, { type PromiseResult } from "p-reflect";

import {
  type Duration,
  ENSNodeClient,
  type ErrorResponse,
  type IndexingStatusResponse,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL: Duration = 5; // 5 seconds

export const fetcher = staleWhileRevalidate(async () => pReflect(client.indexingStatus()), TTL);

export type IndexingStatusVariables = {
  indexingStatus: PromiseResult<IndexingStatusResponse>;
};

/**
 * Middleware that fetches and caches ENSIndexer indexing status.
 *
 * Retrieves the current indexing status from the configured ENSIndexer instance
 * and caches it for TTL duration to avoid excessive API calls. Sets the
 * `indexingStatus` variable on the context for use by other middleware and handlers.
 */
export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  const indexingStatus = await fetcher();

  if (indexingStatus === null) {
    logger.error("Could not fetch Indexing Status API response");

    return c.json(
      {
        message: "Internal Server Error",
      } satisfies ErrorResponse,
      500,
    );
  }

  c.set("indexingStatus", indexingStatus);
  await next();
});
