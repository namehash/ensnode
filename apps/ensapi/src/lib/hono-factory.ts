import { createFactory } from "hono/factory";

import type { CanAccelerateVariables } from "@/middleware/can-accelerate.middleware";
import type { EnsIndexerPublicConfigVariables } from "@/middleware/ensindexer-public-config.middleware";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";

export const factory = createFactory<{
  Variables: EnsIndexerPublicConfigVariables & IndexingStatusVariables & CanAccelerateVariables;
}>();
