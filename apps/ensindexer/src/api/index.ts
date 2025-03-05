import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { ponderMetadata } from "@ensnode/ponder-metadata/middleware";
import { graphql as subgraphGraphQL } from "@ensnode/ponder-subgraph/middleware";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql as ponderGraphQL } from "ponder";
import packageJson from "../../package.json";
import { getIndexingStartBlockNumbersByChainId } from "../lib/plugin-helpers";
import {
  ensNodePublicUrl,
  getEnsDeploymentChain,
  ponderDatabaseSchema,
  requestedPluginNames,
} from "../lib/ponder-helpers";

const app = new Hono();

// use CORS middleware
app.use(
  cors({
    origin: "*",
  }),
);

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
    fetchIndexingStartBlockNumbersByChainId: async (chainId: number) => {
      const startBlocksByChainId = await getIndexingStartBlockNumbersByChainId();
      const startBlockHeight = startBlocksByChainId[`${chainId}`] ?? null;

      if (!startBlockHeight) {
        return null;
      }

      if (publicClients[chainId] && startBlockHeight) {
        const block = await publicClients[chainId].getBlock({
          blockNumber: BigInt(startBlockHeight),
        });

        return {
          number: Number(block.number),
          timestamp: Number(block.timestamp),
        };
      }

      return {
        number: startBlockHeight,
        timestamp: null,
      };
    },
    fetchPrometheusMetrics: () =>
      fetch(`http://localhost:${process.env.PORT}/metrics`).then((res) => res.text()),
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
