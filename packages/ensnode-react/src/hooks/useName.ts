"use client";

import type { ENSNode } from "@ensnode/ensnode-sdk";
import type {
  ConfigParameter,
  UseNameParameters,
  UseQueryReturnType,
} from "../types.js";
import {
  createForwardResolutionQueryOptions,
  useENSNodeQuery,
} from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseNameReturnType = UseQueryReturnType<ENSNode.ForwardResponse>;

/**
 * Hook to resolve an ENS name to records (forward resolution)
 *
 * @param parameters - Configuration for the name resolution
 * @returns Query result with resolved records
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useName({
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
export function useName(
  parameters: UseNameParameters & ConfigParameter = {}
): UseNameReturnType {
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
