import type { ReferralProgramRules } from "./rules";

/**
 * Referral program edition slug.
 *
 * A URL-safe identifier for a referral program edition. Each edition represents
 * a distinct referral program period with its own rules, leaderboard, and
 * award distribution.
 *
 * @invariant Must contain only lowercase letters (a-z), digits (0-9), and hyphens (-).
 *            Must not start or end with a hyphen. Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
 *
 * @example "2025-12" // December 2025 edition
 * @example "2026-03" // March 2026 edition
 * @example "holiday-special" // Custom named edition
 */
export type ReferralProgramEditionSlug = string;

/**
 * Represents a referral program edition configuration.
 */
export interface ReferralProgramEditionConfig {
  /**
   * Unique slug identifier for the edition.
   *
   * @invariant Must contain only lowercase letters (a-z), digits (0-9), and hyphens (-).
   *            Must not start or end with a hyphen. Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$`
   */
  slug: ReferralProgramEditionSlug;

  /**
   * Human-readable display name for the edition.
   * @example "ENS Holiday Awards"
   */
  displayName: string;

  /**
   * The rules that govern this referral program edition.
   */
  rules: ReferralProgramRules;
}

/**
 * A map from edition slug to edition configuration.
 *
 * Used to store and look up all configured referral program editions.
 */
export type ReferralProgramEditionConfigSet = Map<
  ReferralProgramEditionSlug,
  ReferralProgramEditionConfig
>;
