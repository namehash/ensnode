import type { ReferralProgramRules } from "./rules";

/**
 * Referral program cycle slug.
 *
 * A URL-safe identifier for a referral program cycle. Each cycle represents
 * a distinct referral program period with its own rules, leaderboard, and
 * award distribution.
 *
 * @invariant Must contain only lowercase letters (a-z), digits (0-9), and hyphens (-).
 *            Must not start or end with a hyphen. Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
 *
 * @example "2025-12" // December 2025 cycle
 * @example "2026-03" // March 2026 cycle
 * @example "holiday-special" // Custom named cycle
 */
export type ReferralProgramCycleSlug = string;

/**
 * Represents a referral program cycle configuration.
 */
export interface ReferralProgramCycleConfig {
  /**
   * Unique slug identifier for the cycle.
   *
   * @invariant Must contain only lowercase letters (a-z), digits (0-9), and hyphens (-).
   *            Must not start or end with a hyphen. Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
   */
  slug: ReferralProgramCycleSlug;

  /**
   * Human-readable display name for the cycle.
   * @example "ENS Holiday Awards"
   */
  displayName: string;

  /**
   * The rules that govern this referral program cycle.
   */
  rules: ReferralProgramRules;
}

/**
 * A map from cycle slug to cycle configuration.
 *
 * Used to store and look up all configured referral program cycles.
 */
export type ReferralProgramCycleConfigSet = Map<
  ReferralProgramCycleSlug,
  ReferralProgramCycleConfig
>;
