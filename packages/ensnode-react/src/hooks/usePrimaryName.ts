"use client";

import { useQuery } from "@tanstack/react-query";

import type { UsePrimaryNameParameters, WithEnsApiProviderOptions } from "../types";
import { createPrimaryNameQueryOptions } from "../utils/query";
import { useEnsApiProviderOptions } from "./useEnsApiProviderOptions";

/**
 * Resolves the primary name of a specified address (Reverse Resolution).
 *
 * The returned Primary Name, if set, is guaranteed to be a normalized name.
 * If the primary name set for the address is not normalized, `null` is returned as if no primary name was set.
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
 *     accelerate: true, // Attempt Protocol Acceleration
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       <h3>Primary Name (for Mainnet)</h3>
 *       <p>{data.name ?? "No Primary Name"}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrimaryName(parameters: UsePrimaryNameParameters & WithEnsApiProviderOptions) {
  const { options, query = {}, address, ...args } = parameters;
  const providerOptions = useEnsApiProviderOptions(options);

  const canEnable = address !== null;

  const queryOptions = canEnable
    ? createPrimaryNameQueryOptions(providerOptions, { ...args, address })
    : { enabled: false, queryKey: ["disabled"] as const };

  return useQuery({
    ...queryOptions,
    ...query,
    enabled: canEnable && (query.enabled ?? queryOptions.enabled),
  });
}
