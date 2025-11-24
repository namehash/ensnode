import config from "@/config";

import pReflect, { type PromiseResult } from "p-reflect";

import {
  type Duration,
  ENSNodeClient,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseOk,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL: Duration = 5; // 5 seconds

export const fetcher = staleWhileRevalidate({
  fn: async () =>
    client.indexingStatus().then((response) => {
      // reject response with 'error' responseCode
      if (response.responseCode === IndexingStatusResponseCodes.Error) {
        throw new Error(
          "Received Indexing Status response with 'error' responseCode which will not be cached.",
        );
      }

      // resolve response to be cached
      return response;
    }),
  ttl: TTL,
  onRejected(reason) {
    logger.error(
      reason,
      "Unable to fetch current indexing status. All fetch attempts have failed since service startup and no cached status is available. This may indicate the ENSIndexer service is unreachable or not responding.",
    );
  },
});

export type IndexingStatusVariables = {
  indexingStatus: PromiseResult<IndexingStatusResponseOk>;
};

/**
 * Middleware that fetches and caches ENSIndexer indexing status.
 *
 * Retrieves the current indexing status from the configured ENSIndexer instance
 * and caches it for TTL duration to avoid excessive API calls. Sets the
 * `indexingStatus` variable on the context for use by other middleware and handlers.
 */
export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  const cachedIndexingStatus = await fetcher();
  // use p-reflect to wrap the cached indexing status or rejection
  // into a PromiseResult, so the downstream request handlers can
  // handle both success and failure cases, including error details.
  const indexingStatus = await pReflect(
    cachedIndexingStatus !== null
      ? Promise.resolve(cachedIndexingStatus)
      : Promise.reject(new Error("Unable to fetch current indexing status.")),
  );

  c.set("indexingStatus", indexingStatus);
  await next();
});
