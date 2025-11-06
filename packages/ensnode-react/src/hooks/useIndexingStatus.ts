import { useQuery } from "@tanstack/react-query";
import { getUnixTime } from "date-fns";
import { useRef } from "react";

import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  type IndexingStatusRequest,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createIndexingStatusQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponse> {}

export function useIndexingStatus(
  parameters: WithSDKConfigParameter & UseIndexingStatusParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createIndexingStatusQueryOptions(_config);

  const cachedSnapshotRef = useRef<CrossChainIndexingStatusSnapshotOmnichain | null>(null);

  const options = {
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - indexing status changes frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  const queryResult = useQuery(options);

  // Store the latest snapshot in memory whenever we get a successful response.
  // Each incremental snapshot will have >= indexing progress than previous snapshots.
  if (queryResult.data && queryResult.data.responseCode === IndexingStatusResponseCodes.Ok) {
    cachedSnapshotRef.current = queryResult.data.realtimeProjection.snapshot;
  }

  // If we have a cached snapshot, always build a fresh projection from it.
  //
  // Clients often need frequently updated worst-case distance for their logic,
  // but calling the API every second would be inefficient. Instead, we fetch an
  // updated snapshot every X seconds (here X=10) and keep it in memory.
  //
  // From that cached snapshot, we can continuously generate new projections —
  // entirely in memory — that stay up to date as time moves forward. Each
  // projection recalculates worst-case distance based on:
  //   The current time
  //   The snapshot's absolute timestamps and recorded indexing progress
  //
  // This works reliably because indexing progress is always non-decreasing over
  // time (never goes backward). Clients can safely assume that a snapshot from a
  // few seconds ago is still valid for building new projections. Since snapshots
  // use absolute timestamps, we can compute accurate projections and worst-case
  // distances without additional API calls.
  if (cachedSnapshotRef.current) {
    const projectedAt = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(
      cachedSnapshotRef.current,
      projectedAt,
    );

    return {
      ...queryResult,
      data: {
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection,
      } as IndexingStatusResponse,
      isError: false,
      error: null,
    };
  }

  return queryResult;
}
