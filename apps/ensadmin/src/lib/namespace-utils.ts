import {
  DatasourceNames,
  ENSNamespaceId,
  ENSNamespaceIds,
  getDatasource,
} from "@ensnode/datasources";
import { ChainId, Name } from "@ensnode/ensnode-sdk";
import { Address } from "viem";
import {
  anvil,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  holesky,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  sepolia,
} from "viem/chains";

const ensTestEnv = { ...anvil, id: 1337, name: "ens-test-env" };

const SUPPORTED_CHAINS = [
  ensTestEnv,
  mainnet,
  sepolia,
  holesky,
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
 * Mapping of chain id to prettified chain name.
 *
 * NOTE: We prefer our custom names here, rather than those provided by default in `Chain#name`.
 */
const CUSTOM_CHAIN_NAMES = new Map<number, string>([
  [ensTestEnv.id, "Ethereum Local (ens-test-env)"],
  [mainnet.id, "Ethereum"],
  [sepolia.id, "Ethereum Sepolia"],
  [holesky.id, "Ethereum Holesky"],
  [base.id, "Base"],
  [baseSepolia.id, "Base Sepolia"],
  [linea.id, "Linea"],
  [lineaSepolia.id, "Linea Sepolia"],
  [optimism.id, "Optimism"],
  [optimismSepolia.id, "Optimism Sepolia"],
  [arbitrum.id, "Arbitrum"],
  [arbitrumSepolia.id, "Arbitrum Sepolia"],
  [scroll.id, "Scroll"],
  [scrollSepolia.id, "Scroll Sepolia"],
]);

/**
 * Returns the Address of the NameWrapper contract within the requested namespace.
 *
 * @returns the viem#Address object
 */
export const getNameWrapperAddress = (namespaceId: ENSNamespaceId): Address =>
  getDatasource(namespaceId, DatasourceNames.ENSRoot).contracts.NameWrapper.address;

/**
 * Get the ENS Manager App URL for the provided namespace.
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @returns ENS Manager App URL for the provided namespace, or null if the provided namespace
 * doesn't have a known ENS Manager App
 */
export function getEnsManagerAppUrl(namespaceId: ENSNamespaceId): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(`https://app.ens.domains/`);
    case ENSNamespaceIds.Sepolia:
      return new URL(`https://sepolia.app.ens.domains/`);
    case ENSNamespaceIds.Holesky:
      return new URL(`https://holesky.app.ens.domains/`);
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by app.ens.domains
      return null;
  }
}

/**
 * Get the avatar image URL for a name on the given ENS Namespace
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @param {Name} name - ENS name to get the avatar image URL for
 * @returns avatar image URL for the name on the given ENS Namespace, or null if the avatar image
 * URL is not known
 */
export function getNameAvatarUrl(name: Name, namespaceId: ENSNamespaceId): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
    case ENSNamespaceIds.Sepolia:
      return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
    case ENSNamespaceIds.Holesky:
      // metadata.ens.domains doesn't currently support holesky
      return null;
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      return null;
  }
}

/**
 * Get the URL of the external ENS Manager App name details page for a given name and ENS Namespace.
 *
 * @returns URL to the name details page in the external ENS Manager App for a given name and ENS Namespace,
 * or null if this URL is not known
 */
export function getExternalEnsAppNameUrl(name: Name, namespaceId: ENSNamespaceId): URL | null {
  const baseUrl = getEnsManagerAppUrl(namespaceId);
  if (!baseUrl) return null;

  return new URL(name, baseUrl);
}

/**
 * Get the URL of the internal name details page for a given name.
 *
 * @returns URL path to the internal name details page
 */
export function getNameDetailsUrl(name: Name, namespaceId: ENSNamespaceId): string {
  return `/name/${encodeURIComponent(name)}`;
}

/**
 * Get the URL of the address details page in ENS Manager App for a given address and ENS Namespace.
 *
 * @returns URL to the address details page in the ENS Manager App for a given address and ENS
 * Namespace, or null if this URL is not known
 */
export function getAddressDetailsUrl(address: Address, namespaceId: ENSNamespaceId): URL | null {
  const baseUrl = getEnsManagerAppUrl(namespaceId);
  if (!baseUrl) return null;

  return new URL(address, baseUrl);
}

/**
 * Gets the base block explorer URL for a given chainId
 *
 * @returns default block explorer URL for the chain with the provided id,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getChainBlockExplorerUrl = (chainId: ChainId): URL | null => {
  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
  if (!chain) return null;

  // NOTE: anvil/ens-test-env chain does not have a blockExplorer
  if (!chain.blockExplorers) return null;

  return new URL(chain.blockExplorers.default.url);
};

/**
 * Gets the block explorer URL for a specific block on a specific chainId
 *
 * @returns complete block explorer URL for a specific block on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerUrlForBlock = (chainId: ChainId, blockNumber: number): URL | null => {
  const chainBlockExplorer = getChainBlockExplorerUrl(chainId);
  if (!chainBlockExplorer) return null;

  return new URL(`block/${blockNumber}`, chainBlockExplorer.toString());
};

/**
 * Returns a prettified chain name for the provided chain id.
 */
export function getChainName(chainId: ChainId): string {
  const name = CUSTOM_CHAIN_NAMES.get(chainId);
  return name || `Unknown Chain (${chainId})`;
}
