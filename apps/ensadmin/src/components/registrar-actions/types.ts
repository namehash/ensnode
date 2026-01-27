import { NamedRegistrarAction, OmnichainIndexingStatusIdFinal } from "@ensnode/ensnode-sdk";

export const StatefulFetchStatusIds = {
  /**
   * Fetching hasn't started yet because a stateful ENSNode connection hasn't been created yet.
   */
  Connecting: "connecting",

  /**
   * Fetching is indefinitely disabled as the config of the stateful ENSNode connection doesn't support use of the Registrar Actions API.
   */
  Unsupported: "unsupported",

  /**
   * Fetching is temporarily disabled as the current Indexing Status doesn't support use of the Registrar Actions API yet.
   */
  NotReady: "notReady",

  /**
   * A fetch operation has been initiated that hasn't completed yet.
   */
  Loading: "loading",

  /**
   * Fetch completed with an error.
   */
  Error: "error",

  /**
   * Fetch successfully completed.
   */
  Loaded: "loaded",
} as const;

export type StatefulFetchStatusId =
  (typeof StatefulFetchStatusIds)[keyof typeof StatefulFetchStatusIds];

/**
 * Stateful Fetch Registrar Actions Connecting
 *
 * Fetching hasn't started yet because a stateful ENSNode connection hasn't been created yet.
 */
export interface StatefulFetchRegistrarActionsConnecting {
  fetchStatus: typeof StatefulFetchStatusIds.Connecting;
}

/**
 * Stateful Fetch Registrar Actions Unsupported
 *
 * Fetching is indefinitely disabled as the config of the stateful ENSNode connection doesn't support use of the Registrar Actions API.
 */
export interface StatefulFetchRegistrarActionsUnsupported {
  fetchStatus: typeof StatefulFetchStatusIds.Unsupported;
  requiredPlugins: ReadonlyArray<string>;
}

/**
 * Stateful Fetch Registrar Actions Not Ready
 *
 * Fetching is temporarily disabled as the current Indexing Status doesn't support use of the Registrar Actions API yet.
 */
export interface StatefulFetchRegistrarActionsNotReady {
  fetchStatus: typeof StatefulFetchStatusIds.NotReady;
  supportedIndexingStatusId: OmnichainIndexingStatusIdFinal;
}

/**
 * Stateful Fetch Registrar Actions Loading
 *
 * A fetch operation has been initiated that hasn't completed yet.
 */
export interface StatefulFetchRegistrarActionsLoading {
  fetchStatus: typeof StatefulFetchStatusIds.Loading;
  itemsPerPage: number;
}

/**
 * Stateful Fetch Registrar Actions Error
 *
 * Fetch completed with an error.
 */
export interface StatefulFetchRegistrarActionsError {
  fetchStatus: typeof StatefulFetchStatusIds.Error;
  reason: string;
}

/**
 * Stateful Fetch Registrar Actions Loaded
 *
 * Fetch successfully completed.
 */
export interface StatefulFetchRegistrarActionsLoaded {
  fetchStatus: typeof StatefulFetchStatusIds.Loaded;
  registrarActions: NamedRegistrarAction[];
}

export type StatefulFetchRegistrarActions =
  | StatefulFetchRegistrarActionsConnecting
  | StatefulFetchRegistrarActionsUnsupported
  | StatefulFetchRegistrarActionsNotReady
  | StatefulFetchRegistrarActionsLoading
  | StatefulFetchRegistrarActionsError
  | StatefulFetchRegistrarActionsLoaded;
