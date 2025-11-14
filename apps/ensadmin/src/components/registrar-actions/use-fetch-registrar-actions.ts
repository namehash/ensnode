import { useENSNodeConfig, useIndexingStatus, useRegistrarActions } from "@ensnode/ensnode-react";
import {
  IndexingStatusResponseCodes,
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  registrarActionsPrerequisites,
} from "@ensnode/ensnode-sdk";

import {
  RegistrarActionsAvailable,
  RegistrarActionsIndexingStatusNotReady,
  RegistrarActionsInitial,
  RegistrarActionsUnavailable,
  RegistrarActionsUnresolved,
  RegistrarActionsUnsupportedConfig,
  ResolutionStatusIds,
  ResolvedRegistrarActions,
} from "./types";

interface UseFetchRegistrarActionsProps {
  maxItems: number;
}

const {
  hasEnsIndexerConfigSupport,
  hasIndexingStatusSupport,
  requiredPlugins,
  supportedIndexingStatusIds,
} = registrarActionsPrerequisites;

/**
 * Use Fetch Registrar Actions
 *
 * This hook uses other hooks to interact with ENSNode APIs and build
 * a simple data model around fetching Registrar Actions.
 */
export function useFetchRegistrarActions({
  maxItems,
}: UseFetchRegistrarActionsProps): ResolvedRegistrarActions {
  const ensNodeConfigQuery = useENSNodeConfig();
  const indexingStatusQuery = useIndexingStatus();

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
    limit: maxItems,
    query: {
      enabled: isRegistrarActionsApiSupported,
    },
  });

  // ENSNode config is not fetched yet, so wait in the initial status
  if (!ensNodeConfigQuery.isFetched || !indexingStatusQuery.isFetched) {
    return {
      resolutionStatus: ResolutionStatusIds.Initial,
    } satisfies RegistrarActionsInitial;
  }

  // ENSNode config fetched as error
  if (!ensNodeConfigQuery.isSuccess) {
    return {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: "ENSNode config could not be fetched successfully",
    } satisfies RegistrarActionsUnavailable;
  }

  // Indexing Status fetched as error
  if (
    !indexingStatusQuery.isSuccess ||
    indexingStatusQuery.data.responseCode === IndexingStatusResponseCodes.Error
  ) {
    return {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: "Indexing Status could not be fetched successfully",
    } satisfies RegistrarActionsUnavailable;
  }

  const { ensIndexerPublicConfig } = ensNodeConfigQuery.data;

  // resolution is permanently not possible due to unsupported ENSNode config
  if (!hasEnsIndexerConfigSupport(ensIndexerPublicConfig)) {
    return {
      resolutionStatus: ResolutionStatusIds.UnsupportedConfig,
      requiredPlugins,
    } satisfies RegistrarActionsUnsupportedConfig;
  }

  const { omnichainSnapshot } = indexingStatusQuery.data.realtimeProjection.snapshot;

  // resolution is temporarily not possible due to indexing status being not advanced enough
  if (!hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus)) {
    return {
      resolutionStatus: ResolutionStatusIds.IndexingStatusNotReady,
      supportedIndexingStatusIds,
    } satisfies RegistrarActionsIndexingStatusNotReady;
  }

  // resolution has not been completed
  if (registrarActionsQuery.isPending || registrarActionsQuery.isLoading) {
    return {
      resolutionStatus: ResolutionStatusIds.Unresolved,
      placeholderCount: maxItems,
    } satisfies RegistrarActionsUnresolved;
  }

  // resolution has been completed with an error
  if (registrarActionsQuery.isLoadingError || registrarActionsQuery.isError) {
    return {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: registrarActionsQuery.error.message,
    } satisfies RegistrarActionsUnavailable;
  }

  // resolution has been completed successfully but server returned error response
  if (registrarActionsQuery.data.responseCode === RegistrarActionsResponseCodes.Error) {
    return {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: registrarActionsQuery.data.error.message,
    } satisfies RegistrarActionsUnavailable;
  }

  // resolution has been completed successfully, server returned OK response
  return {
    resolutionStatus: ResolutionStatusIds.Available,
    registrarActions: registrarActionsQuery.data.registrarActions,
  } satisfies RegistrarActionsAvailable;
}
