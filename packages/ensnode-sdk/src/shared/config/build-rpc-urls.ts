import {
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

import { ChainId } from "@ensnode/ensnode-sdk";

/**
 * Builds an Alchemy RPC URL for the specified chain ID.
 *
 * @param chainId - The chain ID to build the RPC URL for
 * @param key - The Alchemy API key
 * @returns The complete Alchemy RPC URL, or undefined if the chain is not supported
 *
 * @example
 * ```typescript
 * const url = buildAlchemyUrl(1, "your-api-key");
 * // Returns: "https://eth-mainnet.g.alchemy.com/v2/your-api-key"
 * ```
 */
export function buildAlchemyUrl(chainId: ChainId, key: string): string | undefined {
  switch (chainId) {
    case mainnet.id:
      return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
    case sepolia.id:
      return `https://eth-sepolia.g.alchemy.com/v2/${key}`;
    case holesky.id:
      return `https://eth-holesky.g.alchemy.com/v2/${key}`;
    case arbitrum.id:
      return `https://arb-mainnet.g.alchemy.com/v2/${key}`;
    case arbitrumSepolia.id:
      return `https://arb-sepolia.g.alchemy.com/v2/${key}`;
    case base.id:
      return `https://base-mainnet.g.alchemy.com/v2/${key}`;
    case baseSepolia.id:
      return `https://base-sepolia.g.alchemy.com/v2/${key}`;
    case optimism.id:
      return `https://opt-mainnet.g.alchemy.com/v2/${key}`;
    case optimismSepolia.id:
      return `https://opt-sepolia.g.alchemy.com/v2/${key}`;
    case linea.id:
      return `https://linea-mainnet.g.alchemy.com/v2/${key}`;
    case lineaSepolia.id:
      return `https://linea-sepolia.g.alchemy.com/v2/${key}`;
    case scroll.id:
      return `https://scroll-mainnet.g.alchemy.com/v2/${key}`;
    case scrollSepolia.id:
      return `https://scroll-sepolia.g.alchemy.com/v2/${key}`;
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
    case holesky.id:
      return `https://lb.drpc.live/holesky/${key}`;
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
