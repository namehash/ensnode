"use client";

import type { IndexingStatus } from "@ensnode/ensnode-sdk";
import type { ConfigParameter, UseIndexingStatusParameters, UseQueryReturnType } from "../types.js";
import { createIndexingStatusQueryOptions, useENSNodeQuery } from "../utils/query.js";
import { useConfig } from "./useConfig.js";

export type UseIndexingStatusReturnType = UseQueryReturnType<IndexingStatus>;

/**
 * Hook to fetch ENS Indexer status
 *
 * @param parameters - Configuration for the indexing status query
 * @returns Query result with indexing status
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useIndexingStatus();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) {
 *   console.log("Indexer status:", data.status);
 *   console.log("Progress:", data.progress);
 *   console.log("Current block:", data.currentBlock);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With polling for real-time updates
 * const { data, refetch } = useIndexingStatus({
 *   query: {
 *     refetchInterval: 5000, // Poll every 5 seconds
 *     refetchIntervalInBackground: true,
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Conditional based on syncing status
 * const { data: status } = useIndexingStatus();
 * const isSyncing = status?.status === "syncing";
 *
 * return (
 *   <div>
 *     {isSyncing ? (
 *       <div>Syncing... {status.progress.toFixed(2)}%</div>
 *     ) : (
 *       <div>Fully synced ✅</div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useIndexingStatus(
  parameters: UseIndexingStatusParameters & ConfigParameter = {},
): UseIndexingStatusReturnType {
  const { query = {} } = parameters;
  const config = useConfig(parameters);

  const queryOptions = createIndexingStatusQueryOptions(config);

  const finalOptions = {
    ...queryOptions,
    ...query,
  };

  return useENSNodeQuery(finalOptions);
}
