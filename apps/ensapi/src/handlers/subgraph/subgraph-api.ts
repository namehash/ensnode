import type { Duration } from "enssdk";
import { createDocumentationMiddleware } from "ponder-enrich-gql-docs-middleware";

import {
  hasSubgraphApiConfigSupport,
  hasSubgraphApiIndexingStatusSupport,
} from "@ensnode/ensnode-sdk";

import di from "@/di";
import { createApp } from "@/lib/hono-factory";
import { makeSubgraphApiDocumentation } from "@/lib/subgraph/api-documentation";
import { fixContentLengthMiddleware } from "@/middleware/fix-content-length.middleware";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";
import { subgraphMetaMiddleware } from "@/middleware/subgraph-meta.middleware";
import { thegraphFallbackMiddleware } from "@/middleware/thegraph-fallback.middleware";

const MAX_REALTIME_DISTANCE_TO_RESOLVE: Duration = 10 * 60; // 10 minutes in seconds

const app = createApp({ middlewares: [indexingStatusMiddleware] });

app.use(async (c, next) => {
  const configPrerequisite = hasSubgraphApiConfigSupport(di.context.stackInfo.ensIndexer);
  // 503 if Subgraph API is not available due to config prerequisites not met
  if (!configPrerequisite.supported) {
    return c.text(`Service Unavailable: ${configPrerequisite.reason}`, 503);
  }

  // 503 if indexing status snapshot is not available yet
  if (c.var.indexingStatus instanceof Error) {
    return c.text(`Service Unavailable: Indexing Status Snapshot is not available yet`, 503);
  }

  // 503 if Subgraph API is not available due to indexing status prerequisites not met
  const indexingStatusPrerequisite = hasSubgraphApiIndexingStatusSupport(
    c.var.indexingStatus.snapshot.omnichainSnapshot.omnichainStatus,
  );

  if (!indexingStatusPrerequisite.supported) {
    return c.text(`Service Unavailable: ${indexingStatusPrerequisite.reason}`, 503);
  }

  await next();
});

// inject c.var.isRealtime derived from MAX_REALTIME_DISTANCE_TO_RESOLVE
app.use(makeIsRealtimeMiddleware("subgraph-api", MAX_REALTIME_DISTANCE_TO_RESOLVE));

// fallback to The Graph based on c.var.isRealtime
app.use(thegraphFallbackMiddleware);

// hotfix content length after documentation injection
app.use(fixContentLengthMiddleware);

// inject api documentation into graphql introspection requests
app.use(createDocumentationMiddleware(makeSubgraphApiDocumentation(), { path: "/subgraph" }));

// inject _meta into the hono (and yoga) context for the subgraph middleware
app.use(subgraphMetaMiddleware);

app.use(di.context.subgraphApiGqlMiddleware);

export default app;
