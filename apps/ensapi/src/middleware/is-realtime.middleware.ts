import type { Duration } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

/**
 * Type definition for the is realtime middleware context passed to downstream middleware and handlers.
 */
export type IsRealtimeMiddlewareVariables = { isRealtime: boolean };

export const makeIsRealtimeMiddleware = (scope: string, maxRealtimeDistance: Duration) => {
  const logger = makeLogger(scope);

  let hasLoggedIndexingStatusError = false;
  let lastLoggedIsRealtime: boolean | null = null;

  return factory.createMiddleware(async function isRealtimeMiddleware(c, next) {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(isRealtimeMiddleware): indexingStatusMiddleware required`);
    }

    if (c.var.indexingStatus instanceof Error) {
      // no indexing status available in context
      if (!hasLoggedIndexingStatusError) {
        logger.warn(
          `ENSIndexer is NOT guaranteed to be within ${maxRealtimeDistance} seconds of realtime. Current indexing status has not been successfully fetched by this ENSApi instance yet and is therefore unknown to this ENSApi instance because: ${c.var.indexingStatus.message}.`,
        );
        // we log this warning a max of once per `isRealtimeMiddleware` per
        // ENSApi instance lifecycle since for an ENSApi instance lifecycle,
        // it's impossible to the indexing status middleware to transition back
        // to `isRejected` after becoming `isFulfilled`.
        hasLoggedIndexingStatusError = true;
      }

      c.set("isRealtime", false);
      return await next();
    }

    // determine if we're within the max worst-case distance to qualify as "realtime".
    const isRealtime = c.var.indexingStatus.worstCaseDistance <= maxRealtimeDistance;

    if (lastLoggedIsRealtime !== isRealtime) {
      if (isRealtime) {
        logger.info(
          `ENSIndexer is guaranteed to be within ${maxRealtimeDistance} seconds of realtime.`,
        );
      } else {
        logger.warn(
          `ENSIndexer is NOT guaranteed to be within ${maxRealtimeDistance} seconds of realtime. (Worst Case distance: ${c.var.indexingStatus.worstCaseDistance} seconds > ${maxRealtimeDistance} seconds).`,
        );
      }
      lastLoggedIsRealtime = isRealtime;
    }

    c.set("isRealtime", isRealtime);
    return await next();
  });
};
