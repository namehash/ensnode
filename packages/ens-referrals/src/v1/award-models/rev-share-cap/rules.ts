import type { AccountId, NormalizedAddress, UnixTimestamp } from "enssdk";

import type { PriceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateAddress } from "../../address";
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
   * The Ethereum address of the disqualified referrer, as a {@link NormalizedAddress}.
   */
  referrer: NormalizedAddress;

  /**
   * A human-readable explanation of why the referrer was disqualified.
   *
   * @invariant Must be a non-empty string.
   */
  reason: string;
}

export interface ReferralProgramRulesRevShareCap extends BaseReferralProgramRules {
  /**
   * Discriminant: identifies this as a "rev-share-cap" award model edition.
   *
   * In rev-share-cap, each qualified referrer receives a share of their base revenue
   * contribution (base-fee-only: `baseAnnualRevenueContribution` × years of incremental duration),
   * subject to the award pool cap and a minimum qualification threshold.
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

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
   * Used in `rev-share-cap` qualification and award calculations:
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

export const validateReferralProgramRulesRevShareCap = (
  rules: ReferralProgramRulesRevShareCap,
): void => {
  if (rules.awardModel !== ReferralProgramAwardModels.RevShareCap) {
    throw new Error(
      `ReferralProgramRulesRevShareCap: awardModel must be "${ReferralProgramAwardModels.RevShareCap}", got "${rules.awardModel}".`,
    );
  }

  makePriceUsdcSchema("ReferralProgramRulesRevShareCap.awardPool").parse(rules.awardPool);

  makePriceUsdcSchema("ReferralProgramRulesRevShareCap.minBaseRevenueContribution").parse(
    rules.minBaseRevenueContribution,
  );

  makePriceUsdcSchema("ReferralProgramRulesRevShareCap.baseAnnualRevenueContribution").parse(
    rules.baseAnnualRevenueContribution,
  );

  if (
    !Number.isFinite(rules.maxBaseRevenueShare) ||
    rules.maxBaseRevenueShare < 0 ||
    rules.maxBaseRevenueShare > 1
  ) {
    throw new Error(
      `ReferralProgramRulesRevShareCap: maxBaseRevenueShare must be between 0 and 1 (inclusive), got ${rules.maxBaseRevenueShare}.`,
    );
  }

  for (const d of rules.disqualifications) {
    validateAddress(d.referrer);
    if (d.reason.trim().length === 0) {
      throw new Error(
        "ReferralProgramRulesRevShareCap: disqualification reason must not be empty.",
      );
    }
  }

  const disqualificationAddresses = rules.disqualifications.map((d) => d.referrer);
  const uniqueDisqualificationAddresses = new Set(disqualificationAddresses);
  if (uniqueDisqualificationAddresses.size !== disqualificationAddresses.length) {
    throw new Error(
      "ReferralProgramRulesRevShareCap: disqualifications must not contain duplicate referrer addresses.",
    );
  }

  validateBaseReferralProgramRules(rules);
};

export const buildReferralProgramRulesRevShareCap = (
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
): ReferralProgramRulesRevShareCap => {
  const result = {
    awardModel: ReferralProgramAwardModels.RevShareCap,
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
  } satisfies ReferralProgramRulesRevShareCap;

  validateReferralProgramRulesRevShareCap(result);

  return result;
};

/**
 * Determine if a referrer is qualified under rev-share-cap rules.
 *
 * A referrer is qualified if they meet the revenue threshold AND are not admin-disqualified.
 *
 * @param referrer - The referrer's address.
 * @param totalBaseRevenueContribution - The referrer's total base revenue contribution.
 * @param rules - The rev-share-cap rules of the referral program.
 */
export function isReferrerQualifiedRevShareCap(
  referrer: NormalizedAddress,
  totalBaseRevenueContribution: PriceUsdc,
  rules: ReferralProgramRulesRevShareCap,
): boolean {
  const isAdminDisqualified = rules.disqualifications.some((d) => d.referrer === referrer);
  return (
    totalBaseRevenueContribution.amount >= rules.minBaseRevenueContribution.amount &&
    !isAdminDisqualified
  );
}
