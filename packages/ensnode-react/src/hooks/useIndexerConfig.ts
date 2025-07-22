"use client";

import type { ENSNode } from "@ensnode/ensnode-sdk";
import type { ConfigParameter, UseConfigParameters, UseQueryReturnType } from "../types.js";
import { createIndexerConfigQueryOptions, useENSNodeQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseIndexerConfigReturnType = UseQueryReturnType<ENSNode.IndexerConfig>;

/**
 * Hook to fetch ENS Indexer configuration
 *
 * @param parameters - Configuration for the config query
 * @returns Query result with indexer configuration
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useIndexerConfig();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) {
 *   console.log("Indexer version:", data.version);
 *   console.log("Supported chains:", data.chains);
 *   console.log("Features:", data.features);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom query options
 * const { data, refetch } = useIndexerConfig({
 *   query: {
 *     refetchInterval: 30000, // Refetch every 30 seconds
 *     staleTime: 0, // Always consider stale
 *   }
 * });
 * ```
 */
export function useIndexerConfig(
  parameters: UseConfigParameters & ConfigParameter = {},
): UseIndexerConfigReturnType {
  const { query = {} } = parameters;
  const config = useConfig(parameters);

  const queryOptions = createIndexerConfigQueryOptions(config);

  const finalOptions = {
    ...queryOptions,
    ...query,
  };

  return useENSNodeQuery(finalOptions);
}
