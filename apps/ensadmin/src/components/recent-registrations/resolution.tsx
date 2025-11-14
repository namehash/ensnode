import { useENSNodeConfig, useIndexingStatus, useRegistrarActions } from "@ensnode/ensnode-react";
import {
  IndexingStatusResponseCodes,
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  registrarActionsPrerequisites,
} from "@ensnode/ensnode-sdk";

import { useActiveNamespace } from "@/hooks/active/use-active-namespace";

import { DisplayRegistrarActionsPanel } from "./display-recent-registrations";
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
  const isRegistrarActionsApiSupported =
    ensNodeConfigQuery.isSuccess &&
    indexingStatusQuery.isSuccess &&
    indexingStatusQuery.data.responseCode === IndexingStatusResponseCodes.Ok
      ? registrarActionsPrerequisites.hasEnsIndexerConfigSupport(
          ensNodeConfigQuery.data.ensIndexerPublicConfig,
        ) &&
        registrarActionsPrerequisites.hasIndexingStatusSupport(
          indexingStatusQuery.data.realtimeProjection.snapshot.omnichainSnapshot.omnichainStatus,
        )
      : false;

  // Note: ENSNode Registrar Actions API is available only in certain cases.
  //       We use `canQueryRegistrarActions` function to enable query in those
  //        cases.
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
  if (!registrarActionsPrerequisites.hasEnsIndexerConfigSupport(ensIndexerPublicConfig)) {
    return {
      resolutionStatus: ResolutionStatusIds.UnsupportedConfig,
      requiredPlugins: registrarActionsPrerequisites.requiredPlugins,
    } satisfies RegistrarActionsUnsupportedConfig;
  }

  const { omnichainSnapshot } = indexingStatusQuery.data.realtimeProjection.snapshot;

  // resolution is temporarily not possible due to indexing status being not advanced enough
  if (!registrarActionsPrerequisites.hasIndexingStatusSupport(omnichainSnapshot.omnichainStatus)) {
    return {
      resolutionStatus: ResolutionStatusIds.IndexingStatusNotReady,
      supportedIndexingStatusIds: registrarActionsPrerequisites.supportedIndexingStatusIds,
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

interface ResolveAndDisplayRegistrarActionsPanelProps {
  maxItems: number;

  title: string;
}

/**
 * Resolves Registrar Actions through ENSNode and displays the Registrar Actions Panel.
 */
export function ResolveAndDisplayRegistrarActionsPanel({
  maxItems,
  title,
}: ResolveAndDisplayRegistrarActionsPanelProps) {
  const namespaceId = useActiveNamespace();
  const resolvedRegistrarActions = useFetchRegistrarActions({
    maxItems,
  });

  return (
    <DisplayRegistrarActionsPanel
      namespaceId={namespaceId}
      title={title}
      resolvedRegistrarActions={resolvedRegistrarActions}
    />
  );
}
