import {
  type ContractConfig,
  type Datasource,
  type DatasourceName,
  DatasourceNames,
  type ENSNamespaceId,
  maybeGetDatasource,
} from "@ensnode/datasources";

export const DATASOURCE_NAMES_WITH_ENSv2_CONTRACTS = [
  DatasourceNames.ENSv2Root,
  DatasourceNames.ENSv2ETHRegistry,
] as const satisfies DatasourceName[];

// avoids 'The inferred type of this node exceeds the maximum length the compiler will serialize'
type DatasourceWithENSv2Contracts = Datasource & {
  contracts: { Registry: ContractConfig; EnhancedAccessControl: ContractConfig };
};

/**
 * The set of DatasourceNames that describe ENSv2 contracts that are indexed by the
 * Protocol Acceleration plugin.
 */
export const getDatasourcesWithENSv2Contracts = (
  namespace: ENSNamespaceId,
): DatasourceWithENSv2Contracts[] =>
  DATASOURCE_NAMES_WITH_ENSv2_CONTRACTS.map((datasourceName) =>
    maybeGetDatasource(namespace, datasourceName),
  )
    .filter((datasource) => !!datasource)
    .map((datasource) => {
      // all of the relevant datasources provide a Registry and EnhancedAccessControl ContractConfig
      if (!datasource.contracts.Registry || !datasource.contracts.EnhancedAccessControl) {
        throw new Error(
          `Invariant: Datasource does not define a 'Registry' 'EnhancedAccessControl' contracts: ${JSON.stringify(datasource)}`,
        );
      }

      return datasource;
    });
