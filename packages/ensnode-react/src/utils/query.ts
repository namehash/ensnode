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
 * queryKeys.records("https://api.mainnet.ensnode.io", "vitalik.eth", { addresses: [60] })
 * // Results in: ["ensnode", "https://api.mainnet.ensnode.io", "resolution", "records", "vitalik.eth", { addresses: [60] }]
 *
 * // Primary name resolution
 * queryKeys.primaryName("https://api.mainnet.ensnode.io", "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 1)
 * // Results in: ["ensnode", "https://api.mainnet.ensnode.io", "resolution", "primaryName", "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 1]
 *
 * // Different endpoints have separate cache keys
 * queryKeys.records("https://api.testnet.ensnode.io", "vitalik.eth", { addresses: [60] })
 * // Results in: ["ensnode", "https://api.testnet.ensnode.io", "resolution", "records", "vitalik.eth", { addresses: [60] }]
 * ```
 */
export const queryKeys = {
  all: (url: string) => ["ensnode", url] as const,
  resolutions: (url: string) => [...queryKeys.all(url), "resolution"] as const,
  records: (url: string, name: string, selection: ResolverRecordsSelection) =>
    [...queryKeys.resolutions(url), "records", name, selection] as const,
  primaryName: (url: string, address: string, chainId?: number) =>
    [...queryKeys.resolutions(url), "primaryName", address, chainId] as const,
};

/**
 * Creates query options for Records Resolution
 */
export function createRecordsQueryOptions<SELECTION extends ResolverRecordsSelection>(
  config: ENSNodeConfig,
  name: string,
  selection: SELECTION,
) {
  return {
    queryKey: queryKeys.records(config.client.url.href, name, selection),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolveRecords(name, selection);
    },
    enabled: true,
  };
}

/**
 * Creates query options for Primary Name Resolution
 */
export function createPrimaryNameQueryOptions(
  config: ENSNodeConfig,
  address: `0x${string}`,
  chainId?: number,
) {
  return {
    queryKey: queryKeys.primaryName(config.client.url.href, address, chainId),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolvePrimaryName(address, chainId);
    },
    enabled: true,
  };
}
