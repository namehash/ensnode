import config from "@/config";

import { createDocumentationMiddleware } from "ponder-enrich-gql-docs-middleware";

import { type Duration, hasSubgraphApiConfigSupport } from "@ensnode/ensnode-sdk";
import { subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import { ensIndexerSchema } from "@/lib/ensdb/singleton";
import { createApp } from "@/lib/hono-factory";
import { lazy } from "@/lib/lazy";
import { makeSubgraphApiDocumentation } from "@/lib/subgraph/api-documentation";
import { filterSchemaByPrefix } from "@/lib/subgraph/filter-schema-by-prefix";
import { fixContentLengthMiddleware } from "@/middleware/fix-content-length.middleware";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";
import { subgraphMetaMiddleware } from "@/middleware/subgraph-meta.middleware";
import { thegraphFallbackMiddleware } from "@/middleware/thegraph-fallback.middleware";

const MAX_REALTIME_DISTANCE_TO_RESOLVE: Duration = 10 * 60; // 10 minutes in seconds

// generate a subgraph-specific subset of the schema
const subgraphSchema = filterSchemaByPrefix("subgraph_", ensIndexerSchema);

const app = createApp();

// 503 if subgraph plugin not available
app.use(async (c, next) => {
  const prerequisite = hasSubgraphApiConfigSupport(config.ensIndexerPublicConfig);
  if (!prerequisite.supported) {
    return c.text(`Service Unavailable: ${prerequisite.reason}`, 503);
  }

  await next();
});

// inject c.var.indexingStatus
app.use(indexingStatusMiddleware);

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

// lazy() defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
const getSubgraphMiddleware = lazy(() =>
  subgraphGraphQLMiddleware({
    databaseUrl: config.databaseUrl,
    databaseSchema: config.ensIndexerSchemaName,
    schema: subgraphSchema,
    // describes the polymorphic (interface) relationships in the schema
    polymorphicConfig: {
      types: {
        DomainEvent: [
          subgraphSchema.transfer,
          subgraphSchema.newOwner,
          subgraphSchema.newResolver,
          subgraphSchema.newTTL,
          subgraphSchema.wrappedTransfer,
          subgraphSchema.nameWrapped,
          subgraphSchema.nameUnwrapped,
          subgraphSchema.fusesSet,
          subgraphSchema.expiryExtended,
        ],
        RegistrationEvent: [
          subgraphSchema.nameRegistered,
          subgraphSchema.nameRenewed,
          subgraphSchema.nameTransferred,
        ],
        ResolverEvent: [
          subgraphSchema.addrChanged,
          subgraphSchema.multicoinAddrChanged,
          subgraphSchema.nameChanged,
          subgraphSchema.abiChanged,
          subgraphSchema.pubkeyChanged,
          subgraphSchema.textChanged,
          subgraphSchema.contenthashChanged,
          subgraphSchema.interfaceChanged,
          subgraphSchema.authorisationChanged,
          subgraphSchema.versionChanged,
        ],
      },
      fields: {
        "Domain.events": "DomainEvent",
        "Registration.events": "RegistrationEvent",
        "Resolver.events": "ResolverEvent",
      },
    },
  }),
);
app.use((c, next) => getSubgraphMiddleware()(c, next));

export default app;
