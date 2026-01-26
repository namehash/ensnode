import type { Address } from "viem";

import type { ENSNamespaceId } from "@ensnode/datasources";
import { ENSNamespaceIds, type Name } from "@ensnode/ensnode-sdk";

/**
 * Determine the ENS Manager App base URL for a given ENS namespace.
 *
 * @param namespaceId - ENS namespace identifier
 * @returns The ENS Manager App URL for the namespace, or `null` if that namespace has no known external ENS Manager App
 */
export function getEnsManagerUrl(namespaceId: ENSNamespaceId): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(`https://app.ens.domains/`);
    case ENSNamespaceIds.Sepolia:
    case ENSNamespaceIds.SepoliaV2:
      return new URL(`https://sepolia.app.ens.domains/`);
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by app.ens.domains
      return null;
  }
}

/**
 * Builds the URL of the external ENS Manager App Profile page for a given name and ENS Namespace.
 *
 * @returns URL to the Profile page in the external ENS Manager App for a given name and ENS Namespace,
 * or null if this URL is not known
 */
export function getEnsManagerNameDetailsUrl(name: Name, namespaceId: ENSNamespaceId): URL | null {
  const baseUrl = getEnsManagerUrl(namespaceId);
  if (!baseUrl) return null;

  return new URL(name, baseUrl);
}

/**
 * Get the URL of the address details page in ENS Manager App for a given address and ENS Namespace.
 *
 * @returns URL to the address details page in the ENS Manager App for a given address and ENS
 * Namespace, or null if this URL is not known
 */
export function getEnsManagerAddressDetailsUrl(
  address: Address,
  namespaceId: ENSNamespaceId,
): URL | null {
  const baseUrl = getEnsManagerUrl(namespaceId);
  if (!baseUrl) return null;

  return new URL(address, baseUrl);
}