import { type AccountId, makeENSv1RegistryId, makeENSv2RegistryId, type RegistryId } from "enssdk";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";
import {
  accountIdEqual,
  getDatasourceContract,
  maybeGetDatasourceContract,
} from "@ensnode/ensnode-sdk";

//////////////
// ENSv1
//////////////

/**
 * Gets the AccountId representing the ENSv1 Registry in the selected `namespace`.
 */
export const getENSv1Registry = (namespace: ENSNamespaceId) =>
  getDatasourceContract(namespace, DatasourceNames.ENSRoot, "ENSv1Registry");

/**
 * Gets the ENSv1RegistryId representing the ENSv1 Root Registry in the selected `namespace`.
 */
export const getENSv1RootRegistryId = (namespace: ENSNamespaceId) =>
  makeENSv1RegistryId(getENSv1Registry(namespace));

/**
 * Gets the AccountId representing the ENSv1 Registry in the selected `namespace` if defined,
 * otherwise `undefined`.
 */
export const maybeGetENSv1Registry = (namespace: ENSNamespaceId) =>
  maybeGetDatasourceContract(namespace, DatasourceNames.ENSRoot, "ENSv1Registry");

/**
 * Gets the ENSv1RegistryId representing the ENSv1 Root Registry in the selected `namespace` if
 * defined, otherwise `undefined`.
 */
export const maybeGetENSv1RootRegistryId = (namespace: ENSNamespaceId) => {
  const root = maybeGetENSv1Registry(namespace);
  if (!root) return undefined;
  return makeENSv1RegistryId(root);
};

/**
 * Determines whether `contract` is the ENSv1 Registry in `namespace`.
 */
export const isENSv1Registry = (namespace: ENSNamespaceId, contract: AccountId) =>
  accountIdEqual(getENSv1Registry(namespace), contract);

//////////////
// ENSv2
//////////////

/**
 * Gets the AccountId representing the ENSv2 Root Registry in the selected `namespace`.
 *
 * @throws if the ENSv2Root Datasource or the RootRegistry contract are not defined
 */
export const getENSv2RootRegistry = (namespace: ENSNamespaceId) =>
  getDatasourceContract(namespace, DatasourceNames.ENSv2Root, "RootRegistry");

/**
 * Gets the RegistryId representing the ENSv2 Root Registry in the selected `namespace`.
 *
 * @throws if the ENSv2Root Datasource or the RootRegistry contract are not defined
 */
export const getENSv2RootRegistryId = (namespace: ENSNamespaceId) =>
  makeENSv2RegistryId(getENSv2RootRegistry(namespace));

/**
 * Determines whether `contract` is the ENSv2 Root Registry in `namespace`.
 *
 * @throws if the ENSv2Root Datasource or the RootRegistry contract are not defined
 */
export const isENSv2RootRegistry = (namespace: ENSNamespaceId, contract: AccountId) =>
  accountIdEqual(getENSv2RootRegistry(namespace), contract);

/**
 * Gets the AccountId representing the ENSv2 Root Registry in the selected `namespace` if defined,
 * otherwise `undefined`.
 *
 * TODO: remove this function and its usage after all namespaces define ENSv2Root
 */
export const maybeGetENSv2RootRegistry = (namespace: ENSNamespaceId) =>
  maybeGetDatasourceContract(namespace, DatasourceNames.ENSv2Root, "RootRegistry");

/**
 * Gets the RegistryId representing the ENSv2 Root Registry in the selected `namespace` if defined,
 * otherwise `undefined`.
 *
 * TODO: remove this function and its usage after all namespaces define ENSv2Root
 */
export const maybeGetENSv2RootRegistryId = (namespace: ENSNamespaceId) => {
  const root = maybeGetENSv2RootRegistry(namespace);
  if (!root) return undefined;
  return makeENSv2RegistryId(root);
};

//////////////
// Root
//////////////

/**
 * Gets the RegistryId representing the primary Root Registry for the selected `namespace`: the
 * ENSv2 Root Registry when defined, otherwise the ENSv1 Root Registry. Matches ENS Forward
 * Resolution preference (v2 over v1) for display/resolution purposes.
 *
 * Not to be confused with the canonical-registries tree in the API layer, which is a union of
 * both ENSv1 and ENSv2 subtrees because ENSv1 Domains remain resolvable via Universal Resolver
 * v2's ENSv1 fallback.
 */
export const getRootRegistryId = (namespace: ENSNamespaceId) =>
  maybeGetENSv2RootRegistryId(namespace) ?? getENSv1RootRegistryId(namespace);

/**
 * Gets every top-level Root Registry configured for the namespace: all concrete ENSv1Registries
 * (ENSRoot, Basenames, Lineanames) plus the ENSv2 Root Registry when defined. Used by consumers
 * that need to walk the full set of canonical namegraph roots (forward traversal, canonical-set
 * construction) rather than the single "primary" root returned by {@link getRootRegistryId}.
 *
 * Each concrete ENSv1Registry roots its own on-chain subtree (the mainnet ENSv1Registry,
 * Basenames/Lineanames shadow Registries on their own chains) — they are not linked together at
 * the indexed-namegraph level, so a traversal that starts from a single root cannot reach them all.
 *
 * TODO(ensv2-shadow): when CCIP-read ENSv2 shadow Registries are introduced, extend this helper to
 * enumerate them. ENSv1 top-level registries are structurally identifiable (any `registry.type =
 * "ENSv1Registry"` row is top-level); ENSv2 is not, so we rely on datasource configuration here.
 */
export const getRootRegistryIds = (namespace: ENSNamespaceId): RegistryId[] => {
  const v1Registries = [
    getENSv1Registry(namespace),
    maybeGetDatasourceContract(namespace, DatasourceNames.Basenames, "Registry"),
    maybeGetDatasourceContract(namespace, DatasourceNames.Lineanames, "Registry"),
  ]
    .filter((c): c is AccountId => c !== undefined)
    .map(makeENSv1RegistryId);

  const v2Root = maybeGetENSv2RootRegistryId(namespace);
  return v2Root ? [...v1Registries, v2Root] : v1Registries;
};
