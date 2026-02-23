import {
  type AccountId,
  type PriceUsdc,
  parseUsdc,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";
import { makeAccountIdSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateUnixTimestamp } from "../../time";
import { type BaseReferralProgramRules, ReferralProgramAwardModels } from "../shared/rules";

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
  const poolSchema = makePriceUsdcSchema("ReferralProgramRulesRevShareLimit.totalAwardPoolValue");
  const poolResult = poolSchema.safeParse(rules.totalAwardPoolValue);
  if (!poolResult.success) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: totalAwardPoolValue validation failed: ${poolResult.error.message}`,
    );
  }

  const minSchema = makePriceUsdcSchema(
    "ReferralProgramRulesRevShareLimit.minQualifiedRevenueContribution",
  );
  const minResult = minSchema.safeParse(rules.minQualifiedRevenueContribution);
  if (!minResult.success) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: minQualifiedRevenueContribution validation failed: ${minResult.error.message}`,
    );
  }

  if (rules.qualifiedRevenueShare < 0 || rules.qualifiedRevenueShare > 1) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: qualifiedRevenueShare must be between 0 and 1 (inclusive), got ${rules.qualifiedRevenueShare}.`,
    );
  }

  const accountIdSchema = makeAccountIdSchema("ReferralProgramRulesRevShareLimit.subregistryId");
  const accountIdResult = accountIdSchema.safeParse(rules.subregistryId);
  if (!accountIdResult.success) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: subregistryId validation failed: ${accountIdResult.error.message}`,
    );
  }

  validateUnixTimestamp(rules.startTime);
  validateUnixTimestamp(rules.endTime);

  if (!(rules.rulesUrl instanceof URL)) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: rulesUrl must be a URL instance, got ${typeof rules.rulesUrl}.`,
    );
  }

  if (rules.endTime < rules.startTime) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: startTime: ${rules.startTime} is after endTime: ${rules.endTime}.`,
    );
  }
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
