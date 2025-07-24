"use client";

import type { ReverseResponse } from "@ensnode/ensnode-sdk";
import type { ConfigParameter, UseAddressParameters, UseQueryReturnType } from "../types.js";
import { createReverseResolutionQueryOptions, useENSNodeQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseAddressReturnType = UseQueryReturnType<ReverseResponse>;

/**
 * Hook to resolve an address to its primary name (reverse resolution)
 *
 * @param parameters - Configuration for the address resolution
 * @returns Query result with resolved primary name
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useAddress({
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
 * const mainnetName = useAddress({
 *   address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   chainId: 1 // Ethereum mainnet
 * });
 *
 * const optimismName = useAddress({
 *   address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   chainId: 10 // Optimism
 * });
 * ```
 */
export function useAddress(
  parameters: UseAddressParameters & ConfigParameter = {},
): UseAddressReturnType {
  const { address, chainId, query = {} } = parameters;
  const config = useConfig(parameters);

  const queryOptions = address
    ? createReverseResolutionQueryOptions(config, address, chainId)
    : { enabled: false, queryKey: ["disabled"] as const };

  const finalOptions = {
    ...queryOptions,
    ...query,
    enabled: Boolean(address && (query.enabled ?? queryOptions.enabled)),
  };

  return useENSNodeQuery(finalOptions);
}
