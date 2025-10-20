import { factory } from "@/lib/hono-factory";
import { Duration, IndexingStatusResponseCodes, PluginName } from "@ensnode/ensnode-sdk";

export type CanAccelerateVariables = { canAccelerate: boolean };

const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // seconds

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

  c.set("canAccelerate", canAccelerate);
  await next();
});
