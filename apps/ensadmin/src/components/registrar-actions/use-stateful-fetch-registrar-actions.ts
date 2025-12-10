import { useENSNodeConfig, useRegistrarActions } from "@ensnode/ensnode-react";
import {
  IndexingStatusResponseCodes,
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  registrarActionsPrerequisites,
} from "@ensnode/ensnode-sdk";

import { useIndexingStatusWithSwr } from "@/components/indexing-status";

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
  const indexingStatusQuery = useIndexingStatusWithSwr();

  let isRegistrarActionsApiSupported = false;

  if (
    ensNodeConfigQuery.isSuccess &&
    indexingStatusQuery.isSuccess &&
    indexingStatusQuery.data.responseCode === IndexingStatusResponseCodes.Ok
  ) {
    const { ensIndexerPublicConfig } = ensNodeConfigQuery.data;
    const { omnichainSnapshot } = indexingStatusQuery.data.realtimeProjection.snapshot;

    isRegistrarActionsApiSupported =
      hasEnsIndexerConfigSupport(ensIndexerPublicConfig) &&
      hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus);
  }

  // Note: ENSNode Registrar Actions API is available only in certain cases.
  //       We use `isRegistrarActionsApiSupported` to enable query in those cases.
  const registrarActionsQuery = useRegistrarActions({
    order: RegistrarActionsOrders.LatestRegistrarActions,
    recordsPerPage: itemsPerPage,
    query: {
      enabled: isRegistrarActionsApiSupported,
    },
  });

  // ENSNode config is not fetched yet, so wait in the initial status
  if (ensNodeConfigQuery.isPending || indexingStatusQuery.isPending) {
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
  if (!indexingStatusQuery.isSuccess) {
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

  const { omnichainSnapshot } = indexingStatusQuery.data.realtimeProjection.snapshot;

  // fetching is temporarily not possible due to indexing status being not advanced enough
  if (!hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus)) {
    return {
      fetchStatus: StatefulFetchStatusIds.NotReady,
      supportedIndexingStatusIds,
    } satisfies StatefulFetchRegistrarActionsNotReady;
  }

  // fetching has not been completed
  if (registrarActionsQuery.isPending) {
    return {
      fetchStatus: StatefulFetchStatusIds.Loading,
      itemsPerPage,
    } satisfies StatefulFetchRegistrarActionsLoading;
  }

  // fetching has been completed with an error
  if (registrarActionsQuery.isError) {
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
