import config from "@/config";

import * as schema from "@ensnode/ensnode-schema";
import { Hono } from "hono";
import { createDocumentationMiddleware } from "ponder-enrich-gql-docs-middleware";

import { buildGraphQLSchema, subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import { makeDrizzle } from "@/lib/handlers/drizzle";
import { fixContentLengthMiddleware } from "@/lib/handlers/fix-content-length-middleware";
import { makeSubgraphApiDocumentation } from "@/lib/subgraph/api-documentation";
import { filterSchemaByPrefix } from "@/lib/subgraph/filter-schema-by-prefix";

// generate a subgraph-specific subset of the schema
const subgraphSchema = filterSchemaByPrefix("subgraph_", schema);
// and a drizzle db object that accesses it
const subgaphDrizzle = makeDrizzle({
  schema: subgraphSchema,
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchema,
});

const app = new Hono();

// hotfix content length after documentation injection
app.use(fixContentLengthMiddleware);

// inject api documentation into graphql introspection requests
app.use(createDocumentationMiddleware(makeSubgraphApiDocumentation(), { path: "/subgraph" }));

// use our custom graphql middleware
app.use(
  subgraphGraphQLMiddleware({
    drizzle: subgaphDrizzle,
    graphqlSchema: buildGraphQLSchema({
      schema: subgraphSchema,
      // provide PonderMetadataProvider to power `_meta` field
      // TODO: derive from ENSIndexer IndexingStatus
      metadataProvider: {
        deployment: "whatever",
        getLastIndexedENSRootChainBlock: async () => ({
          hash: "0x1",
          number: 69n,
          parentHash: "0x0",
          timestamp: 1n,
        }),
        hasIndexingErrors: async () => false,
      },
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
