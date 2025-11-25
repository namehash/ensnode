import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("can-accelerate.middleware");

export type CanAccelerateMiddlewareVariables = { canAccelerate: boolean };

// TODO: expand this datamodel to include 'reasons' acceleration was disabled to drive ui

let didWarnNoProtocolAccelerationPlugin = false;
let didInitialCanAccelerate = false;
let prevCanAccelerate = false;

/**
 * Middleware that determines if protocol acceleration can be enabled for the current request.
 *
 * Checks if ENSIndexer has the protocol-acceleration plugin enabled and is realtime according to
 * a parent isRealtimeMiddleware. Sets the `canAccelerate` variable on the context for use by
 * resolution handlers.
 */
export const canAccelerateMiddleware = factory.createMiddleware(async (c, next) => {
  if (c.var.isRealtime === undefined) {
    throw new Error(`Invariant(canAccelerateMiddleware): isRealtime middleware required`);
  }

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

  /////////////////////////////
  /// Can Accelerate Derivation
  /////////////////////////////

  // the Resolution API can accelerate requests if
  // a) ENSIndexer reports that it is within MAX_REALTIME_DISTANCE_TO_ACCELERATE of realtime, and
  // b) ENSIndexer reports that it has the ProtocolAcceleration plugin enabled.
  const canAccelerate = hasProtocolAccelerationPlugin && c.var.isRealtime;

  // log notice when acceleration begins
  if (
    (!didInitialCanAccelerate && canAccelerate) || // first time
    (didInitialCanAccelerate && !prevCanAccelerate && canAccelerate) // future change in status
  ) {
    logger.info(`Protocol Acceleration is now ENABLED.`);
  }

  // log notice when acceleration ends
  if (
    (!didInitialCanAccelerate && !canAccelerate) || // first time
    (didInitialCanAccelerate && prevCanAccelerate && !canAccelerate) // future change in status
  ) {
    logger.info(`Protocol Acceleration is DISABLED.`);
  }

  prevCanAccelerate = canAccelerate;
  didInitialCanAccelerate = true;

  c.set("canAccelerate", canAccelerate);
  await next();
});
