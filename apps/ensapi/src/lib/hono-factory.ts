import { createFactory } from "hono/factory";

import type { AggregatedReferrerSnapshotCacheVariables } from "@/middleware/aggregated-referrer-snapshot-cache.middleware";
import type { CanAccelerateVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeVariables } from "@/middleware/is-realtime.middleware";

export const factory = createFactory<{
  Variables: IndexingStatusVariables &
    IsRealtimeVariables &
    CanAccelerateVariables &
    AggregatedReferrerSnapshotCacheVariables;
}>();
