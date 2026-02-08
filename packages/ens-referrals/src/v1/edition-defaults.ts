import {
  type ENSNamespaceId,
  getEthnamesSubregistryId,
  parseTimestamp,
  parseUsdc,
} from "@ensnode/ensnode-sdk";

import type { ReferralProgramEditionConfig, ReferralProgramEditionConfigSet } from "./edition";
import { buildReferralProgramRules } from "./rules";

/**
 * Returns the default referral program edition set with pre-built edition configurations.
 *
 * This function maps from an ENS namespace to the appropriate subregistry (BaseRegistrar)
 * and builds the default referral program editions for that namespace.
 *
 * @param ensNamespaceId - The ENS namespace slug to get the default editions for
 * @returns A map of edition slugs to their pre-built edition configurations
 * @throws Error if the subregistry contract is not found for the given namespace
 */
export function getDefaultReferralProgramEditionConfigSet(
  ensNamespaceId: ENSNamespaceId,
): ReferralProgramEditionConfigSet {
  const subregistryId = getEthnamesSubregistryId(ensNamespaceId);

  const edition1: ReferralProgramEditionConfig = {
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

  const edition2: ReferralProgramEditionConfig = {
    slug: "2026-03",
    displayName: "March 2026",
    rules: buildReferralProgramRules(
      parseUsdc("10000"),
      10,
      parseTimestamp("2026-03-01T00:00:00Z"),
      parseTimestamp("2026-03-31T23:59:59Z"),
      subregistryId,
      // note: this will be replaced with dedicated March 2026 rules URL once published
      new URL("https://ensawards.org/ens-holiday-awards-rules"),
    ),
  };

  return new Map([
    [edition1.slug, edition1],
    [edition2.slug, edition2],
  ]);
}
