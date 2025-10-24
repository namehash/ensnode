import { indexingStatusToSubgraphMeta } from "@/lib/subgraph/indexing-status-to-subgraph-meta";
import { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import type { SubgraphMetaVariables } from "@ensnode/ponder-subgraph";
import { createMiddleware } from "hono/factory";

export const subgraphMetaMiddleware = createMiddleware<{
  Variables: IndexingStatusVariables & SubgraphMetaVariables;
}>(async (c, next) => {
  c.set("_meta", indexingStatusToSubgraphMeta(c.var.indexingStatus));
  await next();
});
