"use client";

import { useNow } from "@namehash/namehash-ui";
import { secondsToMilliseconds } from "date-fns";
import { useCallback, useMemo } from "react";

import {
  createIndexingStatusQueryOptions,
  QueryParameter,
  useENSNodeSDKConfig,
  type useIndexingStatus,
  useSwrQuery,
  WithSDKConfigParameter,
} from "@ensnode/ensnode-react";
import {
  CrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  Duration,
  type IndexingStatusRequest,
  IndexingStatusResponseCodes,
  IndexingStatusResponseOk,
} from "@ensnode/ensnode-sdk";

const DEFAULT_REFETCH_INTERVAL = secondsToMilliseconds(10);

const REALTIME_PROJECTION_REFRESH_RATE: Duration = 1;

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<CrossChainIndexingStatusSnapshotOmnichain> {}

/**
 * A proxy hook for {@link useIndexingStatus} which applies
 * stale-while-revalidate cache for successful responses.
 */
export function useIndexingStatusWithSwr(
  parameters: WithSDKConfigParameter & UseIndexingStatusParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);
  const now = useNow({ timeToRefresh: REALTIME_PROJECTION_REFRESH_RATE });

  const queryOptions = useMemo(() => createIndexingStatusQueryOptions(_config), [_config]);
  const queryKey = useMemo(() => ["swr", ...queryOptions.queryKey], [queryOptions.queryKey]);
  const queryFn = useCallback(
    async () =>
      queryOptions.queryFn().then(async (response) => {
        // An indexing status response was successfully fetched,
        // but the response code contained within the response was not 'ok'.
        // Therefore, throw an error to avoid caching this response.
        if (response.responseCode !== IndexingStatusResponseCodes.Ok) {
          throw new Error(
            "Received Indexing Status response with responseCode other than 'ok' which will not be cached.",
          );
        }

        // The indexing status snapshot has been fetched and successfully validated for caching.
        // Therefore, return it so that query cache for `queryOptions.queryKey` will:
        // - Replace the currently cached value (if any) with this new value.
        // - Return this non-null value.
        return response.realtimeProjection.snapshot;
      }),
    [queryOptions.queryFn],
  );

  // Call select function to `createRealtimeIndexingStatusProjection` each time
  // `now` is updated.
  const select = useCallback(
    (cachedSnapshot: CrossChainIndexingStatusSnapshotOmnichain): IndexingStatusResponseOk => {
      const realtimeProjection = createRealtimeIndexingStatusProjection(cachedSnapshot, now);

      // Maintain the original response shape of `IndexingStatusResponse`
      // for the consumers. Creating a new projection from the cached snapshot
      // each time `now` is updated should be implementation detail.
      return {
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection,
      } satisfies IndexingStatusResponseOk;
    },
    [now],
  );

  return useSwrQuery({
    ...queryOptions,
    refetchInterval: query.refetchInterval ?? DEFAULT_REFETCH_INTERVAL, // Indexing status changes frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
    queryKey,
    queryFn,
    select,
  });
}
