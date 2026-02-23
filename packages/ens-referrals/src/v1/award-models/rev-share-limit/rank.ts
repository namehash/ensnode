import type { PriceUsdc } from "@ensnode/ensnode-sdk";

import type { ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * Determine if a referrer meets the revenue threshold to qualify under rev-share-limit rules.
 *
 * @param totalBaseRevenueContribution - The referrer's total base revenue contribution.
 * @param rules - The rev-share-limit rules of the referral program.
 */
export function isReferrerQualifiedRevShareLimit(
  totalBaseRevenueContribution: PriceUsdc,
  rules: ReferralProgramRulesRevShareLimit,
): boolean {
  return totalBaseRevenueContribution.amount >= rules.minQualifiedRevenueContribution.amount;
}
