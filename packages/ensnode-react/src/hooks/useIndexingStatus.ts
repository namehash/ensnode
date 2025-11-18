import {
  keepPreviousData,
  type QueryObserverSuccessResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import {
  createRealtimeIndexingStatusProjection,
  IndexingStatusResponseCodes,
  type IndexingStatusResponseOk,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";
import { useNow } from "./useNow";

interface UseIndexingStatusParameters extends QueryParameter<IndexingStatusResponseOk> {}

/**
 * Hook for fetching and tracking indexing status with client-side projection updates.
 *
 * Clients often need frequently updated worst-case distance for their logic,
 * but calling the API every second would be inefficient. Instead, we fetch a
 * snapshot and keep it in memory. We then asynchronously attempt to update it every 10 seconds.
 *
 * From the most recently cached snapshot, this hook instantly generates new projections —
 * entirely in memory. Each projection provides a recalculation of worst-case distance based on:
 *   • The current time (when the projection was generated)
 *   • The snapshot's absolute timestamps of recorded indexing progress
 *
 * This works reliably because indexing progress is virtually always non-decreasing over
 * time (virtually never goes backward). Clients can safely assume that a snapshot from a
 * few seconds ago is still valid for building new projections. Since snapshots
 * exclusively contain absolute timestamps, we can reuse a snapshot across time to continuously compute updated worst-case projections without additional API calls.
 *
 * **Error Handling:**
 * When the indexing status API returns an error response, this hook continues to display
 * the last successful snapshot while projecting forward in time. This provides a graceful
 * degradation experience - the UI shows slightly stale but still useful data rather than
 * breaking completely.
 *
 * @param parameters - Configuration options
 * @param parameters.config - ENSNode SDK configuration (optional, uses context if not provided)
 * @param parameters.query - TanStack Query options for customizing query behavior (refetchInterval, enabled, etc.)
 * @returns TanStack Query result containing a new indexing status projection based on the current time
 */
export function useIndexingStatus(
  parameters: WithSDKConfigParameter & UseIndexingStatusParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryClient = useQueryClient();
  const queryOptions = createIndexingStatusQueryOptions(_config);
  // cacheResult, if available, is always IndexingStatusResponseOk (thanks to
  // queryFn throwing error for IndexingStatusResponseError)
  const cachedResult = queryClient.getQueryData<IndexingStatusResponseOk>(queryOptions.queryKey);

  const queryResult = useQuery({
    ...queryOptions,
    ...query,
    // cached result can never be stale
    staleTime: cachedResult ? Infinity : undefined,
    // cached result can never be removed by garbage collector
    gcTime: cachedResult ? Infinity : undefined,
    refetchInterval: 3 * 1000, // 3 seconds - indexing status changes frequently
    placeholderData: keepPreviousData, // Keep showing previous data during refetch (does not work for errors)
    enabled: query.enabled ?? queryOptions.enabled,
  });

  // Get current timestamp that updates every second.
  // Each component instance gets its own timestamp
  const projectedAt = useNow(1000);

  // useMemo ensures we only create a new projection object when values actually change,
  // maintaining referential equality for unchanged data (prevents unnecessary re-renders).
  const memoizedQueryResult = useMemo(() => {
    // If the query result is error
    // and the cachedResult is available
    // override the query result to be success, including cachedResult data
    if (queryResult.isError && cachedResult) {
      return {
        ...queryResult,
        isError: false,
        error: null,
        isRefetchError: false,
        isLoadingError: false,
        isSuccess: true,
        status: "success",
        data: cachedResult,
      } satisfies QueryObserverSuccessResult<IndexingStatusResponseOk, Error>;
    }

    // if queryResult is not success, just return it without any updates
    if (!queryResult.isSuccess) {
      return queryResult;
    }

    // Extract the current snapshot from the query result.
    const { snapshot } = queryResult.data.realtimeProjection;

    // Generate projection from current snapshot using the synchronized timestamp.
    const realtimeProjection = createRealtimeIndexingStatusProjection(snapshot, projectedAt);
    return {
      ...queryResult,
      isPlaceholderData: false,
      data: {
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection,
      },
    } satisfies QueryObserverSuccessResult<IndexingStatusResponseOk, Error>;
  }, [queryResult, cachedResult, projectedAt]);

  return memoizedQueryResult;
}
