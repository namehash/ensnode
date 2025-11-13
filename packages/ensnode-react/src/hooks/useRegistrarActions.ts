import { type QueryObserverResult, useQuery } from "@tanstack/react-query";

import {
  type ConfigResponse,
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  PluginName,
  type RegistrarActionsRequest,
  type RegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { createRegistrarActionsQueryOptions } from "../utils/query";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";

interface UseRegistrarActionsParameters
  extends RegistrarActionsRequest,
    QueryParameter<RegistrarActionsResponse> {}

/**
 * Use Registration Actions hook
 *
 * Query ENSNode Registrar Actions API.
 */
export function useRegistrarActions(
  parameters: WithSDKConfigParameter & UseRegistrarActionsParameters = {},
) {
  const { config, query = {} } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const queryOptions = createRegistrarActionsQueryOptions(_config, parameters);

  const options = {
    ...queryOptions,
    refetchInterval: 10 * 1000, // 10 seconds - latest registrations and renewals change frequently
    ...query,
    enabled: query.enabled ?? queryOptions.enabled,
  };

  return useQuery(options);
}

interface CanQueryRegistrarActionsArgs {
  activePlugins: string[];
  omnichainIndexingStatus: OmnichainIndexingStatusId;
}

/**
 * Can client send a Registrar Actions API query to the ENSNode instance?
 *
 * @param activePlugins a list of plugins active for the ENSNode.
 * @param omnichainIndexingStatus  the omnichain indexing status of the ENSNode.
 * @returns a results telling if querying the Registrar Actions API is
 *          possible for given ENSNode state.
 */
export function canQueryRegistrarActions(args: CanQueryRegistrarActionsArgs | undefined) {
  // cannot query if the args are not ready
  if (typeof args === "undefined") {
    return false;
  }

  /**
   * Required plugins to enable Registrar Actions API routes.
   *
   * 1. `registrars` plugin is required so that data in the `registrarActions`
   *    table is populated.
   * 2. `subgraph`, `basenames`, and `lineanames` are required to get the data
   *    for the name associated with each registrar action.
   * 3. In theory not all of `subgraph`, `basenames`, and `lineanames` plugins
   *    might be required. Ex: At least one, but the current logic in
   *    the `registrars` plugin always indexes registrar actions across
   *    Ethnames (subgraph), Basenames, and Lineanames and therefore we need to
   *    ensure each value in the registrar actions table has
   *    an associated record in the domains table.
   */
  const requiredPlugins = [
    PluginName.Subgraph,
    PluginName.Basenames,
    PluginName.Lineanames,
    PluginName.Registrars,
  ] as const;

  const enabledByActivePlugins = requiredPlugins.every((plugin) =>
    args.activePlugins.includes(plugin),
  );
  const enabledByOmnichainIndexingStatus =
    args.omnichainIndexingStatus === OmnichainIndexingStatusIds.Completed ||
    args.omnichainIndexingStatus === OmnichainIndexingStatusIds.Following;

  // Querying registrar actions only makes sense when
  // - all required plugins are active, AND
  // - the omnichain indexing status is either 'completed' or 'following'.
  // Otherwise, ENSApi would return 500 error.
  return enabledByActivePlugins && enabledByOmnichainIndexingStatus;
}

/**
 * Builds arguments for {@link canQueryRegistrarActions} function from
 * provided ENSNode Config Query and Indexing Status Query.
 */
export function buildCanQueryRegistrarActionsArgs(
  ensNodeConfigQuery: QueryObserverResult<ConfigResponse>,
  indexingStatusQuery: QueryObserverResult<IndexingStatusResponse>,
): CanQueryRegistrarActionsArgs | undefined {
  let activePlugins: string[] | undefined;
  let omnichainIndexingStatus: OmnichainIndexingStatusId | undefined;

  if (ensNodeConfigQuery.status === "success") {
    // set active plugins when they ENSIndexer Public Config is known
    activePlugins = ensNodeConfigQuery.data.ensIndexerPublicConfig.plugins;
  }

  if (
    indexingStatusQuery.status === "success" &&
    indexingStatusQuery.data.responseCode === IndexingStatusResponseCodes.Ok
  ) {
    // set omnichain indexing status when Indexing Status is known and OK
    omnichainIndexingStatus =
      indexingStatusQuery.data.realtimeProjection.snapshot.omnichainSnapshot.omnichainStatus;
  }

  // return undefined if any of the response props remains unknown
  if (typeof activePlugins === "undefined" || typeof omnichainIndexingStatus === "undefined") {
    return undefined;
  }

  // otherwise, return built args object
  return {
    activePlugins,
    omnichainIndexingStatus,
  };
}
