"use client";

import type { ForwardResponse, RecordsSelection } from "@ensnode/ensnode-sdk";
import type { ConfigParameter, UseQueryReturnType, UseResolveNameParameters } from "../types.js";
import { createForwardResolutionQueryOptions, useENSNodeQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseResolveNameReturnType = UseQueryReturnType<ForwardResponse>;

/**
 * Hook to resolve an ENS name to records (forward resolution)
 *
 * @param parameters - Configuration for the name resolution
 * @returns Query result with resolved records
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useResolveName({
 *   name: "vitalik.eth",
 *   selection: {
 *     name: true,
 *     addresses: [60],
 *     texts: ["avatar", "com.twitter"]
 *   }
 * });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) {
 *   console.log("Resolved records:", data.records);
 * }
 * ```
 */
export function useResolveName(
  parameters: UseResolveNameParameters & ConfigParameter = {},
): UseResolveNameReturnType {
  const { name, selection, query = {} } = parameters;
  const config = useConfig(parameters);

  const queryOptions = name
    ? createForwardResolutionQueryOptions(config, name, selection)
    : { enabled: false, queryKey: ["disabled"] as const };

  const finalOptions = {
    ...queryOptions,
    ...query,
    enabled: Boolean(name && (query.enabled ?? queryOptions.enabled)),
  };

  return useENSNodeQuery(finalOptions);
}
