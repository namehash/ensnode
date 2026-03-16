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

import { ensTestEnvChain } from "@ensnode/datasources";
import type { ChainId } from "@ensnode/ensnode-sdk";

export const SUPPORTED_CHAINS = [
  ensTestEnvChain,
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
 * Mapping of {@link ChainId} to prettified chain name.
 *
 * NOTE: We prefer our custom names here, rather than those provided by default in `Chain#name`.
 */
const CUSTOM_CHAIN_NAMES = new Map<ChainId, string>([
  [ensTestEnvChain.id, "Ethereum Local (ens-test-env)"],
  [mainnet.id, "Mainnet"],
  [sepolia.id, "Ethereum Sepolia"],
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
 * Returns a prettified chain name for the provided chain id.
 */
export function getChainName(chainId: ChainId): string {
  const name = CUSTOM_CHAIN_NAMES.get(chainId);
  return name || `Unknown Chain (${chainId})`;
}
