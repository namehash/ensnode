import config from "@/config";

import { createDocumentationMiddleware } from "ponder-enrich-gql-docs-middleware";

import * as schema from "@ensnode/ensnode-schema";
import { buildGraphQLSchema, subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import { makeDrizzle } from "@/lib/handlers/drizzle";
import { factory } from "@/lib/hono-factory";
import { makeSubgraphApiDocumentation } from "@/lib/subgraph/api-documentation";
import { filterSchemaByPrefix } from "@/lib/subgraph/filter-schema-by-prefix";
import { fixContentLengthMiddleware } from "@/middleware/fix-content-length.middleware";
import { requireCorePluginMiddleware } from "@/middleware/require-core-plugin.middleware";
import { subgraphMetaMiddleware } from "@/middleware/subgraph-meta.middleware";

// generate a subgraph-specific subset of the schema
const subgraphSchema = filterSchemaByPrefix("subgraph_", schema);

// make subgraph-specific drizzle db
const drizzle = makeDrizzle({
  schema: subgraphSchema,
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchemaName,
});

const app = factory.createApp();

// 404 if subgraph core plugin not enabled
app.use(requireCorePluginMiddleware("subgraph"));

// hotfix content length after documentation injection
app.use(fixContentLengthMiddleware);

// inject api documentation into graphql introspection requests
app.use(createDocumentationMiddleware(makeSubgraphApiDocumentation(), { path: "/subgraph" }));

// inject _meta into the hono (and yoga) context for the subgraph middleware
app.use(subgraphMetaMiddleware);

// use subgraph middleware
app.use(
  subgraphGraphQLMiddleware({
    drizzle,
    graphqlSchema: buildGraphQLSchema({
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
  }),
);

export default app;
