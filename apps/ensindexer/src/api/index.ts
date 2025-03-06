import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { ponderMetadata } from "@ensnode/ponder-metadata";
import { graphql as subgraphGraphQL } from "@ensnode/ponder-subgraph/middleware";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql as ponderGraphQL } from "ponder";
import packageJson from "../../package.json";
import {
  ensNodePublicUrl,
  fetchFirstBlockToIndexByChainId,
  fetchPrometheusMetrics,
  getEnsDeploymentChain,
  ponderDatabaseSchema,
  ponderPort,
  requestedPluginNames,
} from "../lib/ponder-helpers";

const app = new Hono();

// use CORS middleware
app.use(
  cors({
    origin: "*",
  }),
);

app.onError((err, ctx) => {
  // log the error for operators
  console.error(err);

  return ctx.text("Internal server error", 500);
});

// use root to redirect to the ENSAdmin website with the current server URL as ensnode parameter
app.use("/", async (ctx) =>
  ctx.redirect(`https://admin.ensnode.io/about?ensnode=${ensNodePublicUrl()}`),
);

// use ENSNode middleware at /metadata
app.get(
  "/metadata",
  ponderMetadata({
    app: {
      name: packageJson.name,
      version: packageJson.version,
    },
    env: {
      ACTIVE_PLUGINS: requestedPluginNames().join(","),
      DATABASE_SCHEMA: ponderDatabaseSchema(),
      ENS_DEPLOYMENT_CHAIN: getEnsDeploymentChain(),
    },
    db,
    query: {
      // setup block indexing status fetching
      firstBlockToIndexByChainId: fetchFirstBlockToIndexByChainId,
      // setup prometheus metrics fetching
      prometheusMetrics: () => fetchPrometheusMetrics(ponderPort()),
    },
    publicClients,
  }),
);

// use ponder client support
app.use("/sql/*", client({ db, schema }));

// use ponder middleware at `/ponder`
app.use("/ponder", ponderGraphQL({ db, schema }));

// use our custom graphql middleware at /subgraph
app.use(
  "/subgraph",
  subgraphGraphQL({
    db,
    schema,

    // describes the polymorphic (interface) relationships in the schema
    polymorphicConfig: {
      types: {
        DomainEvent: [
          schema.transfer,
          schema.newOwner,
          schema.newResolver,
          schema.newTTL,
          schema.wrappedTransfer,
          schema.nameWrapped,
          schema.nameUnwrapped,
          schema.fusesSet,
          schema.expiryExtended,
        ],
        RegistrationEvent: [schema.nameRegistered, schema.nameRenewed, schema.nameTransferred],
        ResolverEvent: [
          schema.addrChanged,
          schema.multicoinAddrChanged,
          schema.nameChanged,
          schema.abiChanged,
          schema.pubkeyChanged,
          schema.textChanged,
          schema.contenthashChanged,
          schema.interfaceChanged,
          schema.authorisationChanged,
          schema.versionChanged,
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

export default app;
