import type { BaseReferralProgramRules } from "./award-models/shared/rules";
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
 * Regex pattern that all {@link ReferralProgramEditionSlug} values must match.
 *
 * Allows lowercase letters (a-z), digits (0-9), and hyphens (-).
 * Must not start or end with a hyphen.
 */
export const REFERRAL_PROGRAM_EDITION_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Base fields shared by all referral program edition configs.
 */
export interface BaseReferralProgramEditionConfig {
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
   * The base rules that govern this referral program edition.
   */
  rules: BaseReferralProgramRules;
}

/**
 * Represents a referral program edition configuration.
 */
export interface ReferralProgramEditionConfig extends BaseReferralProgramEditionConfig {
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
 * Validates the invariants of a {@link ReferralProgramEditionConfigSet}.
 *
 * @param configSet - The edition config set to validate
 * @throws {Error} If any entry violates the invariant that each map key equals the
 *   corresponding config's slug
 * @throws {Error} If any pair of editions sharing a `registryId` overlap in time
 *   (`startTime` and `endTime` are inclusive — touching edges count as overlap)
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

  const overlap = findOverlappingEditionPair(Array.from(configSet.values()));
  if (overlap) {
    const [a, b] = overlap;
    throw new Error(
      `Edition config set invariant violation: editions "${a.slug}" and "${b.slug}" ` +
        `have overlapping time ranges for registryId ` +
        `${a.rules.registryId.chainId}:${a.rules.registryId.address} ` +
        `(startTime and endTime are inclusive)`,
    );
  }
}

/**
 * Returns the first pair of editions sharing a `registryId` whose time ranges overlap,
 * or `null` if none do.
 *
 * `startTime` and `endTime` are inclusive, so ranges sharing a single instant
 * (`A.endTime === B.startTime`) count as overlapping.
 *
 * @param editions - Array of editions to check
 * @returns A `[a, b]` tuple of the first offending pair, or `null` if none
 */
export function findOverlappingEditionPair<T extends BaseReferralProgramEditionConfig>(
  editions: readonly T[],
): readonly [T, T] | null {
  const byRegistry = new Map<string, T[]>();
  for (const edition of editions) {
    const key = `${edition.rules.registryId.chainId}:${edition.rules.registryId.address}`;
    const group = byRegistry.get(key);
    if (group) {
      group.push(edition);
    } else {
      byRegistry.set(key, [edition]);
    }
  }

  // Within each registry group, sort by startTime so any overlapping pair is also an
  // overlap between adjacent editions in this order — one linear pass after the sort suffices.
  for (const group of byRegistry.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.rules.startTime - b.rules.startTime);
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1];
      const curr = group[i];
      if (curr.rules.startTime <= prev.rules.endTime) {
        return [prev, curr] as const;
      }
    }
  }

  return null;
}

/**
 * Builds a new ReferralProgramEditionConfigSet from an array of configs and validates the invariant.
 *
 * @param configs - Array of edition configurations to add to the set
 * @returns A validated edition config set
 * @throws {Error} If duplicate slugs are detected or if any config would violate the invariant
 */
export function buildReferralProgramEditionConfigSet(
  configs: ReferralProgramEditionConfig[],
): ReferralProgramEditionConfigSet {
  // Check for duplicate slugs before creating the Map
  const slugCounts = configs.reduce((counts, config) => {
    counts.set(config.slug, (counts.get(config.slug) || 0) + 1);
    return counts;
  }, new Map<ReferralProgramEditionSlug, number>());

  const duplicates = Array.from(slugCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([slug, count]) => `"${slug}" (${count} occurrences)`);

  if (duplicates.length > 0) {
    throw new Error(`Duplicate edition config slugs detected: ${duplicates.join(", ")}`);
  }

  const configSet = new Map(configs.map((config) => [config.slug, config]));
  validateReferralProgramEditionConfigSet(configSet);
  return configSet;
}
