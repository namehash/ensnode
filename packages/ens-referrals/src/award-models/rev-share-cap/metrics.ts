import type { NormalizedAddress } from "enssdk";

import { type PriceUsdc, priceEth, priceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { buildReferrerMetrics, validateReferrerMetrics } from "../../referrer-metrics";
import { SECONDS_PER_YEAR } from "../../time";
import type { ReferrerRank } from "../shared/rank";
import { validateReferrerRank } from "../shared/rank";
import {
  type AdminAction,
  AdminActionTypes,
  isReferrerQualifiedRevShareCap,
  type ReferralProgramRulesRevShareCap,
} from "./rules";

/**
 * Extends {@link ReferrerMetrics} with computed base revenue contribution.
 */
export interface ReferrerMetricsRevShareCap extends ReferrerMetrics {
  /**
   * The referrer's base revenue contribution
   * (`rules.baseAnnualRevenueContribution` × years of incremental duration).
   * Used for qualification and award calculation in the rev-share-cap model.
   *
   * @invariant Guaranteed to be `priceUsdc(rules.baseAnnualRevenueContribution.amount * BigInt(totalIncrementalDuration) / BigInt(SECONDS_PER_YEAR))`
   */
  totalBaseRevenueContribution: PriceUsdc;
}

export const validateReferrerMetricsRevShareCap = (
  metrics: ReferrerMetricsRevShareCap,
  rules: ReferralProgramRulesRevShareCap,
): void => {
  validateReferrerMetrics(metrics);

  makePriceUsdcSchema("ReferrerMetricsRevShareCap.totalBaseRevenueContribution").parse(
    metrics.totalBaseRevenueContribution,
  );

  const expectedTotalBaseRevenueContribution = priceUsdc(
    (rules.baseAnnualRevenueContribution.amount * BigInt(metrics.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR),
  );
  if (metrics.totalBaseRevenueContribution.amount !== expectedTotalBaseRevenueContribution.amount) {
    throw new Error(
      `ReferrerMetricsRevShareCap: Invalid totalBaseRevenueContribution: ${metrics.totalBaseRevenueContribution.amount.toString()}, expected: ${expectedTotalBaseRevenueContribution.amount.toString()}.`,
    );
  }
};

export const buildReferrerMetricsRevShareCap = (
  metrics: ReferrerMetrics,
  rules: ReferralProgramRulesRevShareCap,
): ReferrerMetricsRevShareCap => {
  const totalBaseRevenueContribution = priceUsdc(
    (rules.baseAnnualRevenueContribution.amount * BigInt(metrics.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR),
  );

  const result = {
    ...metrics,
    totalBaseRevenueContribution,
  } satisfies ReferrerMetricsRevShareCap;

  validateReferrerMetricsRevShareCap(result, rules);
  return result;
};

/**
 * Extends {@link ReferrerMetricsRevShareCap} with rank, qualification status, and admin disqualification.
 */
export interface RankedReferrerMetricsRevShareCap extends ReferrerMetricsRevShareCap {
  /**
   * The referrer's rank on the {@link ReferrerLeaderboardRevShareCap} relative to all other referrers.
   */
  rank: ReferrerRank;

  /**
   * Identifies if the referrer is eligible for an award under the {@link ReferralProgramRulesRevShareCap}.
   *
   * Note: this is a purely rule-based eligibility predicate and does NOT guarantee
   * `cappedAward.amount > 0n` — a qualified referrer may still receive $0 if the
   * capped award pool is already exhausted by earlier referrers in the race.
   *
   * @invariant true if and only if `totalBaseRevenueContribution` is greater than or equal to
   *   {@link ReferralProgramRulesRevShareCap.minBaseRevenueContribution} AND
   *   {@link adminAction} does not have `actionType` of {@link AdminActionTypes.Disqualification}.
   */
  isQualified: boolean;

  /**
   * The admin action taken on this referrer, or null if no admin action has been taken.
   *
   * @invariant null when no admin action has been taken on this referrer.
   * @invariant Must match the corresponding entry in {@link ReferralProgramRulesRevShareCap.adminActions}.
   */
  adminAction: AdminAction | null;
}

/**
 * Validates that `metricsAdminAction` matches the admin action (or absence thereof) recorded for
 * `referrer` in `rules.adminActions`. Errors are prefixed with `context` so callers can preserve
 * their existing message format.
 */
const validateAdminActionConsistency = (
  metricsAdminAction: AdminAction | null,
  referrer: NormalizedAddress,
  rules: ReferralProgramRulesRevShareCap,
  context: string,
): void => {
  const expected = rules.adminActions.find((a) => a.referrer === referrer) ?? null;

  if (expected === null && metricsAdminAction !== null) {
    throw new Error(
      `${context}: expected null, got actionType="${metricsAdminAction.actionType}".`,
    );
  }

  if (expected !== null) {
    if (
      metricsAdminAction === null ||
      metricsAdminAction.actionType !== expected.actionType ||
      metricsAdminAction.referrer !== expected.referrer ||
      metricsAdminAction.reason !== expected.reason
    ) {
      throw new Error(`${context}: does not match expected action from rules.`);
    }
  }
};

export const validateRankedReferrerMetricsRevShareCap = (
  metrics: RankedReferrerMetricsRevShareCap,
  rules: ReferralProgramRulesRevShareCap,
): void => {
  validateReferrerMetricsRevShareCap(metrics, rules);
  validateReferrerRank(metrics.rank);

  const expectedIsQualified = isReferrerQualifiedRevShareCap(
    metrics.referrer,
    metrics.totalBaseRevenueContribution,
    rules,
  );
  if (metrics.isQualified !== expectedIsQualified) {
    throw new Error(
      `RankedReferrerMetricsRevShareCap: Invalid isQualified: ${metrics.isQualified}, expected: ${expectedIsQualified}.`,
    );
  }

  validateAdminActionConsistency(
    metrics.adminAction,
    metrics.referrer,
    rules,
    "RankedReferrerMetricsRevShareCap: Invalid adminAction",
  );
};

export const buildRankedReferrerMetricsRevShareCap = (
  referrer: ReferrerMetricsRevShareCap,
  rank: ReferrerRank,
  rules: ReferralProgramRulesRevShareCap,
): RankedReferrerMetricsRevShareCap => {
  const adminAction = rules.adminActions.find((a) => a.referrer === referrer.referrer) ?? null;

  const result = {
    ...referrer,
    rank,
    isQualified: isReferrerQualifiedRevShareCap(
      referrer.referrer,
      referrer.totalBaseRevenueContribution,
      rules,
    ),
    adminAction,
  } satisfies RankedReferrerMetricsRevShareCap;

  validateRankedReferrerMetricsRevShareCap(result, rules);
  return result;
};

/**
 * Extends {@link RankedReferrerMetricsRevShareCap} with the referrer's uncapped and capped awards.
 */
export interface AwardedReferrerMetricsRevShareCap extends RankedReferrerMetricsRevShareCap {
  /**
   * The uncapped USDC award for this referrer, computed as
   * `maxBaseRevenueShare × totalBaseRevenueContribution`.
   *
   * Represents what the referrer would receive if the pool were uncapped and the referrer were qualified.
   * Independent of the pool state, qualification status, and admin disqualification status.
   */
  uncappedAward: PriceUsdc;

  /**
   * The referrer's (tentative) capped USDC award.
   *
   * This is the amount (tentatively) claimed from the award pool by this referrer, capped by
   * the remaining award pool at the time of their qualifying referrals.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with amount between 0 and {@link ReferralProgramRulesRevShareCap.awardPool.amount} (inclusive)
   * @invariant Always <= uncappedAward.amount
   * @invariant Amount equal to 0 when {@link adminAction} has `actionType` of {@link AdminActionTypes.Disqualification}.
   * @invariant Amount equal to 0 when {@link isQualified} is false.
   */
  cappedAward: PriceUsdc;
}

export const validateAwardedReferrerMetricsRevShareCap = (
  metrics: AwardedReferrerMetricsRevShareCap,
  rules: ReferralProgramRulesRevShareCap,
): void => {
  validateRankedReferrerMetricsRevShareCap(metrics, rules);

  makePriceUsdcSchema("AwardedReferrerMetricsRevShareCap.uncappedAward").parse(
    metrics.uncappedAward,
  );

  makePriceUsdcSchema("AwardedReferrerMetricsRevShareCap.cappedAward").parse(metrics.cappedAward);

  if (
    metrics.adminAction?.actionType === AdminActionTypes.Disqualification &&
    metrics.cappedAward.amount !== 0n
  ) {
    throw new Error(
      `AwardedReferrerMetricsRevShareCap: cappedAward.amount must be 0n for admin-disqualified referrers, got ${metrics.cappedAward.amount.toString()}.`,
    );
  }

  if (!metrics.isQualified && metrics.cappedAward.amount !== 0n) {
    throw new Error(
      `AwardedReferrerMetricsRevShareCap: cappedAward.amount must be 0n for unqualified referrers, got ${metrics.cappedAward.amount.toString()}.`,
    );
  }

  if (metrics.cappedAward.amount > rules.awardPool.amount) {
    throw new Error(
      `AwardedReferrerMetricsRevShareCap: cappedAward.amount ${metrics.cappedAward.amount.toString()} exceeds awardPool.amount ${rules.awardPool.amount.toString()}.`,
    );
  }

  if (metrics.cappedAward.amount > metrics.uncappedAward.amount) {
    throw new Error(
      `AwardedReferrerMetricsRevShareCap: cappedAward.amount ${metrics.cappedAward.amount.toString()} exceeds uncappedAward.amount ${metrics.uncappedAward.amount.toString()}.`,
    );
  }
};

export const buildAwardedReferrerMetricsRevShareCap = (
  referrer: RankedReferrerMetricsRevShareCap,
  uncappedAward: PriceUsdc,
  cappedAward: PriceUsdc,
  rules: ReferralProgramRulesRevShareCap,
): AwardedReferrerMetricsRevShareCap => {
  const result = {
    ...referrer,
    uncappedAward,
    cappedAward,
  } satisfies AwardedReferrerMetricsRevShareCap;

  validateAwardedReferrerMetricsRevShareCap(result, rules);
  return result;
};

/**
 * Extends {@link AwardedReferrerMetricsRevShareCap} but with rank set to null to represent
 * a referrer who is not on the leaderboard (has zero referrals within the rules associated with the leaderboard).
 */
export interface UnrankedReferrerMetricsRevShareCap
  extends Omit<AwardedReferrerMetricsRevShareCap, "rank" | "isQualified"> {
  /**
   * The referrer is not on the leaderboard and therefore has no rank.
   */
  rank: null;

  /**
   * Always false for unranked referrers.
   */
  isQualified: false;
}

export const validateUnrankedReferrerMetricsRevShareCap = (
  metrics: UnrankedReferrerMetricsRevShareCap,
  rules: ReferralProgramRulesRevShareCap,
): void => {
  validateReferrerMetrics(metrics);

  if (metrics.rank !== null) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: rank must be null, got: ${metrics.rank}.`,
    );
  }
  if (metrics.isQualified !== false) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: isQualified must be false, got: ${metrics.isQualified}.`,
    );
  }

  validateAdminActionConsistency(
    metrics.adminAction,
    metrics.referrer,
    rules,
    "Invalid UnrankedReferrerMetricsRevShareCap: adminAction",
  );

  if (metrics.totalReferrals !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: totalReferrals must be 0, got: ${metrics.totalReferrals}.`,
    );
  }
  if (metrics.totalIncrementalDuration !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: totalIncrementalDuration must be 0, got: ${metrics.totalIncrementalDuration}.`,
    );
  }

  makePriceEthSchema("UnrankedReferrerMetricsRevShareCap.totalRevenueContribution").parse(
    metrics.totalRevenueContribution,
  );
  if (metrics.totalRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: totalRevenueContribution.amount must be 0n, got: ${metrics.totalRevenueContribution.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareCap.totalBaseRevenueContribution").parse(
    metrics.totalBaseRevenueContribution,
  );
  if (metrics.totalBaseRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: totalBaseRevenueContribution.amount must be 0n, got: ${metrics.totalBaseRevenueContribution.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareCap.uncappedAward").parse(
    metrics.uncappedAward,
  );
  if (metrics.uncappedAward.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: uncappedAward.amount must be 0n, got: ${metrics.uncappedAward.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareCap.cappedAward").parse(metrics.cappedAward);
  if (metrics.cappedAward.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareCap: cappedAward.amount must be 0n, got: ${metrics.cappedAward.amount.toString()}.`,
    );
  }
};

/**
 * Build an unranked zero-metrics rev-share-cap referrer record for an address not on the leaderboard.
 */
export const buildUnrankedReferrerMetricsRevShareCap = (
  referrer: NormalizedAddress,
  rules: ReferralProgramRulesRevShareCap,
): UnrankedReferrerMetricsRevShareCap => {
  const metrics = buildReferrerMetrics(referrer, 0, 0, priceEth(0n));

  const adminAction = rules.adminActions.find((a) => a.referrer === metrics.referrer) ?? null;

  const result = {
    ...metrics,
    totalBaseRevenueContribution: priceUsdc(0n),
    rank: null,
    isQualified: false,
    uncappedAward: priceUsdc(0n),
    cappedAward: priceUsdc(0n),
    adminAction,
  } satisfies UnrankedReferrerMetricsRevShareCap;

  validateUnrankedReferrerMetricsRevShareCap(result, rules);
  return result;
};
