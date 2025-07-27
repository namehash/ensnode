"use client";

import {
  ENSNodeClient,
  type ForwardResponse,
  type RecordsSelection,
  type ReverseResponse,
} from "@ensnode/ensnode-sdk";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ENSNodeConfig, UseQueryReturnType } from "../types.js";

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
  all: (endpointUrl: string) => ["ensnode", endpointUrl] as const,
  resolutions: (endpointUrl: string) => [...queryKeys.all(endpointUrl), "resolution"] as const,
  forward: (endpointUrl: string, name: string, selection?: RecordsSelection) =>
    [...queryKeys.resolutions(endpointUrl), "forward", name, selection] as const,
  reverse: (endpointUrl: string, address: string, chainId?: number) =>
    [...queryKeys.resolutions(endpointUrl), "reverse", address, chainId] as const,
};

/**
 * Create query options for forward resolution (name to records)
 */
export function createForwardResolutionQueryOptions(
  config: ENSNodeConfig,
  name: string,
  selection?: RecordsSelection,
) {
  return {
    queryKey: queryKeys.forward(config.client.endpointUrl.href, name, selection),
    queryFn: async (): Promise<ForwardResponse> => {
      const client = new ENSNodeClient(config.client);
      return client.resolveName(name, selection);
    },
    enabled: Boolean(name),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  };
}

/**
 * Create query options for reverse resolution (address to name)
 */
export function createReverseResolutionQueryOptions(
  config: ENSNodeConfig,
  address: string,
  chainId?: number,
) {
  return {
    queryKey: queryKeys.reverse(config.client.endpointUrl.href, address, chainId),
    queryFn: async (): Promise<ReverseResponse> => {
      const client = new ENSNodeClient(config.client);
      return client.resolveAddress(address as any, chainId);
    },
    enabled: Boolean(address),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  };
}

/**
 * Custom useQuery wrapper that returns TanStack Query result directly
 */
export function useENSNodeQuery<TData, TError = Error>(
  options: Parameters<typeof useQuery<TData, TError>>[0],
): UseQueryReturnType<TData, TError> {
  return useQuery(options);
}
