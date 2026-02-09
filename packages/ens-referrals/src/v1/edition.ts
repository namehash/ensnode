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
 *
 * @invariant For each key-value pair in the map, the key must equal the value's slug property.
 *            That is, for all entries: `map.get(key)?.slug === key`
 */
export type ReferralProgramEditionConfigSet = Map<
  ReferralProgramEditionSlug,
  ReferralProgramEditionConfig
>;

/**
 * Validates that a ReferralProgramEditionConfigSet maintains the invariant
 * that each map key equals the corresponding config's slug.
 *
 * @param configSet - The edition config set to validate
 * @throws {Error} If any entry violates the invariant (key !== value.slug)
 */
export function validateReferralProgramEditionConfigSet(
  configSet: ReferralProgramEditionConfigSet,
): void {
  const violation = Array.from(configSet.entries()).find(([key, config]) => key !== config.slug);

  if (violation) {
    const [key, config] = violation;
    throw new Error(
      `Edition config set invariant violation: map key "${key}" does not match config.slug "${config.slug}"`,
    );
  }
}

/**
 * Builds a new ReferralProgramEditionConfigSet from an array of configs and validates the invariant.
 *
 * @param configs - Array of edition configurations to add to the set
 * @returns A validated edition config set
 * @throws {Error} If any config would violate the invariant
 */
export function buildReferralProgramEditionConfigSet(
  configs: ReferralProgramEditionConfig[],
): ReferralProgramEditionConfigSet {
  const configSet = new Map(configs.map((config) => [config.slug, config]));
  validateReferralProgramEditionConfigSet(configSet);
  return configSet;
}
