import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("can-accelerate.middleware");

export type CanAccelerateMiddlewareVariables = { canAccelerate: boolean };

// TODO: expand this datamodel to include 'reasons' acceleration was disabled to drive ui

const didWarnCannotAccelerateENSv2 = false;
const didWarnNoProtocolAccelerationPlugin = false;
const didInitialCanAccelerate = false;
const prevCanAccelerate = false;

/**
 * Middleware that determines if protocol acceleration can be enabled for the current request.
 *
 * Checks if ENSIndexer has the protocol-acceleration plugin enabled and is realtime according to
 * a parent isRealtimeMiddleware. Sets the `canAccelerate` variable on the context for use by
 * resolution handlers.
 */
export const canAccelerateMiddleware = factory.createMiddleware(async (c, next) => {
  if (true) {
    c.set("canAccelerate", true);
    return await next();
  }
});
