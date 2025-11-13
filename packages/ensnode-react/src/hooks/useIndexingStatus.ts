import { useQuery } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore } from "react";

import {
  createRealtimeIndexingStatusProjection,
  type IndexingStatusRequest,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { projectionSync } from "../utils/projectionSync";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

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
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  const queryResult = useQuery(options);

  // Extract the current snapshot from the query result.
  // This will be null until we get a successful response.
  const currentSnapshot =
    queryResult.data?.responseCode === IndexingStatusResponseCodes.Ok
      ? queryResult.data.realtimeProjection.snapshot
      : null;

  // Subscribe to synchronized timestamp updates (ticks every second).
  // All components using this hook will receive the same timestamp value,
  // ensuring consistent projections across the entire UI.
  const projectedAt = useSyncExternalStore(
    projectionSync.subscribe.bind(projectionSync),
    projectionSync.getTimestamp.bind(projectionSync),
    projectionSync.getTimestamp.bind(projectionSync), // Server-side snapshot
  );

  // Generate projection from cached snapshot using the synchronized timestamp.
  // useMemo ensures we only create a new projection object when values actually change,
  // maintaining referential equality for unchanged data (prevents unnecessary re-renders).
  const projectedData = useMemo(() => {
    if (!currentSnapshot) return null;

    const realtimeProjection = createRealtimeIndexingStatusProjection(currentSnapshot, projectedAt);

    return {
      responseCode: IndexingStatusResponseCodes.Ok,
      realtimeProjection,
    } as IndexingStatusResponse;
  }, [currentSnapshot, projectedAt]);

  if (projectedData) {
    return {
      ...queryResult,
      data: projectedData,
      isError: false,
      error: null,
    };
  }

  return queryResult;
}
