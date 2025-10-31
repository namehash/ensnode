import { getUnixTime } from "date-fns";
import type { PromiseResult } from "p-reflect";

import {
  createRealtimeIndexingStatusProjection,
  type Duration,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseOk,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

let prevIndexingStatusOk = false;
let prevIsWithinMaxRealtime = false;

let didInitialIndexingStatus = false;
let didInitialRealtime = false;

export type IsRealtimeVariables = { isRealtime: boolean };

/**
 * Type guard to check if an indexing status result is successful and OK.
 *
 * @param result - Promise result containing IndexingStatusResponse
 * @returns True if the result is fulfilled and has OK response code
 */
const isIndexingStatusOk = (
  result: PromiseResult<IndexingStatusResponse>,
): result is PromiseResult<IndexingStatusResponse> & { value: IndexingStatusResponseOk } =>
  result.status === "fulfilled" && result.value.responseCode === IndexingStatusResponseCodes.Ok;

export const makeIsRealtimeMiddleware = (scope: string, maxRealtimeDistance: Duration) => {
  const logger = makeLogger(scope);

  return factory.createMiddleware(async (c, next) => {
    c.set("isRealtime", false); // default to not realtime

    ////////////////////////////////////
    /// Indexing Status API Availability
    ////////////////////////////////////

    const indexingStatusOk = isIndexingStatusOk(c.var.indexingStatus);

    // log notice with reason when Indexing Status is available
    // NOTE: defaulting prevIndexingStatusOk to false allows this branch to run at startup
    if (
      (!didInitialIndexingStatus && indexingStatusOk) || // first time
      (didInitialIndexingStatus && !prevIndexingStatusOk && indexingStatusOk) // future change in status
    ) {
      logger.info(`ENSIndexer Indexing Status: AVAILABLE`);
    }

    // log notice with reason when Indexing Status is unavilable
    if (
      (!didInitialIndexingStatus && !indexingStatusOk) || // first time
      (didInitialIndexingStatus && prevIndexingStatusOk && !indexingStatusOk) // future change in status
    ) {
      if (c.var.indexingStatus.isRejected) {
        logger.warn(
          `ENSIndexer Indexing Status: UNAVAILABLE. ENSApi was unable to fetch the current ENSIndexer Indexing Status: ${c.var.indexingStatus.reason}`,
        );
      } else if (c.var.indexingStatus.value.responseCode === IndexingStatusResponseCodes.Error) {
        logger.warn(
          `ENSIndexer Indexing Status: UNAVAILABLE. ENSIndexer is reporting an Indexing Status Error.`,
        );
      }
    }

    didInitialIndexingStatus = true;
    prevIndexingStatusOk = indexingStatusOk;

    // no indexing status available? no acceleration
    if (!indexingStatusOk) return await next();

    ////////////////////////////
    /// Is Within Realtime Check
    ////////////////////////////

    // construct a new realtimeProjection with current time
    const realtimeProjection = createRealtimeIndexingStatusProjection(
      c.var.indexingStatus.value.realtimeProjection.snapshot,
      getUnixTime(new Date()),
    );

    // determine whether we're within an acceptable window to accelerate
    const isWithinMaxRealtime = realtimeProjection.worstCaseDistance <= maxRealtimeDistance;

    // log notice when ENSIndexer transitions into realtime
    if (
      (!didInitialRealtime && isWithinMaxRealtime) || // first time
      (didInitialRealtime && !prevIsWithinMaxRealtime && isWithinMaxRealtime) // future change in status
    ) {
      logger.info(`ENSIndexer is within ${maxRealtimeDistance} seconds of realtime.`);
    }

    // log notice when ENSIndexer transitions out of realtime
    if (
      (!didInitialRealtime && !isWithinMaxRealtime) || // first time
      (didInitialRealtime && prevIsWithinMaxRealtime && !isWithinMaxRealtime) // future change in status
    ) {
      logger.warn(
        `ENSIndexer is NOT realtime (Worst Case Lag: ${c.var.indexingStatus.value.realtimeProjection.worstCaseDistance} seconds > ${maxRealtimeDistance} seconds).`,
      );
    }

    didInitialRealtime = true;
    prevIsWithinMaxRealtime = isWithinMaxRealtime;

    c.set("isRealtime", isWithinMaxRealtime);
    return await next();
  });
};
