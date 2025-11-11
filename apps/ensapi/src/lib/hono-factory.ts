import { createFactory } from "hono/factory";

import type { CanAccelerateVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeVariables } from "@/middleware/is-realtime.middleware";
import type { TopReferrersCacheVariables } from "@/middleware/top-referrers-cache.middleware";

export const factory = createFactory<{
  Variables: IndexingStatusVariables &
    IsRealtimeVariables &
    CanAccelerateVariables &
    TopReferrersCacheVariables;
}>();
