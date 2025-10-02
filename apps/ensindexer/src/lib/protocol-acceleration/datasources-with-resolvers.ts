import { DatasourceName, DatasourceNames } from "@ensnode/datasources";

/**
 * The set of DatasourceNames that describe Resolver contracts that should be indexed by the
 * Protocol Acceleration plugin.
 */
export const DATASOURCES_WITH_RESOLVERS = [
  DatasourceNames.ENSRoot,
  DatasourceNames.Basenames,
  DatasourceNames.Lineanames,
  DatasourceNames.ThreeDNSOptimism,
  DatasourceNames.ThreeDNSBase,
] as const satisfies DatasourceName[];
