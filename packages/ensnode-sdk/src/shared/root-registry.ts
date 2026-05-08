import { type AccountId, makeENSv1RegistryId, makeENSv2RegistryId, type RegistryId } from "enssdk";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";

import { accountIdEqual } from "./account-id";
import { getDatasourceContract, maybeGetDatasourceContract } from "./datasource-contract";

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
 * Gets the RegistryId representing the preferred Root Registry for the selected `namespace` —
 * the ENSv2 Root Registry when defined, otherwise the ENSv1 Root Registry. Used as the entry
 * point for resolution-time namegraph traversal. Note that both ENSv1 and ENSv2 Roots are
 * canonical by axiom in their respective namegraphs; use `isRootRegistryId` to test membership.
 */
export const getRootRegistryId = (namespace: ENSNamespaceId) =>
  maybeGetENSv2RootRegistryId(namespace) ?? getENSv1RootRegistryId(namespace);

/**
 * Determines whether `registryId` is a Root Registry (ENSv1 Root or, when defined, ENSv2 Root)
 * for the selected `namespace`. Root Registries are canonical by axiom: they have no parent
 * edge to derive canonicality from.
 */
export const isRootRegistryId = (namespace: ENSNamespaceId, registryId: RegistryId): boolean =>
  registryId === getENSv1RootRegistryId(namespace) ||
  registryId === maybeGetENSv2RootRegistryId(namespace);
