import { factory } from "@/lib/hono-factory";
import { Duration, IndexingStatusResponseCodes, PluginName } from "@ensnode/ensnode-sdk";
import pMemoize from "p-memoize";

export type CanAccelerateVariables = { canAccelerate: boolean };

const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // seconds

// TODO: expand this datamodel to include 'reasons' acceleration was disabled to drive ui

let didWarnNoProtocolAccelerationPlugin = false;
let prevIsWithinMaxRealtime = false;

// derives canAccelerate from the indexing status, within MAX_REALTIME_DISTANCE_TO_ACCELERATE of
// worst case distance. Effective distance is indexing status cache time + MAX_REALTIME_DISTANCE_TO_ACCELERATE
export const canAccelerateMiddleware = factory.createMiddleware(async (c, next) => {
  // no indexing status? no acceleration
  if (c.var.indexingStatus.isRejected) {
    c.set("canAccelerate", false);
    return await next();
  }

  // indexing status is failed? no acceleration
  if (c.var.indexingStatus.value.responseCode === IndexingStatusResponseCodes.Error) {
    c.set("canAccelerate", false);
    return await next();
  }

  const isWithinMaxRealtime =
    c.var.indexingStatus.value.realtimeProjection.worstCaseDistance <=
    MAX_REALTIME_DISTANCE_TO_ACCELERATE;

  const hasProtocolAccelerationPlugin = c.var.ensIndexerPublicConfig.plugins.includes(
    PluginName.ProtocolAcceleration,
  );

  // the Resolution API can accelerate requests if
  // a) ENSIndexer reports that it is within MAX_REALTIME_DISTANCE_TO_ACCELERATE of realtime, and
  // b) ENSIndexer reports that it has the ProtocolAcceleration plugin enabled.
  const canAccelerate = isWithinMaxRealtime && hasProtocolAccelerationPlugin;

  // log one warning to the console if !hasProtocolAccelerationPlugin
  if (!didWarnNoProtocolAccelerationPlugin && !hasProtocolAccelerationPlugin) {
    didWarnNoProtocolAccelerationPlugin = true;
    console.warn(
      `ENSAPI is connected to an ENSIndexer that does NOT include the ${PluginName.ProtocolAcceleration} plugin: ENSAPI will NOT be able to accelerate Resolution API requests, even if ?accelerate=true. Resolution requests will abide by the full Forward/Reverse Resolution specification, including RPC calls and CCIP-Read requests to external CCIP-Read Gateways.`,
    );
  }

  if (hasProtocolAccelerationPlugin) {
    // log notice when ENSIndexer transitions into realtime
    // NOTE: defaulting prevIsWithinMaxRealtime to false allows this branch to run at startup
    if (!prevIsWithinMaxRealtime && isWithinMaxRealtime) {
      console.log(`ENSIndexer is realtime, Protocol Acceleration is ENABLED.`);
    }

    // log notice when ENSIndexer transitions out of realtime
    if (prevIsWithinMaxRealtime && !isWithinMaxRealtime) {
      console.warn(
        `ENSIndexer is NOT realtime (Worst Case Lag: ${c.var.indexingStatus.value.realtimeProjection.worstCaseDistance} seconds > ${MAX_REALTIME_DISTANCE_TO_ACCELERATE} seconds), Protocol Acceleration is DISABLED.`,
      );
    }
  }

  c.set("canAccelerate", canAccelerate);
  await next();
});
