import { useENSNodeConfig, useIndexingStatus, useRegistrarActions } from "@ensnode/ensnode-react";
import {
  IndexingStatusResponseCodes,
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  registrarActionsPrerequisites,
} from "@ensnode/ensnode-sdk";

import { useStatefulFetchIndexingStatus } from "@/components/indexing-status/use-fetch-stateful-indexing-status";

import {
  StatefulFetchRegistrarActions,
  StatefulFetchRegistrarActionsConnecting,
  StatefulFetchRegistrarActionsError,
  StatefulFetchRegistrarActionsLoaded,
  StatefulFetchRegistrarActionsLoading,
  StatefulFetchRegistrarActionsNotReady,
  StatefulFetchRegistrarActionsUnsupported,
  StatefulFetchStatusIds,
} from "./types";

interface UseStatefulRegistrarActionsProps {
  itemsPerPage: number;
}

const {
  hasEnsIndexerConfigSupport,
  hasIndexingStatusSupport,
  requiredPlugins,
  supportedIndexingStatusIds,
} = registrarActionsPrerequisites;

/**
 * Use Stateful Registrar Actions
 *
 * This hook uses other hooks to interact with ENSNode APIs and build
 * a "stateful" data model around fetching Registrar Actions in relation to the state of the connected ENSNode instance.
 */
export function useStatefulRegistrarActions({
  itemsPerPage,
}: UseStatefulRegistrarActionsProps): StatefulFetchRegistrarActions {
  const ensNodeConfigQuery = useENSNodeConfig();
  const indexingStatusQuery = useStatefulFetchIndexingStatus();

  let isRegistrarActionsApiSupported = false;

  if (ensNodeConfigQuery.isSuccess && indexingStatusQuery.fetchStatus === "loaded") {
    const { ensIndexerPublicConfig } = ensNodeConfigQuery.data;
    const { omnichainSnapshot } = indexingStatusQuery.realtimeProjection.snapshot;

    isRegistrarActionsApiSupported =
      hasEnsIndexerConfigSupport(ensIndexerPublicConfig) &&
      hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus);
  }

  // Note: ENSNode Registrar Actions API is available only in certain cases.
  //       We use `isRegistrarActionsApiSupported` to enable query in those cases.
  const registrarActionsQuery = useRegistrarActions({
    order: RegistrarActionsOrders.LatestRegistrarActions,
    itemsPerPage,
    query: {
      enabled: isRegistrarActionsApiSupported,
    },
  });

  // ENSNode config is not fetched yet, so wait in the initial status
  if (
    !ensNodeConfigQuery.isFetched ||
    indexingStatusQuery.fetchStatus === "connecting" ||
    indexingStatusQuery.fetchStatus === "loading"
  ) {
    return {
      fetchStatus: StatefulFetchStatusIds.Connecting,
    } satisfies StatefulFetchRegistrarActionsConnecting;
  }

  // ENSNode config fetched as error
  if (!ensNodeConfigQuery.isSuccess) {
    return {
      fetchStatus: StatefulFetchStatusIds.Error,
      reason: "ENSNode config could not be fetched successfully",
    } satisfies StatefulFetchRegistrarActionsError;
  }

  // Indexing Status fetched as error
  if (indexingStatusQuery.fetchStatus === "error") {
    return {
      fetchStatus: StatefulFetchStatusIds.Error,
      reason: "Indexing Status could not be fetched successfully",
    } satisfies StatefulFetchRegistrarActionsError;
  }

  const { ensIndexerPublicConfig } = ensNodeConfigQuery.data;

  // fetching is indefinitely not possible due to unsupported ENSNode config
  if (!hasEnsIndexerConfigSupport(ensIndexerPublicConfig)) {
    return {
      fetchStatus: StatefulFetchStatusIds.Unsupported,
      requiredPlugins,
    } satisfies StatefulFetchRegistrarActionsUnsupported;
  }

  const { omnichainSnapshot } = indexingStatusQuery.realtimeProjection.snapshot;

  // fetching is temporarily not possible due to indexing status being not advanced enough
  if (!hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus)) {
    return {
      fetchStatus: StatefulFetchStatusIds.NotReady,
      supportedIndexingStatusIds,
    } satisfies StatefulFetchRegistrarActionsNotReady;
  }

  // fetching has not been completed
  if (registrarActionsQuery.isPending || registrarActionsQuery.isLoading) {
    return {
      fetchStatus: StatefulFetchStatusIds.Loading,
      itemsPerPage,
    } satisfies StatefulFetchRegistrarActionsLoading;
  }

  // fetching has been completed with an error
  if (registrarActionsQuery.isLoadingError || registrarActionsQuery.isError) {
    return {
      fetchStatus: StatefulFetchStatusIds.Error,
      reason: registrarActionsQuery.error.message,
    } satisfies StatefulFetchRegistrarActionsError;
  }

  // fetching has been completed successfully but server returned error response
  if (registrarActionsQuery.data.responseCode === RegistrarActionsResponseCodes.Error) {
    return {
      fetchStatus: StatefulFetchStatusIds.Error,
      reason: registrarActionsQuery.data.error.message,
    } satisfies StatefulFetchRegistrarActionsError;
  }

  // fetching has been completed successfully, server returned OK response
  return {
    fetchStatus: StatefulFetchStatusIds.Loaded,
    registrarActions: registrarActionsQuery.data.registrarActions,
  } satisfies StatefulFetchRegistrarActionsLoaded;
}
