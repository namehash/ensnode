import packageJson from "@/../package.json";

import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDocumentationMiddleware } from "ponder-enrich-gql-docs-middleware";

import { sdk } from "@/api/lib/tracing/instrumentation";
import config from "@/config";
import { makeSubgraphApiDocumentation } from "@/lib/api-documentation";
import { filterSchemaByPrefix } from "@/lib/filter-schema-by-prefix";
import { fixContentLengthMiddleware } from "@/lib/fix-content-length-middleware";
import {
  fetchEnsRainbowVersion,
  fetchFirstBlockToIndexByChainId,
  fetchPonderStatus,
  fetchPrometheusMetrics,
  makePonderMetadataProvider,
} from "@/lib/ponder-metadata-provider";
import { ponderMetadata } from "@ensnode/ponder-metadata";
import { buildGraphQLSchema, subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import ensNodeApi from "@/api/handlers/ensnode-api";
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

// set the X-ENSNode-Version header to the current version
app.use(async (ctx, next) => {
  ctx.header("x-ensnode-version", packageJson.version);
  return next();
});

// use CORS middleware
app.use(cors({ origin: "*" }));

// log hono errors to console
app.onError((error, ctx) => {
  console.error(error);
  return ctx.text("Internal server error", 500);
});

// use root to redirect to the environment's ENSAdmin URL configured to connect back to the environment's ENSNode Public URL
app.use("/", async (ctx) => {
  const ensAdminRedirectUrl = new URL(config.ensAdminUrl);
  ensAdminRedirectUrl.searchParams.set("connection", config.ensNodePublicUrl.href);

  return ctx.redirect(ensAdminRedirectUrl);
});

// use ENSNode middleware at /metadata
app.get(
  "/metadata",
  ponderMetadata({
    app: {
      name: packageJson.name,
      version: packageJson.version,
    },
    env: {
      PLUGINS: config.plugins.join(","),
      DATABASE_SCHEMA: config.databaseSchemaName,
      NAMESPACE: config.namespace,
    },
    db,
    query: {
      firstBlockToIndexByChainId: fetchFirstBlockToIndexByChainId,
      prometheusMetrics: fetchPrometheusMetrics,
      ensRainbowVersion: fetchEnsRainbowVersion,
      ponderStatus: fetchPonderStatus,
    },
    publicClients,
  }),
);

// use ENSNode HTTP API at /api
app.route("/api", ensNodeApi);

// at /subgraph
app.use(
  "/subgraph",
  // hotfix content length after documentation injection
  fixContentLengthMiddleware,
  // inject api documentation into graphql introspection requests
  createDocumentationMiddleware(makeSubgraphApiDocumentation(), { path: "/subgraph" }),
  // use our custom graphql middleware
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

// start ENSNode API OpenTelemetry SDK
sdk.start();

// gracefully shut down the SDK on process interrupt/exit
const shutdownOpenTelemetry = () =>
  sdk.shutdown().catch((error) => console.error("Error terminating tracing", error));
process.on("SIGINT", shutdownOpenTelemetry);
process.on("SIGTERM", shutdownOpenTelemetry);

export default app;
