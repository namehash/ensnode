import { createFactory } from "hono/factory";

import type { EnsRainbowServerMiddlewareVariables } from "@/lib/middleware/ensrainbow-server.middleware";

type MiddlewareVariables = EnsRainbowServerMiddlewareVariables;

export const factory = createFactory<{
  Variables: Partial<MiddlewareVariables>;
}>();
