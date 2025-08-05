"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConfigParameter, UseReverseResolutionParameters } from "../types";
import { createReverseResolutionQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

/**
 * Hook to resolve an address to its primary name (reverse resolution)
 *
 * @param parameters - Configuration for the address resolution
 * @returns Query result with resolved primary name
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useReverseResolution({
 *   address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   chainId: 1
 * });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) {
 *   console.log("Primary name:", data.records.name);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Resolve on different chains
 * const mainnetName = useReverseResolution({
 *   address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   chainId: 1 // Ethereum Mainnet
 * });
 *
 * const optimismName = useReverseResolution({
 *   address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   chainId: 10 // Optimism
 * });
 * ```
 */
export function useReverseResolution(parameters: UseReverseResolutionParameters & ConfigParameter) {
  const { address, chainId, query = {} } = parameters;
  const config = useENSNodeConfig(parameters);

  const queryOptions = address
    ? createReverseResolutionQueryOptions(config, address, chainId)
    : { enabled: false, queryKey: ["disabled"] as const };

  const options = {
    ...queryOptions,
    ...query,
    enabled: Boolean(address && (query.enabled ?? queryOptions.enabled)),
  };

  return useQuery(options);
}
