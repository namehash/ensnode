import { createFactory } from "hono/factory";

import type { AggregatedReferrerSnapshotCacheMiddlewareContext } from "@/middleware/aggregated-referrer-snapshot-cache.middleware";
import type { CanAccelerateMiddlewareContext } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareContext } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareContext } from "@/middleware/is-realtime.middleware";

export const factory = createFactory<{
  Variables: IndexingStatusMiddlewareContext &
    IsRealtimeMiddlewareContext &
    CanAccelerateMiddlewareContext &
    AggregatedReferrerSnapshotCacheMiddlewareContext;
}>();
