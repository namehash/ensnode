import type { AccountId, NormalizedAddress, UnixTimestamp } from "enssdk";

import type { PriceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import { validateNormalizedAddress } from "../../address";
import {
  type BaseReferralProgramRules,
  ReferralProgramAwardModels,
  validateBaseReferralProgramRules,
} from "../shared/rules";

/**
 * The types of admin actions that can be taken upon a referrer in a rev-share-cap edition.
 */
export const AdminActionTypes = {
  /**
   * The referrer is disqualified for awards.
   */
  Disqualification: "Disqualification",

  /**
   * The referrer is warned about a potential disqualification but may still be qualified for awards.
   */
  Warning: "Warning",
} as const;

export type AdminActionType = (typeof AdminActionTypes)[keyof typeof AdminActionTypes];

/**
 * An admin action to disqualify a referrer from receiving awards for an edition.
 */
export interface AdminActionDisqualification {
  actionType: typeof AdminActionTypes.Disqualification;

  /**
   * The Ethereum address of the affected referrer, as a {@link NormalizedAddress}.
   */
  referrer: NormalizedAddress;

  /**
   * A short message explaining the disqualification.
   *
   * @invariant Must be a trimmed, non-empty string.
   */
  reason: string;
}

/**
 * An admin action to warn a referrer that their eligibility for receiving awards for an edition
 * is at risk unless the referrer takes corrective actions.
 */
export interface AdminActionWarning {
  actionType: typeof AdminActionTypes.Warning;

  /**
   * The Ethereum address of the affected referrer, as a {@link NormalizedAddress}.
   */
  referrer: NormalizedAddress;

  /**
   * A short message explaining the warning.
   *
   * @invariant Must be a trimmed, non-empty string.
   */
  reason: string;
}

/**
 * A discriminated union of all admin action types.
 */
export type AdminAction = AdminActionDisqualification | AdminActionWarning;

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
   * Admin actions for this edition.
   *
   * @invariant No duplicate referrer addresses (a referrer can have at most one admin action).
   */
  adminActions: AdminAction[];
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

  for (const action of rules.adminActions) {
    validateNormalizedAddress(action.referrer);
    if (action.reason.trim().length === 0 || action.reason !== action.reason.trim()) {
      throw new Error(
        "ReferralProgramRulesRevShareCap: admin action reason must be a trimmed, non-empty string.",
      );
    }
  }

  const adminActionAddresses = rules.adminActions.map((a) => a.referrer);
  const uniqueAdminActionAddresses = new Set(adminActionAddresses);
  if (uniqueAdminActionAddresses.size !== adminActionAddresses.length) {
    throw new Error(
      "ReferralProgramRulesRevShareCap: adminActions must not contain duplicate referrer addresses.",
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
  adminActions: AdminAction[] = [],
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
    adminActions,
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
  const isAdminDisqualified = rules.adminActions.some(
    (a) => a.referrer === referrer && a.actionType === AdminActionTypes.Disqualification,
  );
  return (
    totalBaseRevenueContribution.amount >= rules.minBaseRevenueContribution.amount &&
    !isAdminDisqualified
  );
}
