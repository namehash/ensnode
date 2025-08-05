"use client";

import { ENSNodeClient, ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import type { ENSNodeConfig } from "../types";

/**
 * Query key factory for ENSNode queries
 * Includes endpoint URL for proper cache isolation between different ENSNode instances
 *
 * @example
 * ```typescript
 * // Forward resolution
 * queryKeys.forward("https://api.mainnet.ensnode.io", "vitalik.eth", { addresses: [60] })
 * // Results in: ["ensnode", "https://api.mainnet.ensnode.io", "resolution", "forward", "vitalik.eth", { addresses: [60] }]
 *
 * // Reverse resolution
 * queryKeys.reverse("https://api.mainnet.ensnode.io", "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 1)
 * // Results in: ["ensnode", "https://api.mainnet.ensnode.io", "resolution", "reverse", "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 1]
 *
 * // Different endpoints have separate cache keys
 * queryKeys.forward("https://api.testnet.ensnode.io", "vitalik.eth", { addresses: [60] })
 * // Results in: ["ensnode", "https://api.testnet.ensnode.io", "resolution", "forward", "vitalik.eth", { addresses: [60] }]
 * ```
 */
export const queryKeys = {
  all: (url: string) => ["ensnode", url] as const,
  resolutions: (url: string) => [...queryKeys.all(url), "resolution"] as const,
  forward: (url: string, name: string, selection: ResolverRecordsSelection) =>
    [...queryKeys.resolutions(url), "forward", name, selection] as const,
  reverse: (url: string, address: string, chainId?: number) =>
    [...queryKeys.resolutions(url), "reverse", address, chainId] as const,
};

/**
 * Creates query options for Forward Resolution
 */
export function createForwardResolutionQueryOptions<SELECTION extends ResolverRecordsSelection>(
  config: ENSNodeConfig,
  name: string,
  selection: SELECTION,
) {
  return {
    queryKey: queryKeys.forward(config.client.url.href, name, selection),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolveForward(name, selection);
    },
    enabled: true,
  };
}

/**
 * Creates query options for Reverse Resolution
 */
export function createReverseResolutionQueryOptions(
  config: ENSNodeConfig,
  address: `0x${string}`,
  chainId?: number,
) {
  return {
    queryKey: queryKeys.reverse(config.client.url.href, address, chainId),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolveReverse(address, chainId);
    },
    enabled: true,
  };
}
