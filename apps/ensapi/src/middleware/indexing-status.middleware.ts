import config from "@/config";

import pReflect, { type PromiseResult } from "p-reflect";

import {
  type Duration,
  ENSNodeClient,
  type ErrorResponse,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  staleWhileRevalidate,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("indexing-status.middleware");
const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL: Duration = 5; // 5 seconds

export const fetcher = staleWhileRevalidate(
  async () =>
    pReflect(
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
    ),
  TTL,
);

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
    logger.error(
      "Unable to fetch current indexing status. All fetch attempts have failed since service startup and no cached status is available. This may indicate the ENSIndexer service is unreachable or not responding.",
    );

    return c.json(
      {
        message: "Internal Server Error",
        details: "Unable to fetch current indexing status.",
      } satisfies ErrorResponse,
      500,
    );
  }

  c.set("indexingStatus", indexingStatus);
  await next();
});
