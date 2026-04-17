import type { EnsNodeStackInfo } from "@ensnode/ensnode-sdk";

import { stackInfoCache } from "@/cache/stack-info.cache";
import { factory, producing } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("stack-info.middleware");

export interface StackInfoMiddlewareVariables {
  /**
   * ENSNode Stack Info
   */
  stackInfo: EnsNodeStackInfo | Error;
}

/**
 * Makes the ENSNode Stack Info cached in {@link stackInfoCache} available
 * in the Hono context as `c.var.stackInfo`.
 *
 * If the ENSNode Stack Info cannot be retrieved, `c.var.stackInfo` will be set to
 * the `Error` encountered while attempting to retrieve the Stack Info, so that
 * downstream middlewares and handlers can handle the error appropriately.
 *
 * This middleware should be used in routes that require the ENSNode Stack Info,
 * such as the Indexing Status API route, to avoid redundant retrieval of
 * the Stack Info in multiple middlewares and handlers within the same request.
 */
export const stackInfoMiddleware = producing(
  ["stackInfo"],
  factory.createMiddleware(async (c, next) => {
    const stackInfo = await stackInfoCache.read();

    if (stackInfo instanceof Error) {
      logger.error(
        { error: stackInfo },
        "Failed to retrieve ENSNode Stack Info in stackInfoMiddleware",
      );
    }

    c.set("stackInfo", stackInfo);

    await next();
  }),
);
