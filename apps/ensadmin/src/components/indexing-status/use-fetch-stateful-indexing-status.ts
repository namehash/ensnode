import { useCallback, useMemo } from "react";

import {
  QueryParameter,
  useENSNodeSDKConfig,
  useIndexingStatus,
  useSwrQuery,
  WithSDKConfigParameter,
} from "@ensnode/ensnode-react";
import {
  IndexingStatusRequest,
  IndexingStatusResponse,
  IndexingStatusResponseCodes,
} from "@ensnode/ensnode-sdk";

import {
  StatefulFetchIndexingStatusConnecting,
  StatefulFetchIndexingStatusError,
  StatefulFetchIndexingStatusLoaded,
  StatefulFetchIndexingStatusLoading,
  StatefulFetchStatusIds,
} from "./types";

interface UseStatefulFetchIndexingStatusParameters
  extends IndexingStatusRequest,
    QueryParameter<IndexingStatusResponse> {}

export function useStatefulFetchIndexingStatus(
  parameters: WithSDKConfigParameter & UseStatefulFetchIndexingStatusParameters = {},
) {
  const { client } = useENSNodeSDKConfig(parameters.config);

  const { refetch: refetchIndexingStatus } = useIndexingStatus({
    ...parameters,
    query: {
      ...parameters.query,
      enabled: false,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  const cachedQueryFn = useCallback(async () => {
    const { status, data, error } = await refetchIndexingStatus();

    if (status === "error") {
      throw new Error(error.message);
    }

    if (status === "success") {
      if (data.responseCode === IndexingStatusResponseCodes.Error) {
        throw new Error("Not well done");
      }

      return data;
    }

    throw new Error(`Unexpected '${status}' status of indexingStatus query`);
  }, [refetchIndexingStatus]);

  const cachedIndexingStatus = useSwrQuery({
    ...parameters.query,
    queryKey: ["ensnode", client.url, "indexing-status", "cached"],
    queryFn: cachedQueryFn,
    retry: 2,
  });
  const memoizedResult = useMemo(() => {
    if (cachedIndexingStatus.isFetched && cachedIndexingStatus.isPending) {
      return {
        fetchStatus: StatefulFetchStatusIds.Loading,
      } satisfies StatefulFetchIndexingStatusLoading;
    }

    if (cachedIndexingStatus.isPending) {
      return {
        fetchStatus: StatefulFetchStatusIds.Connecting,
      } satisfies StatefulFetchIndexingStatusConnecting;
    }

    if (cachedIndexingStatus.isLoading) {
      return {
        fetchStatus: StatefulFetchStatusIds.Loading,
      } satisfies StatefulFetchIndexingStatusLoading;
    }

    if (cachedIndexingStatus.isError) {
      return {
        fetchStatus: StatefulFetchStatusIds.Error,
        reason: cachedIndexingStatus.error.message,
      } satisfies StatefulFetchIndexingStatusError;
    }

    if (cachedIndexingStatus.data.responseCode === IndexingStatusResponseCodes.Error) {
      return {
        fetchStatus: StatefulFetchStatusIds.Error,
        reason: `It Appears that the indexing of new blocks has been interrupted. API requests to this ENSNode should continue working successfully but may serve data that isn't updated to the latest onchain state.`,
      } satisfies StatefulFetchIndexingStatusError;
    }

    return {
      fetchStatus: StatefulFetchStatusIds.Loaded,
      realtimeProjection: cachedIndexingStatus.data.realtimeProjection,
    } satisfies StatefulFetchIndexingStatusLoaded;
  }, [
    cachedIndexingStatus.data,
    cachedIndexingStatus.isFetched,
    cachedIndexingStatus.isPending,
    cachedIndexingStatus.isError,
    cachedIndexingStatus.data?.responseCode,
  ]);
  return memoizedResult;
}
