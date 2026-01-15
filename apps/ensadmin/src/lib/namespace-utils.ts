import { getBlockExplorerUrl, getEnsManagerUrl } from "@namehash/namehash-ui";
import type { Address } from "viem";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  sepolia,
} from "viem/chains";

import {
  DatasourceNames,
  type ENSNamespaceId,
  ENSNamespaceIds,
  ensTestEnvL1Chain,
  getDatasource,
} from "@ensnode/datasources";
import type { ChainId, Name } from "@ensnode/ensnode-sdk";

const SUPPORTED_CHAINS = [
  ensTestEnvL1Chain,
  mainnet,
  sepolia,
  base,
  baseSepolia,
  linea,
  lineaSepolia,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia,
  scroll,
  scrollSepolia,
];

/**
 * Returns the Address of the NameWrapper contract within the requested namespace.
 *
 * @returns the viem#Address object
 */
export const getNameWrapperAddress = (namespaceId: ENSNamespaceId): Address =>
  getDatasource(namespaceId, DatasourceNames.ENSRoot).contracts.NameWrapper.address;

/**
 * Builds the URL of the external ENS Manager App Profile page for a given name and ENS Namespace.
 *
 * @returns URL to the Profile page in the external ENS Manager App for a given name and ENS Namespace,
 * or null if this URL is not known
 */
export function buildExternalEnsAppProfileUrl(name: Name, namespaceId: ENSNamespaceId): URL | null {
  const baseUrl = getEnsManagerUrl(namespaceId);
  if (!baseUrl) return null;

  return new URL(name, baseUrl);
}

/**
 * Gets the block explorer URL for a specific block on a specific chainId
 *
 * @returns complete block explorer URL for a specific block on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerUrlForBlock = (chainId: ChainId, blockNumber: number): URL | null => {
  const chainBlockExplorer = getBlockExplorerUrl(chainId);
  if (!chainBlockExplorer) return null;

  return new URL(`block/${blockNumber}`, chainBlockExplorer.toString());
};
