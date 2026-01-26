import {
  DatasourceNames,
  type ENSNamespaceId,
  ENSNamespaceIds,
  maybeGetDatasource,
} from "@ensnode/datasources";

import type { Name } from "../ens";
import type { AccountId } from "../shared";

/**
 * Gets the SubregistryId (an AccountId) of the Lineanames Subregistry contract (this is the
 * "BaseRegistrar" contract for Lineanames) for the provided namespace.
 *
 * @param namespace The ENS namespace to get the Lineanames Subregistry ID for
 * @returns The AccountId for the Lineanames Subregistry contract for the provided namespace.
 * @throws Error if the contract is not found for the given namespace.
 */
export function getLineanamesSubregistryId(namespace: ENSNamespaceId): AccountId {
  const datasource = maybeGetDatasource(namespace, DatasourceNames.Lineanames);
  if (!datasource) {
    throw new Error(`Datasource not found for ${namespace} ${DatasourceNames.Lineanames}`);
  }

  const address = datasource.contracts.BaseRegistrar?.address;
  if (address === undefined || Array.isArray(address)) {
    throw new Error(`BaseRegistrar contract not found or has multiple addresses for ${namespace}`);
  }

  return {
    chainId: datasource.chain.id,
    address,
  };
}

/**
 * Return the registrar-managed name for the Lineanames subregistry in the specified ENS namespace.
 *
 * @param namespaceId - The ENS namespace identifier to resolve the managed name for
 * @returns The registrar-managed name (e.g., `"linea.eth"` or `"linea-sepolia.eth"`)
 * @throws Error when no registrar-managed name is known for the given namespace
 */
export function getLineanamesSubregistryManagedName(namespaceId: ENSNamespaceId): Name {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return "linea.eth";
    case ENSNamespaceIds.Sepolia:
    case ENSNamespaceIds.SepoliaV2:
      return "linea-sepolia.eth";
    case ENSNamespaceIds.EnsTestEnv:
      throw new Error(
        `No registrar managed name is known for the 'Lineanames' subregistry within the "${namespaceId}" namespace.`,
      );
  }
}