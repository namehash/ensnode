import { ponder } from "ponder:registry";
import { default as schema } from "ponder:schema";
import { graphql as ponderGraphQL } from "ponder";
import { graphql as subgraphGraphQL } from "ponder-subgraph-api/middleware";

// use ponder middleware at root
ponder.use("/", ponderGraphQL());

// use our custom graphql middleware at /subgraph
ponder.use(
  "/subgraph",
  subgraphGraphQL({
    schema,

    // describes the polymorphic (interface) relationships in the schema
    // TODO: pass table objects instead to avoid magic strings
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
