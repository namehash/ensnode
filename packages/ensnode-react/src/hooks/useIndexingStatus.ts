import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  createRealtimeIndexingStatusProjection,
  type IndexingStatusRequest,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";
import { useNow } from "./useNow";

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponse> {}

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

  const queryOptions = createIndexingStatusQueryOptions(_config);

  const options = {
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - indexing status changes frequently
    placeholderData: keepPreviousData, // Keep showing previous data during refetch and on error
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  const queryResult = useQuery(options);

  // Extract the current snapshot from the query result.
  // Thanks to placeholderData: keepPreviousData, this will continue showing
  // the last successful snapshot even when subsequent fetches fail.
  // Note: queryFn now throws on error responses, so data will only contain valid responses

  // debug
  const currentSnapshot =
    queryResult.data?.responseCode === IndexingStatusResponseCodes.Ok
      ? queryResult.data.realtimeProjection.snapshot
      : null;

  // / worstCaseDistance is measured in seconds

  // Get current timestamp that updates every second.
  // Each component instance gets its own timestamp
  const projectedAt = useNow(1000);

  // Generate projection from cached snapshot using the synchronized timestamp.
  // useMemo ensures we only create a new projection object when values actually change,
  // maintaining referential equality for unchanged data (prevents unnecessary re-renders).
  const projectedData = useMemo(() => {
    if (!currentSnapshot) return null;

    const realtimeProjection = createRealtimeIndexingStatusProjection(currentSnapshot, projectedAt);

    return {
      // debugging
      responseCode: "ok" as const,
      realtimeProjection,
    } satisfies IndexingStatusResponse;
  }, [currentSnapshot, projectedAt]);

  if (projectedData) {
    return {
      ...queryResult,
      data: projectedData,
    };
  }

  return queryResult;
}
