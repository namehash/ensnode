import { type AccountId, makeRegistryId } from "enssdk";

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
  makeRegistryId(getENSv2RootRegistry(namespace));

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
  return makeRegistryId(root);
};
