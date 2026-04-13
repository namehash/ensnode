import type { AccountId, Address, UnixTimestamp } from "enssdk";

import type { PriceUsdc } from "@ensnode/ensnode-sdk";
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

export interface ReferralProgramRulesRevShareLimit extends BaseReferralProgramRules {
  /**
   * Discriminant: identifies this as a "rev-share-limit" award model edition.
   *
   * In rev-share-limit, each qualified referrer receives a share of their base revenue
   * contribution (base-fee-only: `baseAnnualRevenueContribution` × years of incremental duration),
   * subject to the award pool cap and a minimum qualification threshold.
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareLimit;

  /**
   * The award pool in USDC (acts as a cap on total payouts).
   */
  awardPool: PriceUsdc;

  /**
   * The minimum base revenue contribution required for a referrer to qualify for awards.
   */
  minBaseRevenueContribution: PriceUsdc;

  /**
   * Base revenue contribution in USDC per year of incremental duration from referred registrations and renewals.
   *
   * Used in `rev-share-limit` qualification and award calculations:
   * 1 year of incremental duration → this many USDC of base revenue (base-fee-only, excluding premiums).
   */
  baseAnnualRevenueContribution: PriceUsdc;

  /**
   * The fraction of the referrer's base revenue contribution that constitutes their max potential award for each referral.
   * This is the max for a referral that ignores the possibility of the referrer not having achieved qualification for awards yet, the referrer being disqualified from awards, or the award pool being exhausted.
   *
   * @invariant Guaranteed to be a number between 0 and 1 (inclusive)
   */
  maxBaseRevenueShare: number;

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
  makePriceUsdcSchema("ReferralProgramRulesRevShareLimit.awardPool").parse(rules.awardPool);

  makePriceUsdcSchema("ReferralProgramRulesRevShareLimit.minBaseRevenueContribution").parse(
    rules.minBaseRevenueContribution,
  );

  makePriceUsdcSchema("ReferralProgramRulesRevShareLimit.baseAnnualRevenueContribution").parse(
    rules.baseAnnualRevenueContribution,
  );

  if (
    !Number.isFinite(rules.maxBaseRevenueShare) ||
    rules.maxBaseRevenueShare < 0 ||
    rules.maxBaseRevenueShare > 1
  ) {
    throw new Error(
      `ReferralProgramRulesRevShareLimit: maxBaseRevenueShare must be between 0 and 1 (inclusive), got ${rules.maxBaseRevenueShare}.`,
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
  awardPool: PriceUsdc,
  minBaseRevenueContribution: PriceUsdc,
  baseAnnualRevenueContribution: PriceUsdc,
  maxBaseRevenueShare: number,
  startTime: UnixTimestamp,
  endTime: UnixTimestamp,
  subregistryId: AccountId,
  rulesUrl: URL,
  areAwardsDistributed: boolean,
  disqualifications: ReferralProgramEditionDisqualification[] = [],
): ReferralProgramRulesRevShareLimit => {
  const result = {
    awardModel: ReferralProgramAwardModels.RevShareLimit,
    awardPool,
    minBaseRevenueContribution,
    baseAnnualRevenueContribution,
    maxBaseRevenueShare,
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
    totalBaseRevenueContribution.amount >= rules.minBaseRevenueContribution.amount &&
    !isAdminDisqualified
  );
}
