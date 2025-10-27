import config from "@/config";

import { getUnixTime } from "date-fns";
import type { PromiseResult } from "p-reflect";

import {
  createRealtimeIndexingStatusProjection,
  type Duration,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseOk,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import logger from "@/lib/logger";

export type CanAccelerateVariables = { canAccelerate: boolean };

const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // seconds

// TODO: expand this datamodel to include 'reasons' acceleration was disabled to drive ui

let didWarnNoProtocolAccelerationPlugin = false;
let prevIndexingStatusOk = false;
let prevIsWithinMaxRealtime = false;

let didInitialIndexingStatus = false;
let didInitialRealtime = false;

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

/**
 * Middleware that determines if protocol acceleration can be enabled for the current request.
 *
 * Checks if ENSIndexer has the protocol-acceleration plugin enabled and is within the
 * maximum realtime distance threshold. Sets the `canAccelerate` variable on the context
 * for use by resolution handlers.
 *
 * The effective distance for acceleration is indexing status cache time plus
 * MAX_REALTIME_DISTANCE_TO_ACCELERATE.
 */
export const canAccelerateMiddleware = factory.createMiddleware(async (c, next) => {
  // default canAccelerate to false
  c.set("canAccelerate", false);

  /////////////////////////////////////////////
  /// Protocol Acceleration Plugin Availability
  /////////////////////////////////////////////

  const hasProtocolAccelerationPlugin = config.ensIndexerPublicConfig.plugins.includes(
    PluginName.ProtocolAcceleration,
  );

  // log one warning to the console if !hasProtocolAccelerationPlugin
  if (!didWarnNoProtocolAccelerationPlugin && !hasProtocolAccelerationPlugin) {
    logger.warn(
      `ENSApi is connected to an ENSIndexer that does NOT include the ${PluginName.ProtocolAcceleration} plugin: ENSApi will NOT be able to accelerate Resolution API requests, even if ?accelerate=true. Resolution requests will abide by the full Forward/Reverse Resolution specification, including RPC calls and CCIP-Read requests to external CCIP-Read Gateways.`,
    );

    didWarnNoProtocolAccelerationPlugin = true;
  }

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
  const isWithinMaxRealtime =
    realtimeProjection.worstCaseDistance <= MAX_REALTIME_DISTANCE_TO_ACCELERATE;

  if (hasProtocolAccelerationPlugin) {
    // log notice when ENSIndexer transitions into realtime
    if (
      (!didInitialRealtime && isWithinMaxRealtime) || // first time
      (didInitialRealtime && !prevIsWithinMaxRealtime && isWithinMaxRealtime) // future change in status
    ) {
      logger.info(`ENSIndexer is realtime, Protocol Acceleration is now ENABLED.`);
    }

    // log notice when ENSIndexer transitions out of realtime
    if (
      (!didInitialRealtime && !isWithinMaxRealtime) || // first time
      (didInitialRealtime && prevIsWithinMaxRealtime && !isWithinMaxRealtime) // future change in status
    ) {
      logger.warn(
        `ENSIndexer is NOT realtime (Worst Case Lag: ${c.var.indexingStatus.value.realtimeProjection.worstCaseDistance} seconds > ${MAX_REALTIME_DISTANCE_TO_ACCELERATE} seconds), Protocol Acceleration is currently DISABLED.`,
      );
    }
  }

  didInitialRealtime = true;
  prevIsWithinMaxRealtime = isWithinMaxRealtime;

  /////////////////////////////
  /// Can Accelerate Derivation
  /////////////////////////////

  // the Resolution API can accelerate requests if
  // a) ENSIndexer reports that it is within MAX_REALTIME_DISTANCE_TO_ACCELERATE of realtime, and
  // b) ENSIndexer reports that it has the ProtocolAcceleration plugin enabled.
  const canAccelerate = isWithinMaxRealtime && hasProtocolAccelerationPlugin;

  c.set("canAccelerate", canAccelerate);
  await next();
});
