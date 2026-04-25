import { createMiddleware } from "hono/factory";

import type { SubgraphMetaVariables } from "@ensnode/ponder-subgraph";

import { indexingContextToSubgraphMeta } from "@/lib/subgraph/indexing-status-to-subgraph-meta";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { StackInfoMiddlewareVariables } from "@/middleware/stack-info.middleware";

/**
 * Middleware that converts indexing status to subgraph metadata format.
 *
 * Transforms the ENSIndexer indexing status into the GraphQL subgraph `_meta`
 * format expected by the legacy subgraph API. Sets the `_meta` variable on
 * the context for use by subgraph handlers.
 */
export const subgraphMetaMiddleware = createMiddleware<{
  Variables: IndexingStatusMiddlewareVariables &
    StackInfoMiddlewareVariables &
    SubgraphMetaVariables;
}>(async (c, next) => {
  // context must be set by the required middleware
  if (c.var.indexingStatus === undefined) {
    throw new Error(`Invariant(subgraphMetaMiddleware): indexingStatusMiddleware required`);
  }

  if (!c.var.stackInfo || c.var.stackInfo instanceof Error) {
    throw new Error();
  }

  const { ensIndexer: ensIndexerPublicConfig } = c.var.stackInfo;

  c.set("_meta", indexingContextToSubgraphMeta(c.var.indexingStatus, ensIndexerPublicConfig));
  await next();
});
