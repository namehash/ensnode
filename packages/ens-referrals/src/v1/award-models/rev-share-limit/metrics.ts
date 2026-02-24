import type { Address } from "viem";

import { type PriceUsdc, priceEth, priceUsdc } from "@ensnode/ensnode-sdk";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { buildReferrerMetrics } from "../../referrer-metrics";
import { SECONDS_PER_YEAR } from "../../time";
import type { ReferrerRank } from "../shared/rank";
import {
  BASE_REVENUE_CONTRIBUTION_PER_YEAR,
  isReferrerQualifiedRevShareLimit,
  type ReferralProgramRulesRevShareLimit,
} from "./rules";

/**
 * Extends {@link ReferrerMetrics} with computed base revenue contribution.
 */
export interface ReferrerMetricsRevShareLimit extends ReferrerMetrics {
  /**
   * The referrer's base revenue contribution (base-fee-only: $5 × years of incremental duration).
   * Used for qualification and award calculation in the rev-share-limit model.
   *
   * @invariant Guaranteed to be `priceUsdc(BASE_REVENUE_CONTRIBUTION_PER_YEAR.amount * BigInt(totalIncrementalDuration) / BigInt(SECONDS_PER_YEAR))`
   */
  totalBaseRevenueContribution: PriceUsdc;
}

export const buildReferrerMetricsRevShareLimit = (
  metrics: ReferrerMetrics,
): ReferrerMetricsRevShareLimit => {
  const totalBaseRevenueContribution = priceUsdc(
    (BASE_REVENUE_CONTRIBUTION_PER_YEAR.amount * BigInt(metrics.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR),
  );

  return {
    ...metrics,
    totalBaseRevenueContribution,
  } satisfies ReferrerMetricsRevShareLimit;
};

/**
 * Extends {@link ReferrerMetricsRevShareLimit} with rank and qualification status.
 */
export interface RankedReferrerMetricsRevShareLimit extends ReferrerMetricsRevShareLimit {
  /**
   * The referrer's rank on the {@link ReferrerLeaderboardRevShareLimit} relative to all other referrers.
   */
  rank: ReferrerRank;

  /**
   * Identifies if the referrer meets the qualifications of the {@link ReferralProgramRulesRevShareLimit} to receive a non-zero `awardPoolShare`.
   *
   * @invariant true if and only if `totalBaseRevenueContribution` is greater than or equal to {@link ReferralProgramRulesRevShareLimit.minQualifiedRevenueContribution}
   */
  isQualified: boolean;
}

export const buildRankedReferrerMetricsRevShareLimit = (
  referrer: ReferrerMetricsRevShareLimit,
  rank: ReferrerRank,
  rules: ReferralProgramRulesRevShareLimit,
): RankedReferrerMetricsRevShareLimit => {
  return {
    ...referrer,
    rank,
    isQualified: isReferrerQualifiedRevShareLimit(referrer.totalBaseRevenueContribution, rules),
  } satisfies RankedReferrerMetricsRevShareLimit;
};

/**
 * Extends {@link RankedReferrerMetricsRevShareLimit} with approximate award value.
 */
export interface AwardedReferrerMetricsRevShareLimit extends RankedReferrerMetricsRevShareLimit {
  /**
   * The standard (uncapped) USDC award value for this referrer, computed as
   * `qualifiedRevenueShare × totalBaseRevenueContribution`.
   *
   * Represents what the referrer would receive if the pool were unlimited.
   * Independent of the pool state.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with non-negative amount (>= 0n)
   */
  standardAwardValue: PriceUsdc;

  /**
   * The approximate USDC value of the referrer's award.
   *
   * This is the amount actually claimed from the pool by this referrer, capped by
   * the remaining pool at the time of their qualifying events.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with amount between 0 and {@link ReferralProgramRulesRevShareLimit.totalAwardPoolValue.amount} (inclusive)
   * @invariant Always <= standardAwardValue.amount
   */
  awardPoolApproxValue: PriceUsdc;
}

export const buildAwardedReferrerMetricsRevShareLimit = (
  referrer: RankedReferrerMetricsRevShareLimit,
  standardAwardValue: PriceUsdc,
  awardPoolApproxValue: PriceUsdc,
): AwardedReferrerMetricsRevShareLimit => {
  return {
    ...referrer,
    standardAwardValue,
    awardPoolApproxValue,
  } satisfies AwardedReferrerMetricsRevShareLimit;
};

/**
 * Extends {@link AwardedReferrerMetricsRevShareLimit} but with rank set to null to represent
 * a referrer who is not on the leaderboard (has zero referrals within the rules associated with the leaderboard).
 */
export interface UnrankedReferrerMetricsRevShareLimit
  extends Omit<AwardedReferrerMetricsRevShareLimit, "rank" | "isQualified"> {
  /**
   * The referrer is not on the leaderboard and therefore has no rank.
   */
  rank: null;

  /**
   * Always false for unranked referrers.
   */
  isQualified: false;
}

/**
 * Build an unranked zero-metrics rev-share-limit referrer record for an address not on the leaderboard.
 */
export const buildUnrankedReferrerMetricsRevShareLimit = (
  referrer: Address,
): UnrankedReferrerMetricsRevShareLimit => {
  const metrics = buildReferrerMetrics(referrer, 0, 0, priceEth(0n));

  return {
    ...metrics,
    totalBaseRevenueContribution: priceUsdc(0n),
    rank: null,
    isQualified: false,
    standardAwardValue: priceUsdc(0n),
    awardPoolApproxValue: priceUsdc(0n),
  } satisfies UnrankedReferrerMetricsRevShareLimit;
};
