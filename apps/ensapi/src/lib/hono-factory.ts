import { createFactory } from "hono/factory";

import type { AggregatedReferrerSnapshotCacheMiddlewareVariables } from "@/middleware/aggregated-referrer-snapshot-cache.middleware";
import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareVariables } from "@/middleware/is-realtime.middleware";

type MiddlewareVariables = Partial<
  IndexingStatusMiddlewareVariables &
    IsRealtimeMiddlewareVariables &
    CanAccelerateMiddlewareVariables &
    AggregatedReferrerSnapshotCacheMiddlewareVariables
>;

export const factory = createFactory<{
  Variables: MiddlewareVariables;
}>();
