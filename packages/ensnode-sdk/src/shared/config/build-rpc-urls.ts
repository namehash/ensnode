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

import type { ChainId } from "@ensnode/ensnode-sdk";

/**
 * Builds a Alchemy RPC base URL for the specified chain ID.
 *
 * @param chainId - The chain ID to build the RPC base URL for
 * @param key - The Alchemy API key
 * @returns The Alchemy RPC base URL, or undefined if the chain is not supported
 *
 * @example
 * ```typescript
 * const url = buildAlchemyUrl(1, "your-api-key");
 * // Returns: "eth-mainnet.g.alchemy.com/v2/your-api-key"
 * ```
 */
export function buildAlchemyBaseUrl(chainId: ChainId, key: string): string | undefined {
  switch (chainId) {
    case mainnet.id:
      return `eth-mainnet.g.alchemy.com/v2/${key}`;
    case sepolia.id:
      return `eth-sepolia.g.alchemy.com/v2/${key}`;
    case arbitrum.id:
      return `arb-mainnet.g.alchemy.com/v2/${key}`;
    case arbitrumSepolia.id:
      return `arb-sepolia.g.alchemy.com/v2/${key}`;
    case base.id:
      return `base-mainnet.g.alchemy.com/v2/${key}`;
    case baseSepolia.id:
      return `base-sepolia.g.alchemy.com/v2/${key}`;
    case optimism.id:
      return `opt-mainnet.g.alchemy.com/v2/${key}`;
    case optimismSepolia.id:
      return `opt-sepolia.g.alchemy.com/v2/${key}`;
    case linea.id:
      return `linea-mainnet.g.alchemy.com/v2/${key}`;
    case lineaSepolia.id:
      return `linea-sepolia.g.alchemy.com/v2/${key}`;
    case scroll.id:
      return `scroll-mainnet.g.alchemy.com/v2/${key}`;
    case scrollSepolia.id:
      return `scroll-sepolia.g.alchemy.com/v2/${key}`;
    default:
      return undefined;
  }
}

/**
 * Builds a dRPC RPC URL for the specified chain ID.
 *
 * @param chainId - The chain ID to build the RPC URL for
 * @param key - The dRPC API key
 * @returns The complete dRPC RPC URL, or undefined if the chain is not supported
 *
 * @example
 * ```typescript
 * const url = buildDRPCUrl(1, "your-api-key");
 * // Returns: "https://lb.drpc.live/ethereum/your-api-key"
 * ```
 */
export function buildDRPCUrl(chainId: ChainId, key: string): string | undefined {
  switch (chainId) {
    case mainnet.id:
      return `https://lb.drpc.live/ethereum/${key}`;
    case sepolia.id:
      return `https://lb.drpc.live/ethereum-sepolia/${key}`;
    case arbitrum.id:
      return `https://lb.drpc.live/arbitrum/${key}`;
    case arbitrumSepolia.id:
      return `https://lb.drpc.live/arbitrum-sepolia/${key}`;
    case base.id:
      return `https://lb.drpc.live/base/${key}`;
    case baseSepolia.id:
      return `https://lb.drpc.live/base-sepolia/${key}`;
    case optimism.id:
      return `https://lb.drpc.live/optimism/${key}`;
    case optimismSepolia.id:
      return `https://lb.drpc.live/optimism-sepolia/${key}`;
    case linea.id:
      return `https://lb.drpc.live/linea/${key}`;
    case lineaSepolia.id:
      return `https://lb.drpc.live/linea-sepolia/${key}`;
    case scroll.id:
      return `https://lb.drpc.live/scroll/${key}`;
    case scrollSepolia.id:
      return `https://lb.drpc.live/scroll-sepolia/${key}`;
    default:
      return undefined;
  }
}

/**
 * Builds a QuickNode RPC base URL for the specified chain ID.
 *
 * @param chainId - The chain ID to build the RPC base URL for
 * @param apiKey - The QuickNode API key
 * @param endpointName - The QuickNode Endpoint name
 * @returns The QuickNode RPC base URL, or undefined if the chain is not supported
 *
 * NOTE:
 * - Only multi-chain QuickNode endpoints are supported.
 *   https://www.quicknode.com/guides/quicknode-products/how-to-use-multichain-endpoint
 * - QuickNode platform does not support Linea Sepolia RPC (as of 2025-12-03).
 *   https://www.quicknode.com/docs/linea
 *
 * @example
 * ```typescript
 * const url = buildQuickNodeURL(1, "your-api-key", "your-endpoint-name");
 * // Returns: "your-endpoint-name.quiknode.pro/your-api-key"
 * ```
 */
export function buildQuickNodeURL(
  chainId: ChainId,
  apiKey: string,
  endpointName: string,
): string | undefined {
  switch (chainId) {
    case mainnet.id:
      return `${endpointName}.quiknode.pro/${apiKey}`;
    case sepolia.id:
      return `${endpointName}.ethereum-sepolia.quiknode.pro/${apiKey}`;
    case arbitrum.id:
      return `${endpointName}.arbitrum-mainnet.quiknode.pro/${apiKey}`;
    case arbitrumSepolia.id:
      return `${endpointName}.arbitrum-sepolia.quiknode.pro/${apiKey}`;
    case base.id:
      return `${endpointName}.base-mainnet.quiknode.pro/${apiKey}`;
    case baseSepolia.id:
      return `${endpointName}.base-sepolia.quiknode.pro/${apiKey}`;
    case optimism.id:
      return `${endpointName}.optimism.quiknode.pro/${apiKey}`;
    case optimismSepolia.id:
      return `${endpointName}.optimism-sepolia.quiknode.pro/${apiKey}`;
    case linea.id:
      return `${endpointName}.linea-mainnet.quiknode.pro/${apiKey}`;
    case lineaSepolia.id:
      return undefined;
    case scroll.id:
      return `${endpointName}.scroll-mainnet.quiknode.pro/${apiKey}`;
    case scrollSepolia.id:
      return `${endpointName}.scroll-testnet.quiknode.pro/${apiKey}`;
    default:
      return undefined;
  }
}

export function alchemySupportsChain(chainId: ChainId) {
  return buildAlchemyBaseUrl(chainId, "") !== undefined;
}

export function dRPCSupportsChain(chainId: ChainId) {
  return buildDRPCUrl(chainId, "") !== undefined;
}

export function quickNodeSupportsChain(chainId: ChainId) {
  return buildQuickNodeURL(chainId, "", "") !== undefined;
}
