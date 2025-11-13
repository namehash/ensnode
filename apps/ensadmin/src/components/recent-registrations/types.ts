import { NamedRegistrarAction } from "@ensnode/ensnode-sdk";

export const ResolutionStatusIds = {
  /**
   * Resolution cannot be started due to missing prerequisites.
   */
  Disabled: "disabled",

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
 * Recent Registrations Disabled
 *
 * Resolution cannot be started yet.
 */
export interface RecentRegistrationsDisabled {
  resolutionStatus: typeof ResolutionStatusIds.Disabled;
}

/**
 * Recent Registrations Unresolved
 *
 * Resolution has not completed yet.
 */
export interface RecentRegistrationsUnresolved {
  resolutionStatus: typeof ResolutionStatusIds.Unresolved;
  placeholderCount: number;
}

/**
 * Recent Registrations Unavailable
 *
 * Resolution has ended with an error.
 */
export interface RecentRegistrationsUnavailable {
  resolutionStatus: typeof ResolutionStatusIds.Unavailable;
  reason: string;
}

/**
 * Recent Registrations Available
 *
 * Resolution has ended successfully with, resolved data is available.
 */
export interface RecentRegistrationsAvailable {
  resolutionStatus: typeof ResolutionStatusIds.Available;
  registrarActions: NamedRegistrarAction[];
}

export type ResolvedRecentRegistrations =
  | RecentRegistrationsDisabled
  | RecentRegistrationsUnresolved
  | RecentRegistrationsUnavailable
  | RecentRegistrationsAvailable;
