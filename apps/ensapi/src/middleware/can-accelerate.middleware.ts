import { factory } from "@/lib/hono-factory";

export type CanAccelerateVariables = { canAccelerate: boolean };

// const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // seconds
// return realtimeProjection.worstCaseDistance <= MAX_REALTIME_DISTANCE_TO_ACCELERATE;

// memoizes the result of canAccelerateResolution within a 30s window
// this means that the effective worstCaseDistance is MAX_REALTIME_DISTANCE_TO_ACCELERATE + 30s
// and the initial request(s) in between ENSApi startup and the first resolution of
// canAccelerateResolution will NOT be accelerated (prefers correctness in responses)
export const canAccelerateMiddleware = factory.createMiddleware(async (c, next) => {
  // TODO: implement
  c.set("canAccelerate", false);
});
