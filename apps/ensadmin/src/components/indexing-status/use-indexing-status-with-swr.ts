"use client";

import { useNow } from "@namehash/namehash-ui";
import { secondsToMilliseconds } from "date-fns";
import type { Duration } from "enssdk";
import { useCallback, useMemo } from "react";

import {
  createIndexingStatusQueryOptions,
  QueryParameter,
  useEnsNodeProviderOptions,
  type useIndexingStatus,
  useSwrQuery,
  WithEnsNodeProviderOptions,
} from "@ensnode/ensnode-react";
import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  type EnsApiIndexingStatusRequest,
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseOk,
  type EnsNodeStackInfo,
} from "@ensnode/ensnode-sdk";

const DEFAULT_REFETCH_INTERVAL = secondsToMilliseconds(10);

const REALTIME_PROJECTION_REFRESH_RATE: Duration = 1;

/**
 * Data model for the object cached in SWR for indexing status query results.
 */
interface CacheableIndexingStatus {
  /**
   * The snapshot of the Cross-Chain Indexing Status.
   */
  crossChainIndexingStatusSnapshot: CrossChainIndexingStatusSnapshotOmnichain;

  /**
   * Stack info of the connected ENSNode.
   */
  stackInfo: EnsNodeStackInfo;
}

interface UseIndexingStatusParameters
  extends EnsApiIndexingStatusRequest,
    QueryParameter<CacheableIndexingStatus> {}

/**
 * A proxy hook for {@link useIndexingStatus} which applies
 * stale-while-revalidate cache for successful responses.
 */
export function useIndexingStatusWithSwr(
  parameters: WithEnsNodeProviderOptions & UseIndexingStatusParameters = {},
) {
  const { options, query = {} } = parameters;
  const providerOptions = useEnsNodeProviderOptions(options);
  const now = useNow({ timeToRefresh: REALTIME_PROJECTION_REFRESH_RATE });

  const queryOptions = useMemo(
    () => createIndexingStatusQueryOptions(providerOptions),
    [providerOptions],
  );
  const queryKey = useMemo(() => ["swr", ...queryOptions.queryKey], [queryOptions.queryKey]);
  const queryFn = useCallback(
    async () =>
      queryOptions.queryFn().then(async (response) => {
        // An indexing status response was successfully fetched,
        // but the response code contained within the response was not 'ok'.
        // Therefore, throw an error to avoid caching this response.
        if (response.responseCode !== EnsApiIndexingStatusResponseCodes.Ok) {
          throw new Error(
            "Received Indexing Status response with responseCode other than 'ok' which will not be cached.",
          );
        }

        // The object including the Indexing Status snapshot, and the ENSApi Public Config,
        // has been fetched and successfully validated for caching.
        // Therefore, return it so that query cache for `queryOptions.queryKey` will:
        // - Replace the currently cached value (if any) with this new value.
        // - Return this non-null value.
        return {
          crossChainIndexingStatusSnapshot: response.realtimeProjection.snapshot,
          stackInfo: response.stackInfo,
        } satisfies CacheableIndexingStatus;
      }),
    [queryOptions.queryFn],
  );

  // Call select function to `createRealtimeIndexingStatusProjection` each time
  // `now` is updated.
  const select = useCallback(
    (cachedResult: CacheableIndexingStatus): EnsApiIndexingStatusResponseOk => {
      const realtimeProjection = createRealtimeIndexingStatusProjection(
        cachedResult.crossChainIndexingStatusSnapshot,
        now,
      );

      // Maintain the original response shape of `EnsApiIndexingStatusResponseOk`
      // for the consumers. Creating a new projection from the cached snapshot
      // each time `now` is updated should be implementation detail.
      return {
        responseCode: EnsApiIndexingStatusResponseCodes.Ok,
        realtimeProjection,
        stackInfo: cachedResult.stackInfo,
      } satisfies EnsApiIndexingStatusResponseOk;
    },
    [now],
  );

  return useSwrQuery({
    ...queryOptions,
    ...query,
    refetchInterval: query.refetchInterval ?? DEFAULT_REFETCH_INTERVAL, // Indexing status changes frequently
    enabled: query.enabled ?? queryOptions.enabled,
    queryKey,
    queryFn,
    select,
  });
}
