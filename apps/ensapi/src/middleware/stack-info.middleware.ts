import type { EnsNodeStackInfo } from "@ensnode/ensnode-sdk";

import { stackInfoCache } from "@/cache/stack-info.cache";
import { factory, producing } from "@/lib/hono-factory";
import logger from "@/lib/logger";

export interface StackInfoMiddlewareVariables {
  /**
   * ENSNode Stack Info
   */
  stackInfo: EnsNodeStackInfo;
}

/**
 * Makes the ENSNode Stack Info available in the middleware context as `c.var.stackInfo`.
 *
 * If the stack info cannot be retrieved, for example, if ENSDb instance does not respond,
 * we return a 503 Service Unavailable and an error message.
 */
export const stackInfoMiddleware = producing(
  ["stackInfo"],
  factory.createMiddleware(async (c, next) => {
    const stackInfo = await stackInfoCache.read();

    if (stackInfo instanceof Error) {
      logger.error({ stackInfo }, "Failed to retrieve ENSNode Stack Info");

      return c.json({ error: "Service Unavailable" }, 503);
    }

    c.set("stackInfo", stackInfo);

    await next();
  }),
);
