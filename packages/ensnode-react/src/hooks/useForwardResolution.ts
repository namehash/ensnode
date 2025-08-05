"use client";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";

import type { ConfigParameter, UseForwardResolutionParameters } from "../types";
import { createForwardResolutionQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

/**
 * Forward Resolution: Resolve records for an ENS name.
 *
 * @param parameters - Configuration for the ENS name resolution
 * @returns Query result with resolved records
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useForwardResolution({
 *   name: "vitalik.eth",
 *   selection: {
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
export function useForwardResolution<SELECTION extends ResolverRecordsSelection>(
  parameters: UseForwardResolutionParameters<SELECTION> & ConfigParameter,
) {
  const { name, selection, query = {} } = parameters;
  const config = useENSNodeConfig(parameters);

  const queryOptions = name
    ? createForwardResolutionQueryOptions(config, name, selection)
    : { enabled: false, queryKey: ["disabled"] as const };

  const finalOptions = {
    ...queryOptions,
    ...query,
    enabled: Boolean(name && (query.enabled ?? queryOptions.enabled)),
  };

  return useQuery(finalOptions);
}
