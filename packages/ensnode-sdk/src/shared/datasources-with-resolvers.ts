import {
  type ContractConfig,
  type Datasource,
  type DatasourceName,
  DatasourceNames,
  type ENSNamespaceId,
  maybeGetDatasource,
} from "@ensnode/datasources";

import { DATASOURCE_NAMES_WITH_ENSv2_CONTRACTS } from "./datasources-with-ensv2-contracts";

// avoids 'The inferred type of this node exceeds the maximum length the compiler will serialize'
type DatasourceWithResolverContract = Datasource & { contracts: { Resolver: ContractConfig } };

export const DATASOURCE_NAMES_WITH_RESOLVERS = [
  DatasourceNames.ENSRoot,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
  DatasourceNames.ThreeDNSOptimism,
  DatasourceNames.ThreeDNSBase,

  // all datasources that define ENSv2 contracts also define Resolver
  ...DATASOURCE_NAMES_WITH_ENSv2_CONTRACTS,
] as const satisfies DatasourceName[];

/**
 * The set of DatasourceNames that describe Resolver contracts that are indexed by the
 * Protocol Acceleration plugin.
 */
export const getDatasourcesWithResolvers = (
  namespace: ENSNamespaceId,
): DatasourceWithResolverContract[] =>
  DATASOURCE_NAMES_WITH_RESOLVERS.map((datasourceName) =>
    maybeGetDatasource(namespace, datasourceName),
  )
    .filter((datasource) => !!datasource)
    .map((datasource) => {
      // all of the relevant datasources provide a Resolver ContractConfig with a `startBlock`
      if (!datasource.contracts.Resolver) {
        throw new Error(
          `Invariant: Datasource does not define a 'Resolver' contract. Defined contracts: ${JSON.stringify(Object.keys(datasource.contracts))}`,
        );
      }

      return datasource;
    });
