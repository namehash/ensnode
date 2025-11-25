import { createMiddleware } from "hono/factory";

import type { SubgraphMetaVariables } from "@ensnode/ponder-subgraph";

import { indexingContextToSubgraphMeta } from "@/lib/subgraph/indexing-status-to-subgraph-meta";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";

/**
 * Middleware that converts indexing status to subgraph metadata format.
 *
 * Transforms the ENSIndexer indexing status into the GraphQL subgraph `_meta`
 * format expected by the legacy subgraph API. Sets the `_meta` variable on
 * the context for use by subgraph handlers.
 */
export const subgraphMetaMiddleware = createMiddleware<{
  Variables: IndexingStatusMiddlewareVariables & SubgraphMetaVariables;
}>(async (c, next) => {
  c.set("_meta", indexingContextToSubgraphMeta(c.var.indexingStatus));
  await next();
});
