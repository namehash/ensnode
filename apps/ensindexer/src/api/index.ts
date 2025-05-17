import packageJson from "@/../package.json";

import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { Context, Hono, MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { client, graphql as ponderGraphQL } from "ponder";

import { makeApiDocumentationMiddleware } from "@/lib/api-documentation";
import { fixContentLengthMiddleware } from "@/lib/fix-content-length-middleware";
import {
  ensAdminUrl,
  ensNodePublicUrl,
  getEnsDeploymentChain,
  getRequestedPluginNames,
  ponderDatabaseSchema,
} from "@/lib/ponder-helpers";
import {
  fetchEnsRainbowVersion,
  fetchFirstBlockToIndexByChainId,
  fetchPrometheusMetrics,
  makePonderMetdataProvider,
} from "@/lib/ponder-metadata-provider";
import { ponderMetadata } from "@ensnode/ponder-metadata";
import {
  buildGraphQLSchema as buildSubgraphGraphQLSchema,
  graphql as subgraphGraphQL,
} from "@ensnode/ponder-subgraph";
import {
  addDocStringsToIntrospection,
  extendWithBaseDefinitions,
  generateTypeDocSet,
} from "ponder-enrich-gql-docs-middleware";

const app = new Hono();

const ensNodeVersionResponseHeader: MiddlewareHandler = async (ctx, next) => {
  ctx.header("x-ensnode-version", packageJson.version);
  return next();
};

app.use(
  // set the X-ENSNode-Version header to the current version
  ensNodeVersionResponseHeader,

  // use CORS middleware
  cors({ origin: "*" }),
);

app.onError((error, ctx) => {
  // log the error for operators
  console.error(error);

  return ctx.text("Internal server error", 500);
});

// use root to redirect to the environment's ENSAdmin URL configured to connect back to the environment's ENSNode Public URL
app.use("/", async (ctx) => {
  try {
    const ensAdminRedirectUrl = new URL(ensAdminUrl());
    ensAdminRedirectUrl.searchParams.set("ensnode", ensNodePublicUrl());

    return ctx.redirect(ensAdminRedirectUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(`Cannot redirect to ENSAdmin: ${errorMessage}`);
  }
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
      ACTIVE_PLUGINS: getRequestedPluginNames().join(","),
      DATABASE_SCHEMA: ponderDatabaseSchema(),
      ENS_DEPLOYMENT_CHAIN: getEnsDeploymentChain(),
    },
    db,
    query: {
      firstBlockToIndexByChainId: fetchFirstBlockToIndexByChainId,
      prometheusMetrics: fetchPrometheusMetrics,
      ensRainbowVersion: fetchEnsRainbowVersion,
    },
    publicClients,
  }),
);

// use ponder client support
app.use("/sql/*", client({ db, schema }));

// use ponder middleware at `/ponder` with description injection
app.use("/ponder", fixContentLengthMiddleware);
app.use("/ponder", makeApiDocumentationMiddleware("/ponder"));
app.use("/ponder", ponderGraphQL({ db, schema }));

// use our custom graphql middleware at /subgraph with description injection
app.use("/subgraph", fixContentLengthMiddleware);
app.use("/subgraph", makeApiDocumentationMiddleware("/subgraph"));
app.use(
  "/subgraph",
  subgraphGraphQL({
    db,
    graphqlSchema: buildSubgraphGraphQLSchema({
      schema,
      // provide the schema with ponder's internal metadata to power _meta
      metadataProvider: makePonderMetdataProvider({ db, publicClients }),
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
  }),
);

export default app;
