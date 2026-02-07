import {
  type ENSNamespaceId,
  getEthnamesSubregistryId,
  parseTimestamp,
  parseUsdc,
} from "@ensnode/ensnode-sdk";

import type { ReferralProgramCycleConfig, ReferralProgramCycleConfigSet } from "./cycle";
import { buildReferralProgramRules } from "./rules";

/**
 * Returns the default referral program cycle set with pre-built cycle configurations.
 *
 * This function maps from an ENS namespace to the appropriate subregistry (BaseRegistrar)
 * and builds the default referral program cycles for that namespace.
 *
 * @param ensNamespaceId - The ENS namespace slug to get the default cycles for
 * @returns A map of cycle slugs to their pre-built cycle configurations
 * @throws Error if the subregistry contract is not found for the given namespace
 */
export function getDefaultReferralProgramCycleConfigSet(
  ensNamespaceId: ENSNamespaceId,
): ReferralProgramCycleConfigSet {
  const subregistryId = getEthnamesSubregistryId(ensNamespaceId);

  const cycle1: ReferralProgramCycleConfig = {
    slug: "2025-12",
    displayName: "ENS Holiday Awards",
    rules: buildReferralProgramRules(
      parseUsdc("10000"),
      10,
      parseTimestamp("2025-12-01T00:00:00Z"),
      parseTimestamp("2025-12-31T23:59:59Z"),
      subregistryId,
      new URL("https://ensawards.org/ens-holiday-awards-rules"),
    ),
  };

  const cycle2: ReferralProgramCycleConfig = {
    slug: "2026-03",
    displayName: "March 2026",
    rules: buildReferralProgramRules(
      parseUsdc("10000"),
      10,
      parseTimestamp("2026-03-01T00:00:00Z"),
      parseTimestamp("2026-03-31T23:59:59Z"),
      subregistryId,
      new URL("https://ensawards.org/ens-holiday-awards-rules"),
    ),
  };

  return new Map([
    ["2025-12", cycle1],
    ["2026-03", cycle2],
  ]);
}
