import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";
import {
  type AccountId,
  accountIdEqual,
  getDatasourceContract,
  makeRegistryId,
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
 */
export const getENSv2RootRegistry = (namespace: ENSNamespaceId) =>
  getDatasourceContract(namespace, DatasourceNames.ENSRoot, "RootRegistry");

/**
 * Gets the RegistryId representing the ENSv2 Root Registry in the selected `namespace`.
 */
export const getENSv2RootRegistryId = (namespace: ENSNamespaceId) =>
  makeRegistryId(getENSv2RootRegistry(namespace));

/**
 * Determines whether `contract` is the ENSv2 Root Registry in `namespace`.
 */
export const isENSv2RootRegistry = (namespace: ENSNamespaceId, contract: AccountId) =>
  accountIdEqual(getENSv2RootRegistry(namespace), contract);
