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

const DEFAULT_REFETCH_INTERVAL = 3 * 1000;

interface UseIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponseOk> {}

/**
 * A proxy hook for {@link useIndexingStatus} which applies
 * stale-while-revalidate cache for successfully resolved responses.
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
      queryOptions.queryFn().then((response) => {
        // reject response with 'error' responseCode
        if (response.responseCode === IndexingStatusResponseCodes.Error) {
          throw new Error(
            "Received Indexing Status response with 'error' responseCode which will not be cached.",
          );
        }

        // resolve response to be cached
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
