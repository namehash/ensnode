import { DatasourceNames, Datasources, ENSNamespace, ENSNamespaces } from "./lib/types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";

/**
 * CommonDatasourcesType is a helper type necessary to support runtime-conditional Ponder plugins.
 *
 * 1. ENSNode can be configured to index from any defined ENS namespace
 *   (currently: mainnet, sepolia, holesky, ens-test-env), using a user-specified set of plugins.
 * 2. Ponder's inferred type-checking requires const-typed values, and so those plugins must be able
 *   to define their Ponder config statically, without awareness of whether they are actively executed
 *   or not.
 * 3. To make this work, we provide a CommonDatasourcesType, set to the typeof mainnet's Datasources,
 *   which fully defines all known (if this is ever not the case, a merged type can be used to ensure
 *   that the CommonType has the full set of possible Datasources). Plugins can use the runtime value
 *   returned from {@link getCommonDatasources} and by casting it to CommonType we ensure that the
 *   values expected by those plugins pass the typechecker. ENSNode ensures that non-active plugins
 *   are not executed, however, so the issue of type/value mismatch does not occur during execution.
 */
type CommonDatasourcesType = typeof ENSNamespaceToDatasource.mainnet;

/**
 * A map from ENSNamespace to a set of Datasources.
 *
 * See {@link ENSNamespaces} for more information on ENS namespaces.
 */
const ENSNamespaceToDatasource = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const satisfies Record<ENSNamespace, Datasources>;

/**
 * Returns the (const) Datasources within the specified ENS namespace.
 *
 * @param namespace - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns The Datasources for the specified ENS namespace
 */
export const getDatasources = <T extends ENSNamespace>(
  namespace: T,
): (typeof ENSNamespaceToDatasource)[T] => ENSNamespaceToDatasource[namespace];

/**
 * Returns the Datasources within the specified ENS namespace, cast to the CommonType.
 *
 * This function takes an ENSNamespace identifier and returns the corresponding Datasources.
 * The returned datasources configuration is cast to the global CommonType to ensure that ponder's
 * inferred typing works at type-check time. See {@link CommonDatasourcesType} for more info.
 *
 * @param namespace - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns The Datasources for the specified ENS namespace
 */
export const getCommonDatasources = (namespace: ENSNamespace) =>
  getDatasources(namespace) as CommonDatasourcesType;

/**
/**
 * Returns the `datasourceName` Datasource within the specified `namespace` ENS namespace.
 *
 * NOTE: the typescript typechecker _will_ enforce validity. i.e. using an invalid `datasourceName`
 * wihtin the specified `namespace` will be a type error.
 *
 * @param namespace - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to retrieve
 * @returns The Datasource object for the given name within the specified namespace
 */
export const getDatasource = <
  N extends ENSNamespace,
  D extends keyof ReturnType<typeof getDatasources<N>>,
>(
  namespace: N,
  datasourceName: D,
) => getDatasources(namespace)[datasourceName];

/**
 * Returns the `datasourceName` Datasource within the `namespace` ENS namespace, cast as CommonType.
 *
 * NOTE: the typescript typechecker will _not_ enforce validity. i.e. using an invalid `datasourceName`
 * wihtin the specified `namespace` will have a valid return type but be undefined at runtime.
 */
export const getCommonDatasource = <N extends ENSNamespace, D extends keyof CommonDatasourcesType>(
  namespace: N,
  datasourceName: D,
) => getCommonDatasources(namespace)[datasourceName];

/**
 * Returns the chain id for the ENS Root Datasource within the selected ENS namespace.
 *
 * @returns the chain ID that hosts the ENS Root
 */
export const getENSRootChainId = (namespace: ENSNamespace) =>
  getCommonDatasource(namespace, DatasourceNames.ENSRoot).chain.id;
