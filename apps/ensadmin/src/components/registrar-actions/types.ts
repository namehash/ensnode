import { NamedRegistrarAction, OmnichainIndexingStatusId } from "@ensnode/ensnode-sdk";

export const ResolutionStatusIds = {
  /**
   * Resolution hasn't been started yet, and the state of ENSNode is not known yet.
   */
  Initial: "initial",

  /**
   * Resolution cannot be started due to unsupported ENSNode Public Config.
   */
  UnsupportedConfig: "unsupportedConfig",

  /**
   * Resolution cannot be started due to Indexing Status not being ready yet.
   */
  IndexingStatusNotReady: "indexingStatusNotReady",

  /**
   * Resolution has not been completed.
   */
  Unresolved: "unresolved",

  /**
   * Resolution has been completed and results are unavailable due to an error.
   */
  Unavailable: "unavailable",

  /**
   * Resolution has been completed and results are available.
   */
  Available: "available",
} as const;

export type ResolutionStatusId = (typeof ResolutionStatusIds)[keyof typeof ResolutionStatusIds];

/**
 * Registrar Actions Initial
 *
 * Resolution hasn't been started yet, and the state of ENSNode is not known yet.
 *
 * Please note how this is a temporary and very brief status.
 */
export interface RegistrarActionsInitial {
  resolutionStatus: typeof ResolutionStatusIds.Initial;
}

/**
 * Registrar Actions Unsupported Config
 *
 * The ENSNode Public Config doesn't support use of the Registrar Action API.
 *
 * Please note how this is a permanent unavailability, not a temporary one.
 */
export interface RegistrarActionsUnsupportedConfig {
  resolutionStatus: typeof ResolutionStatusIds.UnsupportedConfig;
  requiredPlugins: ReadonlyArray<string>;
}

/**
 * Registrar Actions Indexing Status not ready
 *
 * The ENSNode Public Config supports use of the Registrar Action API,
 * but the Indexing Status is not progressed enough yet.
 *
 * Please note how this is a temporary unavailability, not a permanent one.
 */
export interface RegistrarActionsIndexingStatusNotReady {
  resolutionStatus: typeof ResolutionStatusIds.IndexingStatusNotReady;
  supportedIndexingStatusIds: ReadonlyArray<OmnichainIndexingStatusId>;
}

/**
 * Registrar Actions Unresolved
 *
 * Resolution has not completed yet.
 */
export interface RegistrarActionsUnresolved {
  resolutionStatus: typeof ResolutionStatusIds.Unresolved;
  placeholderCount: number;
}

/**
 * Registrar Actions Unavailable
 *
 * Resolution has ended with an error.
 */
export interface RegistrarActionsUnavailable {
  resolutionStatus: typeof ResolutionStatusIds.Unavailable;
  reason: string;
}

/**
 * Registrar Actions Available
 *
 * Resolution has ended successfully with, resolved data is available.
 */
export interface RegistrarActionsAvailable {
  resolutionStatus: typeof ResolutionStatusIds.Available;
  registrarActions: NamedRegistrarAction[];
}

export type ResolvedRegistrarActions =
  | RegistrarActionsInitial
  | RegistrarActionsUnsupportedConfig
  | RegistrarActionsIndexingStatusNotReady
  | RegistrarActionsUnresolved
  | RegistrarActionsUnavailable
  | RegistrarActionsAvailable;
