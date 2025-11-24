import type { Duration } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

let loggedIsRejected = false;

let lastLoggedIsRealtime: boolean | null = null;

/**
 * Type definition for the is realtime middleware context passed to downstream middleware and handlers.
 */
export type IsRealtimeMiddlewareContext = { isRealtime: boolean };

export const makeIsRealtimeMiddleware = (scope: string, maxRealtimeDistance: Duration) => {
  const logger = makeLogger(scope);

  return factory.createMiddleware(async (c, next) => {
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(isRealtimeMiddleware): indexingStatusMiddleware required`);
    }

    if (c.var.indexingStatus.isRejected) {
      if (!loggedIsRejected) {
        logger.warn(
          `ENSIndexer is NOT guaranteed to be within ${maxRealtimeDistance} seconds of realtime. Current indexing status has not been successfully fetched by this ENSApi instance yet and is therefore unknown to this ENSApi instance because: ${c.var.indexingStatus.reason}.`,
        );
        loggedIsRejected = true;
      }
      c.set("isRealtime", false);
      return await next();
    }

    // determine whether we're within an acceptable window to accelerate
    const isRealtime = c.var.indexingStatus.value.worstCaseDistance <= maxRealtimeDistance;

    if (isRealtime && lastLoggedIsRealtime !== isRealtime) {
      logger.info(
        `ENSIndexer is guaranteed to be within ${maxRealtimeDistance} seconds of realtime.`,
      );
      lastLoggedIsRealtime = isRealtime;
    } else if (!isRealtime && lastLoggedIsRealtime !== isRealtime) {
      logger.warn(
        `ENSIndexer is NOT guaranteed to be within ${maxRealtimeDistance} seconds of realtime. (Worst Case distance: ${c.var.indexingStatus.value.worstCaseDistance} seconds > ${maxRealtimeDistance} seconds).`,
      );
      lastLoggedIsRealtime = isRealtime;
    }

    c.set("isRealtime", isRealtime);
    return await next();
  });
};
