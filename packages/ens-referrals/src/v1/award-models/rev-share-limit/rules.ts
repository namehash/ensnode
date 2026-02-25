import {
  type AccountId,
  type PriceUsdc,
  parseUsdc,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import {
  type BaseReferralProgramRules,
  ReferralProgramAwardModels,
  validateBaseReferralProgramRules,
} from "../shared/rules";

/**
 * Base revenue contribution per year of incremental duration.
 *
 * Used in `rev-share-limit` qualification and award calculations:
 * 1 year of incremental duration = $5 in base revenue (base-fee-only, excluding premiums).
 */
export const BASE_REVENUE_CONTRIBUTION_PER_YEAR: PriceUsdc = parseUsdc("5");

export interface ReferralProgramRulesRevShareLimit extends BaseReferralProgramRules {
  /**
   * Discriminant: identifies this as a "rev-share-limit" award model edition.
   *
   * In rev-share-limit, each qualified referrer receives a share of their base revenue
   * contribution (base-fee-only: $5 × years of incremental duration), subject to a
   * pool cap and a minimum qualification threshold.
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareLimit;

  /**
   * The total value of the award pool in USDC (acts as a cap on total payouts).
   *
   * NOTE: Awards will actually be distributed in $ENS tokens.
   */
  totalAwardPoolValue: PriceUsdc;

  /**
   * The minimum base revenue contribution required for a referrer to qualify.
   */
  minQualifiedRevenueContribution: PriceUsdc;

  /**
   * The fraction of the referrer's base revenue contribution that constitutes their potential award.
   *
   * @invariant Guaranteed to be a number between 0 and 1 (inclusive)
   */
  qualifiedRevenueShare: number;
}

export const validateReferralProgramRulesRevShareLimit = (
  rules: ReferralProgramRulesRevShareLimit,
): void => {
  makePriceUsdcSchema("ReferralProgramRulesRevShareLimit.totalAwardPoolValue").parse(
    rules.totalAwardPoolValue,
  );

  makePriceUsdcSchema("ReferralProgramRulesRevShareLimit.minQualifiedRevenueContribution").parse(
    rules.minQualifiedRevenueContribution,
  );

  if (
    !Number.isFinite(rules.qualifiedRevenueShare) ||
    rules.qualifiedRevenueShare < 0 ||
    rules.qualifiedRevenueShare > 1
  ) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: qualifiedRevenueShare must be between 0 and 1 (inclusive), got ${rules.qualifiedRevenueShare}.`,
    );
  }

  validateBaseReferralProgramRules(rules);
};

export const buildReferralProgramRulesRevShareLimit = (
  totalAwardPoolValue: PriceUsdc,
  minQualifiedRevenueContribution: PriceUsdc,
  qualifiedRevenueShare: number,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
  subregistryId: AccountId,
  rulesUrl: URL,
): ReferralProgramRulesRevShareLimit => {
  const result = {
    awardModel: ReferralProgramAwardModels.RevShareLimit,
    totalAwardPoolValue,
    minQualifiedRevenueContribution,
    qualifiedRevenueShare,
    startTime,
    endTime,
    subregistryId,
    rulesUrl,
  } satisfies ReferralProgramRulesRevShareLimit;

  validateReferralProgramRulesRevShareLimit(result);

  return result;
};

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
