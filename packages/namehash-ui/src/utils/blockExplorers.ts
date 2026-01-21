import type { Address, Hash } from "viem";

import type { ChainId } from "@ensnode/ensnode-sdk";

import { SUPPORTED_CHAINS } from "./chains";

/**
 * Gets the "base" block explorer URL for a given {@link ChainId}
 *
 * @returns default block explorer URL for the chain with the provided id,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerUrl = (chainId: ChainId): URL | null => {
  const chain = SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
  if (!chain) return null;

  // NOTE: anvil/ens-test-env chain does not have a blockExplorer
  if (!chain.blockExplorers) return null;

  return new URL(chain.blockExplorers.default.url);
};

/**
 * Gets the block explorer URL for a specific address on a specific chainId
 *
 * @returns complete block explorer URL for a specific address on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerAddressDetailsUrl = (
  chainId: ChainId,
  address: Address,
): URL | null => {
  const chainBlockExplorer = getBlockExplorerUrl(chainId);
  if (!chainBlockExplorer) return null;

  return new URL(`address/${address}`, chainBlockExplorer.toString());
};

/**
 * Gets the block explorer URL for a specific transaction hash on a specific chainId
 *
 * @returns complete block explorer URL for a specific transaction hash on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerTransactionDetailsUrl = (
  chainId: ChainId,
  transactionHash: Hash,
): URL | null => {
  const chainBlockExplorer = getBlockExplorerUrl(chainId);
  if (!chainBlockExplorer) return null;

  return new URL(`tx/${transactionHash}`, chainBlockExplorer.toString());
};

/**
 * Gets the block explorer URL for a specific block on a specific chainId
 *
 * @returns complete block explorer URL for a specific block on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerBlockUrl = (chainId: ChainId, blockNumber: number): URL | null => {
  const chainBlockExplorer = getBlockExplorerUrl(chainId);
  if (!chainBlockExplorer) return null;

  return new URL(`block/${blockNumber}`, chainBlockExplorer.toString());
};
