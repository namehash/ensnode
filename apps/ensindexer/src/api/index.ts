import packageJson from "@/../package.json";

import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { sdk } from "@/api/lib/tracing/instrumentation";
import config from "@/config";
import { makeApiDocumentationMiddleware } from "@/lib/api-documentation";
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
import { subgraphGraphQLAPIMiddleware } from "@ensnode/ponder-subgraph";

import ensNodeApi from "@/api/handlers/ensnode-api";

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

// use our custom graphql middleware at /subgraph with description injection
const subgraphSchema = filterSchemaByPrefix("subgraph_", schema);
app.use("/subgraph", fixContentLengthMiddleware);
app.use("/subgraph", makeApiDocumentationMiddleware("/subgraph"));
app.use(
  "/subgraph",
  subgraphGraphQLAPIMiddleware({
    schema: subgraphSchema,
    // provide the schema with ponder's internal metadata to power _meta
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
);

// start ENSNode API OpenTelemetry SDK
sdk.start();

// gracefully shut down the SDK on process interrupt/exit
const shutdownOpenTelemetry = () =>
  sdk.shutdown().catch((error) => console.error("Error terminating tracing", error));
process.on("SIGINT", shutdownOpenTelemetry);
process.on("SIGTERM", shutdownOpenTelemetry);

export default app;
