import type { AccountId, Address, UnixTimestamp } from "enssdk";

import { type PriceUsdc, parseUsdc } from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { normalizeAddress, validateLowercaseAddress } from "../../address";
import {
  type BaseReferralProgramRules,
  ReferralProgramAwardModels,
  validateBaseReferralProgramRules,
} from "../shared/rules";

/**
 * An admin-imposed disqualification entry of a specific referrer in an edition.
 */
export interface ReferralProgramEditionDisqualification {
  /**
   * The address of the disqualified referrer.
   *
   * @invariant Guaranteed to be a valid EVM address in lowercase format.
   */
  referrer: Address;

  /**
   * A human-readable explanation of why the referrer was disqualified.
   *
   * @invariant Must be a non-empty string.
   */
  reason: string;
}

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

  /**
   * Admin-imposed disqualifications for this edition.
   * Disqualified referrers receive no awards.
   *
   * @invariant No duplicate referrer addresses.
   */
  disqualifications: ReferralProgramEditionDisqualification[];
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

  for (const d of rules.disqualifications) {
    validateLowercaseAddress(d.referrer);
    if (d.reason.trim().length === 0) {
      throw new Error(
        "ReferralProgramRulesRevShareLimit: disqualification reason must not be empty.",
      );
    }
  }

  const disqualificationAddresses = rules.disqualifications.map((d) => d.referrer);
  const uniqueDisqualificationAddresses = new Set(disqualificationAddresses);
  if (uniqueDisqualificationAddresses.size !== disqualificationAddresses.length) {
    throw new Error(
      "ReferralProgramRulesRevShareLimit: disqualifications must not contain duplicate referrer addresses.",
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
  areAwardsDistributed: boolean,
  disqualifications: ReferralProgramEditionDisqualification[] = [],
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
    areAwardsDistributed,
    disqualifications,
  } satisfies ReferralProgramRulesRevShareLimit;

  validateReferralProgramRulesRevShareLimit(result);

  return result;
};

/**
 * Determine if a referrer is qualified under rev-share-limit rules.
 *
 * A referrer is qualified if they meet the revenue threshold AND are not admin-disqualified.
 *
 * @param referrer - The referrer's address.
 * @param totalBaseRevenueContribution - The referrer's total base revenue contribution.
 * @param rules - The rev-share-limit rules of the referral program.
 */
export function isReferrerQualifiedRevShareLimit(
  referrer: Address,
  totalBaseRevenueContribution: PriceUsdc,
  rules: ReferralProgramRulesRevShareLimit,
): boolean {
  const normalizedReferrer = normalizeAddress(referrer);
  const isAdminDisqualified = rules.disqualifications.some(
    (d) => d.referrer === normalizedReferrer,
  );
  return (
    totalBaseRevenueContribution.amount >= rules.minQualifiedRevenueContribution.amount &&
    !isAdminDisqualified
  );
}
