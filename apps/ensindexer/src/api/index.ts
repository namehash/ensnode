import packageJson from "@/../package.json";

import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import {
  createEnsRainbowVersionFetcher,
  createFirstBlockToIndexByChainIdFetcher,
  createPrometheusMetricsFetcher,
  ensAdminUrl,
  ensNodePublicUrl,
  getEnsDeploymentChain,
  getEnsDeploymentChainId,
  ponderDatabaseSchema,
  ponderPort,
  requestedPluginNames,
} from "@/lib/ponder-helpers";
import {
  PrometheusMetrics,
  ponderMetadata,
  queryPonderMeta,
  queryPonderStatus,
} from "@ensnode/ponder-metadata";
import {
  type Block,
  buildGraphQLSchema,
  graphql as subgraphGraphQL,
} from "@ensnode/ponder-subgraph";
import { Hono, MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { client, graphql as ponderGraphQL } from "ponder";
import type { PublicClient } from "viem";

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

// setup block indexing status fetching
const fetchFirstBlockToIndexByChainId = createFirstBlockToIndexByChainIdFetcher(
  import("../../ponder.config").then((m) => m.default),
);

// setup prometheus metrics fetching
const fetchPrometheusMetrics = createPrometheusMetricsFetcher(ponderPort());

// setup ENSRainbow version fetching
const fetchEnsRainbowVersion = createEnsRainbowVersionFetcher();

// setup the data provider for the ponder subgraph middleware
const createPonderSubgraphDataProvider = () => {
  // get the chain ID for the ENS deployment
  const ensDeploymentChainId = getEnsDeploymentChainId();

  /**
   * Get the public client for the ENS deployment chain
   * @returns the public client for the ENS deployment chain
   * @throws an error if the public client is not found
   */
  function getEnsDeploymentPublicClient(): PublicClient {
    // get the public client for the ENS deployment chain
    const publicClient = publicClients[ensDeploymentChainId];

    if (!publicClient) {
      throw new Error(`Could not find public client for chain ID: ${ensDeploymentChainId}`);
    }

    return publicClient;
  }

  /**
   * Get the last block indexed by Ponder.
   *
   * @returns the block info fetched from the public client
   */
  const getLastIndexedBlock = async (): Promise<Block> => {
    const ponderStatus = await queryPonderStatus(ponderDatabaseSchema(), db);
    const chainStatus = ponderStatus.find(
      (status) => status.network_name === ensDeploymentChainId.toString(),
    );

    if (!chainStatus || !chainStatus.block_number) {
      throw new Error(
        `Could not find latest indexed block number for chain ID: ${ensDeploymentChainId}`,
      );
    }

    return getEnsDeploymentPublicClient().getBlock({
      blockNumber: BigInt(chainStatus.block_number),
    });
  };

  /**
   * Get the Ponder build ID
   * @returns The Ponder build ID
   */
  const getPonderBuildId = async (): Promise<string> => {
    const meta = await queryPonderMeta(ponderDatabaseSchema(), db);

    return meta.build_id;
  };

  /**
   * Check if there are any indexing errors logged in the prometheus metrics
   * @returns true if there are no indexing errors, false otherwise
   */
  const hasIndexingErrors = async () => {
    const metrics = PrometheusMetrics.parse(await fetchPrometheusMetrics());
    return metrics.getValue("ponder_indexing_has_error") === 1;
  };

  return { getLastIndexedBlock, getPonderBuildId, hasIndexingErrors };
};

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
      firstBlockToIndexByChainId: fetchFirstBlockToIndexByChainId,
      prometheusMetrics: fetchPrometheusMetrics,
      ensRainbowVersion: fetchEnsRainbowVersion,
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
    graphqlSchema: buildGraphQLSchema({
      schema,
      metaConfig: {
        version: packageJson.version,
        schema: ponderDatabaseSchema(),
      },
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
      dataProvider: createPonderSubgraphDataProvider(),
    }),
  }),
);

export default app;
