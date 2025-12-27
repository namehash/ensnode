import {
  DatasourceNames,
  type ENSNamespaceId,
  ENSNamespaceIds,
  maybeGetDatasource,
} from "@ensnode/datasources";

import type { Name } from "../ens";
import type { AccountId } from "../shared";

/**
 * Gets the SubregistryId (an AccountId) of the Ethnames Subregistry contract (this is the
 * "BaseRegistrar" contract for direct subnames of .eth) for the provided namespace.
 *
 * @param namespace The ENS namespace to get the Ethnames Subregistry ID for
 * @returns The AccountId for the Ethnames Subregistry contract for the provided namespace.
 * @throws Error if the contract is not found for the given namespace.
 */
export function getEthnamesSubregistryId(namespace: ENSNamespaceId): AccountId {
  const datasource = maybeGetDatasource(namespace, DatasourceNames.ENSRoot);
  if (!datasource) {
    throw new Error(`Datasource not found for ${namespace} ${DatasourceNames.ENSRoot}`);
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
 * Get the managed name for the Ethnames subregistry for the selected ENS namespace.
 *
 * @param namespaceId
 * @returns registrar managed name
 */
export function getEthnamesSubregistryManagedName(namespaceId: ENSNamespaceId): Name {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
    case ENSNamespaceIds.Sepolia:
    case ENSNamespaceIds.EnsTestEnv:
      return "eth";
  }
}
