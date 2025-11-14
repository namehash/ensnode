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
 * Builds a DRPC RPC URL for the specified chain ID.
 *
 * @param chainId - The chain ID to build the RPC URL for
 * @param key - The DRPC API key
 * @returns The complete DRPC RPC URL, or undefined if the chain is not supported
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
