import {
  type ContractConfig,
  type Datasource,
  type DatasourceName,
  DatasourceNames,
  type ENSNamespaceId,
  maybeGetDatasource,
} from "@ensnode/datasources";

type DatasourceWithResolverContract = Datasource & {
  contracts: { Resolver: ContractConfig };
};

export const DATASOURCE_NAMES_WITH_RESOLVERS = [
  DatasourceNames.ENSRoot,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
  DatasourceNames.ThreeDNSOptimism,
  DatasourceNames.ThreeDNSBase,
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
    .filter((datasource): datasource is DatasourceWithResolverContract => {
      // all of the relevant datasources provide a Resolver ContractConfig with a `startBlock`
      if (!datasource.contracts.Resolver) {
        console.warn(
          `Warning(resolverContractConfig): Datasource does not define a 'Resolver' contract. ${JSON.stringify(datasource)}`,
        );
        return false;
      }

      return true;
    });
