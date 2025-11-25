"use client";

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
  type IndexingStatusRequest,
  IndexingStatusResponseCodes,
  IndexingStatusResponseOk,
} from "@ensnode/ensnode-sdk";

const DEFAULT_REFETCH_INTERVAL = 10 * 1000;

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponseOk> {}

/**
 * A proxy hook for {@link useIndexingStatus} which applies
 * stale-while-revalidate cache for successful responses.
 */
export function useIndexingStatusWithSwr(
  parameters: WithSDKConfigParameter & UseIndexingStatusParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

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

        // successful response to be cached
        return response;
      }),
    [queryOptions.queryFn],
  );

  return useSwrQuery({
    ...queryOptions,
    refetchInterval: query.refetchInterval ?? DEFAULT_REFETCH_INTERVAL, // Indexing status changes frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
    queryKey,
    queryFn,
  });
}
