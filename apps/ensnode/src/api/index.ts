import { db } from "ponder:api";
import schema from "ponder:schema";
import { graphql as subgraphGraphQL } from "@ensnode/ponder-subgraph/middleware";
import { Hono } from "hono";
import { client, graphql as ponderGraphQL } from "ponder";

const app = new Hono();

// use ponder client support
app.use("/sql/*", client({ db, schema }));

// use ponder middleware at root
app.use("/", ponderGraphQL({ db, schema }));

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
