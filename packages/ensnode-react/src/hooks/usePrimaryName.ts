"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConfigParameter, UsePrimaryNameParameters } from "../types";
import { createPrimaryNameQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

/**
 * Resolves the primary name of a specified address (Reverse Resolution).
 *
 * @param parameters - Configuration for the address resolution
 * @returns Query result with resolved primary name
 *
 * @example
 * ```typescript
 * import { usePrimaryName } from "@ensnode/ensnode-react";
 *
 * function DisplayPrimaryNameAndAvatar() {
 *   const { data, isLoading, error } = usePrimaryName({
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
export function usePrimaryName(parameters: UsePrimaryNameParameters & ConfigParameter) {
  const { address, chainId, trace, query = {} } = parameters;
  const config = useENSNodeConfig(parameters);

  const canEnable = address !== null;

  const queryOptions = canEnable
    ? createPrimaryNameQueryOptions(config, { address, chainId, trace })
    : { enabled: false, queryKey: ["disabled"] as const };

  const options = {
    ...queryOptions,
    ...query,
    enabled: canEnable && (query.enabled ?? queryOptions.enabled),
  };

  return useQuery(options);
}
