import {
  type AccountId,
  makeENSv1RegistryId,
  makeENSv1VirtualRegistryId,
  makeENSv2RegistryId,
  type RegistryId,
} from "enssdk";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";

import { accountIdEqual } from "./account-id";
import { getDatasourceContract, maybeGetDatasourceContract } from "./datasource-contract";
import { getManagedName } from "./managed-names";

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
 * Gets every top-level Root Registry configured for the namespace: all ENSv1Registries
 * (ENSRoot ENSv1Registry, Basenames base.eth ENSv1VirtualRegistry, Lineanames linea.eth ENSv1VirtualRegistry)
 * plus the ENSv2 Root Registry when defined. Used by consumers that need to walk the full set of
 * canonical namegraph roots (forward traversal, canonical-set construction) rather than the single
 * "primary" root returned by {@link getRootRegistryId}. Note that for the Lineanames and Basenames
 * Shadow Registries, we consider the Managed Name's ENSv1VirtualRegistry as the root, negating
 * canonicality for any names under other names managed by said Shadow Regsitry
 *
 * Each Registry roots its own on-chain subtree (the mainnet ENSv1Registry, Basenames/Lineanames
 * shadow Registries on their own chains) — they are not linked together at the indexed-namegraph
 * level, so a traversal that starts from a single root cannot reach them all.
 *
 * TODO(ensv2-shadow): when well-known CCIP-read ENSv2 Registries are introduced, extend this helper to
 * enumerate them.
 */
export const getRootRegistryIds = (namespace: ENSNamespaceId): RegistryId[] => {
  const v1RootRegistryId = getENSv1RootRegistryId(namespace);
  const v2RootRegistryId = maybeGetENSv2RootRegistryId(namespace);

  const basenamesRegistry = maybeGetDatasourceContract(
    namespace,
    DatasourceNames.Basenames,
    "Registry",
  );
  const basenamesRegistryId = basenamesRegistry
    ? makeENSv1VirtualRegistryId(
        basenamesRegistry,
        getManagedName(namespace, basenamesRegistry).node,
      )
    : null;

  const lineanamesRegistry = maybeGetDatasourceContract(
    namespace,
    DatasourceNames.Lineanames,
    "Registry",
  );
  const lineanamesRegistryId = lineanamesRegistry
    ? makeENSv1VirtualRegistryId(
        lineanamesRegistry,
        getManagedName(namespace, lineanamesRegistry).node,
      )
    : null;

  return [
    v1RootRegistryId, //
    basenamesRegistryId,
    lineanamesRegistryId,
    v2RootRegistryId,
  ].filter((id): id is RegistryId => !!id);
};
