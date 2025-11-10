import { createFactory } from "hono/factory";

import type { CanAccelerateVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeVariables } from "@/middleware/is-realtime.middleware";
import type { ReferrersCacheVariables } from "@/middleware/referrers-cache.middleware";

export const factory = createFactory<{
  Variables: IndexingStatusVariables & IsRealtimeVariables & CanAccelerateVariables & ReferrersCacheVariables;
}>();
