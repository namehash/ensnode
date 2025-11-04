import { useQuery } from "@tanstack/react-query";
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

  if (queryResult.data && queryResult.data.responseCode === IndexingStatusResponseCodes.Ok) {
    cachedSnapshotRef.current = queryResult.data.realtimeProjection.snapshot;
  }

  // If we have a cached snapshot and either:
  // 1. The query resulted in a network/fetch error, or
  // 2. The API returned an Error responseCode
  // Then generate a fresh realtime projection from the cached snapshot
  // instead of exposing the error to the UI.
  const shouldUseCachedSnapshot =
    cachedSnapshotRef.current &&
    (queryResult.isError || queryResult.data?.responseCode === IndexingStatusResponseCodes.Error);

  if (shouldUseCachedSnapshot) {
    const now = Math.floor(Date.now() / 1000);
    const syntheticRealtimeProjection = createRealtimeIndexingStatusProjection(
      cachedSnapshotRef.current!,
      now,
    );

    return {
      ...queryResult,
      data: {
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection: syntheticRealtimeProjection,
      } as IndexingStatusResponse,
      isError: false,
      error: null,
    };
  }

  return queryResult;
}
