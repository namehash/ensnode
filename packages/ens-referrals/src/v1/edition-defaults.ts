import {
  type ENSNamespaceId,
  getEthnamesSubregistryId,
  parseTimestamp,
  parseUsdc,
} from "@ensnode/ensnode-sdk";

import { buildReferralProgramRulesPieSplit } from "./award-models/pie-split/rules";
import { buildReferralProgramRulesRevShareLimit } from "./award-models/rev-share-limit/rules";
import {
  buildReferralProgramEditionConfigSet,
  type ReferralProgramEditionConfig,
  type ReferralProgramEditionConfigSet,
} from "./edition";

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

  const dec2025Edition: ReferralProgramEditionConfig = {
    slug: "2025-12",
    displayName: "ENS Holiday Awards",
    rules: buildReferralProgramRulesPieSplit(
      parseUsdc("10000"),
      10,
      parseTimestamp("2025-12-01T00:00:00Z"),
      parseTimestamp("2025-12-31T23:59:59Z"),
      subregistryId,
      new URL("https://ensawards.org/ens-referral-program/editions/2025-12/rules"),
      true,
    ),
  };

  const apr2026Edition: ReferralProgramEditionConfig = {
    slug: "2026-04",
    displayName: "April 2026",
    rules: buildReferralProgramRulesRevShareLimit(
      parseUsdc("10000"),
      parseUsdc("100"),
      0.5,
      parseTimestamp("2026-04-01T00:00:00Z"),
      parseTimestamp("2026-04-30T23:59:59Z"),
      subregistryId,
      new URL("https://ensawards.org/ens-referral-program/editions/2026-04/rules"),
      false,
    ),
  };

  const may2026Edition: ReferralProgramEditionConfig = {
    slug: "2026-05",
    displayName: "May 2026",
    rules: buildReferralProgramRulesRevShareLimit(
      parseUsdc("30000"),
      parseUsdc("100"),
      0.5,
      parseTimestamp("2026-05-01T00:00:00Z"),
      parseTimestamp("2026-05-31T23:59:59Z"),
      subregistryId,
      new URL("https://ensawards.org/ens-referral-program/editions/2026-05/rules"),
      false,
    ),
  };

  return buildReferralProgramEditionConfigSet([dec2025Edition, apr2026Edition, may2026Edition]);
}
