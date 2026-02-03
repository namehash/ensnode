import type { ReferralProgramRules } from "./rules";

/**
 * Referral program cycle identifiers.
 *
 * Each cycle represents a distinct referral program period with its own
 * rules, leaderboard, and award distribution.
 */
export const ReferralProgramCycleIds = {
  /** ENS Holiday Awards December 2025 */
  Cycle1: "cycle-1",
  /** March 2026 */
  Cycle2: "cycle-2",
} as const;

/**
 * Referral program cycle identifier.
 *
 * Can be either a predefined cycle ID (e.g., "cycle-1", "cycle-2") or a custom cycle ID.
 * The type provides autocomplete for known cycle IDs while accepting any string for custom cycles.
 */
export type ReferralProgramCycleId =
  | (typeof ReferralProgramCycleIds)[keyof typeof ReferralProgramCycleIds]
  | (string & {});

/**
 * Array of all valid referral program cycle IDs.
 */
export const ALL_REFERRAL_PROGRAM_CYCLE_IDS: ReferralProgramCycleId[] =
  Object.values(ReferralProgramCycleIds);

/**
 * Type guard to check if a string is a predefined {@link ReferralProgramCycleId}.
 *
 * Note: This only checks for predefined cycle IDs (e.g., "cycle-1", "cycle-2").
 * Custom cycle IDs loaded from CUSTOM_REFERRAL_PROGRAM_CYCLES are valid
 * ReferralProgramCycleIds but won't pass this check.
 *
 * @param value - The string value to check
 * @returns true if the value is a predefined cycle ID
 */
export const isPredefinedCycleId = (value: string): value is ReferralProgramCycleId =>
  ALL_REFERRAL_PROGRAM_CYCLE_IDS.includes(value as ReferralProgramCycleId);

/**
 * Represents a referral program cycle with its configuration and rules.
 */
export interface ReferralProgramCycle {
  /**
   * Unique identifier for the cycle.
   */
  id: ReferralProgramCycleId;

  /**
   * Human-readable display name for the cycle.
   * @example "ENS Holiday Awards"
   */
  displayName: string;

  /**
   * The rules that govern this referral program cycle.
   */
  rules: ReferralProgramRules;

  /**
   * URL to the full rules document for this cycle.
   * @example "https://ensawards.org/ens-holiday-awards-rules"
   */
  rulesUrl: string;
}

/**
 * A map from cycle ID to cycle definition.
 *
 * Used to store and look up all configured referral program cycles.
 */
export type ReferralProgramCycleSet = Map<ReferralProgramCycleId, ReferralProgramCycle>;
