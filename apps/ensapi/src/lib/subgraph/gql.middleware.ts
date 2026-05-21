import { subgraphGraphQLMiddleware } from "@ensnode/ponder-subgraph";

import di from "@/di";
import { filterSchemaByPrefix } from "@/lib/subgraph/filter-schema-by-prefix";

// generate a subgraph-specific subset of the schema
const subgraphSchema = filterSchemaByPrefix("subgraph_", di.context.ensIndexerSchema);

export default subgraphGraphQLMiddleware({
  databaseUrl: di.context.ensDbConfig.ensDbUrl,
  databaseSchema: di.context.ensDbConfig.ensIndexerSchemaName,
  schema: subgraphSchema,
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
});
