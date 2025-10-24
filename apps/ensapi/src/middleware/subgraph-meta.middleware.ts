import { indexingStatusToSubgraphMeta } from "@/lib/subgraph/indexing-status-to-subgraph-meta";
import { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import type { SubgraphMetaVariables } from "@ensnode/ponder-subgraph";
import { createMiddleware } from "hono/factory";

/**
 * Middleware that converts indexing status to subgraph metadata format.
 *
 * Transforms the ENSIndexer indexing status into the GraphQL subgraph `_meta`
 * format expected by the legacy subgraph API. Sets the `_meta` variable on
 * the context for use by subgraph handlers.
 */
export const subgraphMetaMiddleware = createMiddleware<{
  Variables: IndexingStatusVariables & SubgraphMetaVariables;
}>(async (c, next) => {
  c.set("_meta", indexingStatusToSubgraphMeta(c.var.indexingStatus));
  await next();
});
