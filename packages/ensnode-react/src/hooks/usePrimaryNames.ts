"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConfigParameter, UsePrimaryNamesParameters } from "../types";
import { createPrimaryNamesQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

/**
 * Resolves the primary names of a specified address (Batch Reverse Resolution).
 *
 * @param parameters - Configuration for the address resolution
 * @returns Query result with resolved primary names
 *
 * @example
 * ```typescript
 * import { usePrimaryNames } from "@ensnode/ensnode-react";
 *
 * function DisplayPrimaryNames() {
 *   const { data, isLoading, error } = usePrimaryNames({
 *     address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {Object.entries(data.names).map(([chainId, name]) => (
 *         <div key={chainId}>
 *           <h3>Primary Name (Chain Id: {chainId})</h3>
 *           <p>{name}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrimaryNames(parameters: UsePrimaryNamesParameters & ConfigParameter) {
  const { config, query = {}, address, ...args } = parameters;
  const _config = useENSNodeConfig(config);

  const canEnable = address !== null;

  const queryOptions = canEnable
    ? createPrimaryNamesQueryOptions(_config, { ...args, address })
    : { enabled: false, queryKey: ["disabled"] as const };

  const options = {
    ...queryOptions,
    ...query,
    enabled: canEnable && (query.enabled ?? queryOptions.enabled),
  };

  return useQuery(options);
}
