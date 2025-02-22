import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { graphql as subgraphGraphQL } from "@ensnode/ponder-subgraph/middleware";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { client, graphql as ponderGraphQL } from "ponder";
import { ensNodeMetadata } from "../lib/middleware";

const app = new Hono();

// use CORS middleware
app.use(
  cors({
    origin: "*",
  }),
);

// use root to redirect to the ENSAdmin website with the current server URL as ensnode parameter
app.use("/", async (ctx) =>
  ctx.redirect(`https://admin.ensnode.io/about?ensnode=${process.env.SERVER_URL}`),
);

// use ENSNode middleware at /metadata
app.get(
  "/metadata",
  ensNodeMetadata({
    db,
    publicClients,
  }),
);

// use ponder client support
app.use("/sql/*", client({ db, schema }));

// use ponder middleware at root
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
