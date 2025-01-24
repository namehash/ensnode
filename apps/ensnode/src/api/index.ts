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
          "transfer",
          "newOwner",
          "newResolver",
          "newTTL",
          "wrappedTransfer",
          "nameWrapped",
          "nameUnwrapped",
          "fusesSet",
          "expiryExtended",
        ],
        RegistrationEvent: ["nameRegistered", "nameRenewed", "nameTransferred"],
        ResolverEvent: [
          "addrChanged",
          "multicoinAddrChanged",
          "nameChanged",
          "abiChanged",
          "pubkeyChanged",
          "textChanged",
          "contenthashChanged",
          "interfaceChanged",
          "authorisationChanged",
          "versionChanged",
        ],
      },
      fields: {
        "domain.events": "DomainEvent",
        "registration.events": "RegistrationEvent",
        "resolver.events": "ResolverEvent",
      },
    },
  }),
);
