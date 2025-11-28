import { QueryClient } from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("query-cache.middleware");

export interface QueryCacheMiddlewareVariables {
  queryClient: QueryClient;
}

let queryClient: QueryClient | undefined;

export const queryCacheMiddleware = factory.createMiddleware(async (c, next) => {
  if (typeof queryClient === "undefined") {
    logger.info("Initializing queryClient");
    queryClient = new QueryClient();
  }

  c.set("queryClient", queryClient);

  await next();
});
