import {
  buildCanQueryRegistrarActionsArgs,
  canQueryRegistrarActions,
  useENSNodeConfig,
  useIndexingStatus,
  useRegistrarActions,
} from "@ensnode/ensnode-react";
import { RegistrarActionsOrders, RegistrarActionsResponseCodes } from "@ensnode/ensnode-sdk";

import { DisplayRecentRegistrations } from "./display-recent-registrations";
import {
  RecentRegistrationsAvailable,
  RecentRegistrationsDisabled,
  RecentRegistrationsUnavailable,
  RecentRegistrationsUnresolved,
  ResolutionStatusIds,
  ResolvedRecentRegistrations,
} from "./types";

interface UseResolveRecentRegistrationsProps {
  maxItems: number;
}

/**
 * Use Resolve Recent Registrations
 *
 * This hook uses other hooks to interact with ENSNode APIs and build
 * a simple data model around Recent Registrations Resolution.
 */
export function useResolveRecentRegistrations({
  maxItems,
}: UseResolveRecentRegistrationsProps): ResolvedRecentRegistrations {
  const ensNodeConfigQuery = useENSNodeConfig();
  const indexingStatusQuery = useIndexingStatus();

  // Note: ENSNode Registrar Actions API is available only in certain cases.
  //       We use `canQueryRegistrarActions` function to enable query in those
  //        cases.
  const registrarActionsQuery = useRegistrarActions({
    order: RegistrarActionsOrders.LatestRegistrarActions,
    limit: maxItems,
    query: {
      enabled: canQueryRegistrarActions(
        buildCanQueryRegistrarActionsArgs(ensNodeConfigQuery, indexingStatusQuery),
      ),
    },
  });

  // resolution is disabled
  if (!registrarActionsQuery.isEnabled) {
    return {
      resolutionStatus: ResolutionStatusIds.Disabled,
    } satisfies RecentRegistrationsDisabled;
  }

  // resolution has not been completed
  if (registrarActionsQuery.isPending || registrarActionsQuery.isLoading) {
    return {
      resolutionStatus: ResolutionStatusIds.Unresolved,
      placeholderCount: maxItems,
    } satisfies RecentRegistrationsUnresolved;
  }

  // resolution has been completed with an error
  if (registrarActionsQuery.isLoadingError || registrarActionsQuery.isError) {
    return {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: registrarActionsQuery.error.message,
    } satisfies RecentRegistrationsUnavailable;
  }

  // resolution has been completed successfully but server returned error response
  if (registrarActionsQuery.data.responseCode === RegistrarActionsResponseCodes.Error) {
    return {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: registrarActionsQuery.data.error.message,
    } satisfies RecentRegistrationsUnavailable;
  }

  // resolution has been completed successfully, server returned OK response
  return {
    resolutionStatus: ResolutionStatusIds.Available,
    registrarActions: registrarActionsQuery.data.registrarActions,
  } satisfies RecentRegistrationsAvailable;
}

interface ResolveAndDisplayRecentRegistrationsProps {
  maxItems: number;

  title: string;
}

/**
 * Resolves the Recent Registrations through ENSNode and displays the result.
 */
export function ResolveAndDisplayRecentRegistrations({
  maxItems,
  title,
}: ResolveAndDisplayRecentRegistrationsProps) {
  const resolvedRecentRegistrations = useResolveRecentRegistrations({
    maxItems,
  });

  return (
    <DisplayRecentRegistrations
      title={title}
      resolvedRecentRegistrations={resolvedRecentRegistrations}
    />
  );
}
