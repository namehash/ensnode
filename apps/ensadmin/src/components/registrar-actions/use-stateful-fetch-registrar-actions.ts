import { useENSNodeConfig, useRegistrarActions } from "@ensnode/ensnode-react";
import {
  hasRegistrarActionsConfigSupport,
  hasRegistrarActionsIndexingStatusSupport,
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  registrarActionsRequiredPlugins,
  registrarActionsSupportedIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

import { useIndexingStatusWithSwr } from "@/components/indexing-status";
import { useENSAdminFeatures } from "@/hooks/active/use-ensadmin-features";

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

/**
 * Use Stateful Registrar Actions
 *
 * This hook uses other hooks to interact with ENSNode APIs and build
 * a "stateful" data model around fetching Registrar Actions in relation to the state of the connected ENSNode instance.
 */
export function useStatefulRegistrarActions({
  itemsPerPage,
}: UseStatefulRegistrarActionsProps): StatefulFetchRegistrarActions {
  const { registrarActions: status } = useENSAdminFeatures();

  const registrarActionsQuery = useRegistrarActions({
    order: RegistrarActionsOrders.LatestRegistrarActions,
    recordsPerPage: itemsPerPage,
    // NOTE: because the Registrar Actions API is conditionally available, we only fetch if supported
    query: { enabled: status.type === "supported" },
  });

  switch (status.type) {
    case "connecting":
      return {
        fetchStatus: StatefulFetchStatusIds.Connecting,
      } satisfies StatefulFetchRegistrarActionsConnecting;

    case "error":
      return {
        fetchStatus: StatefulFetchStatusIds.Error,
        reason: status.reason,
      } satisfies StatefulFetchRegistrarActionsError;

    case "not-ready":
      return {
        fetchStatus: StatefulFetchStatusIds.NotReady,
        supportedIndexingStatusIds: registrarActionsSupportedIndexingStatusIds,
      } satisfies StatefulFetchRegistrarActionsNotReady;

    case "unsupported":
      return {
        fetchStatus: StatefulFetchStatusIds.Unsupported,
        requiredPlugins: registrarActionsRequiredPlugins,
      } satisfies StatefulFetchRegistrarActionsUnsupported;

    case "supported":
      break; // continue to query status handling below
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
