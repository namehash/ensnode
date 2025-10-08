import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { createDocumentationMiddleware } from "ponder-enrich-gql-docs-middleware";

import config from "@/config";
import { makeSubgraphApiDocumentation } from "@/lib/api-documentation";
import { filterSchemaByPrefix } from "@/lib/filter-schema-by-prefix";
import { fixContentLengthMiddleware } from "@/lib/fix-content-length-middleware";
import { makePonderMetadataProvider } from "@/lib/ponder-metadata-provider";
import { buildGraphQLSchema, subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import { makeDrizzle } from "@/api/lib/handlers/drizzle";

// generate a subgraph-specific subset of the schema
const subgraphSchema = filterSchemaByPrefix("subgraph_", schema);
// and a drizzle db object that accesses it
const subgaphDrizzle = makeDrizzle({
  schema: subgraphSchema,
  databaseUrl: config.databaseUrl,
  databaseSchema: config.databaseSchemaName,
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
      metadataProvider: makePonderMetadataProvider({ db, publicClients }),
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
