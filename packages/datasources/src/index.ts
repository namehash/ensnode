import { DatasourceMap, DatasourceNames, ENSNamespace } from "./lib/types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";

// internal map ENSNamespace -> DatasourceMap
const ENSNamespaceToDatasourceMap = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const satisfies Record<ENSNamespace, DatasourceMap>;

/**
 * Returns the DatasourceMap within the specified namespace.
 *
 * @param namespace - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns The DatasourceMap for the specified namespace
 */
export const getDatasourceMap = <T extends ENSNamespace>(
  namespace: T,
): (typeof ENSNamespaceToDatasourceMap)[T] => ENSNamespaceToDatasourceMap[namespace];

/**
 * Returns the `datasourceName` Datasource within the specified `namespace` namespace.
 *
 * NOTE: the typescript typechecker _will_ enforce validity. i.e. using an invalid `datasourceName`
 * within the specified `namespace` will be a type error.
 *
 * @param namespace - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to retrieve
 * @returns The Datasource object for the given name within the specified namespace
 */
export const getDatasource = <
  N extends ENSNamespace,
  D extends keyof ReturnType<typeof getDatasourceMap<N>>,
>(
  namespace: N,
  datasourceName: D,
) => getDatasourceMap(namespace)[datasourceName];

/**
 * Returns the chain id for the ENS Root Datasource within the selected namespace.
 *
 * @returns the chain ID that hosts the ENS Root
 */
export const getENSRootChainId = (namespace: ENSNamespace) =>
  getDatasource(namespace, DatasourceNames.ENSRoot).chain.id;
