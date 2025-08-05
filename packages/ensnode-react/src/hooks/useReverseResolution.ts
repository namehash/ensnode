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
 * import { useReverseResolution } from "@ensnode/ensnode-react";
 *
 * function DisplayPrimaryNameAndAvatar() {
 *   const { data, isLoading, error } = useReverseResolution({
 *     address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *     chainId: 1, // Ethereum Mainnet
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!data) return <div>No primary name set</div>;
 *
 *   return (
 *     <div>
 *       <h3>Primary Name (for Mainnet)</h3>
 *       <p>{data.records.name}</p>
 *
 *       <h3>Avatar Record (for Mainnet)</h3>
 *       <p>{data.records.texts.avatar}</p>
 *     </div>
 *   );
 * }
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
