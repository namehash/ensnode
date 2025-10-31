import { createFactory } from "hono/factory";

import type { CanAccelerateVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";

export const factory = createFactory<{
  Variables: IndexingStatusVariables & CanAccelerateVariables;
}>();
