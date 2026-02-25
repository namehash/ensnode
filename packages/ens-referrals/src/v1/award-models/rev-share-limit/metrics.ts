import type { Address } from "viem";

import { type PriceUsdc, priceEth, priceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { buildReferrerMetrics, validateReferrerMetrics } from "../../referrer-metrics";
import { SECONDS_PER_YEAR } from "../../time";
import type { ReferrerRank } from "../shared/rank";
import { validateReferrerRank } from "../shared/rank";
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

export const validateReferrerMetricsRevShareLimit = (
  metrics: ReferrerMetricsRevShareLimit,
): void => {
  validateReferrerMetrics(metrics);

  const expectedTotalBaseRevenueContribution = priceUsdc(
    (BASE_REVENUE_CONTRIBUTION_PER_YEAR.amount * BigInt(metrics.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR),
  );
  if (metrics.totalBaseRevenueContribution.amount !== expectedTotalBaseRevenueContribution.amount) {
    throw new Error(
      `ReferrerMetricsRevShareLimit: Invalid totalBaseRevenueContribution: ${metrics.totalBaseRevenueContribution.amount.toString()}, expected: ${expectedTotalBaseRevenueContribution.amount.toString()}.`,
    );
  }
};

export const buildReferrerMetricsRevShareLimit = (
  metrics: ReferrerMetrics,
): ReferrerMetricsRevShareLimit => {
  const totalBaseRevenueContribution = priceUsdc(
    (BASE_REVENUE_CONTRIBUTION_PER_YEAR.amount * BigInt(metrics.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR),
  );

  const result = {
    ...metrics,
    totalBaseRevenueContribution,
  } satisfies ReferrerMetricsRevShareLimit;

  validateReferrerMetricsRevShareLimit(result);
  return result;
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

export const validateRankedReferrerMetricsRevShareLimit = (
  metrics: RankedReferrerMetricsRevShareLimit,
  rules: ReferralProgramRulesRevShareLimit,
): void => {
  validateReferrerMetricsRevShareLimit(metrics);
  validateReferrerRank(metrics.rank);

  const expectedIsQualified = isReferrerQualifiedRevShareLimit(
    metrics.totalBaseRevenueContribution,
    rules,
  );
  if (metrics.isQualified !== expectedIsQualified) {
    throw new Error(
      `RankedReferrerMetricsRevShareLimit: Invalid isQualified: ${metrics.isQualified}, expected: ${expectedIsQualified}.`,
    );
  }
};

export const buildRankedReferrerMetricsRevShareLimit = (
  referrer: ReferrerMetricsRevShareLimit,
  rank: ReferrerRank,
  rules: ReferralProgramRulesRevShareLimit,
): RankedReferrerMetricsRevShareLimit => {
  const result = {
    ...referrer,
    rank,
    isQualified: isReferrerQualifiedRevShareLimit(referrer.totalBaseRevenueContribution, rules),
  } satisfies RankedReferrerMetricsRevShareLimit;

  validateRankedReferrerMetricsRevShareLimit(result, rules);
  return result;
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

export const validateAwardedReferrerMetricsRevShareLimit = (
  metrics: AwardedReferrerMetricsRevShareLimit,
  rules: ReferralProgramRulesRevShareLimit,
): void => {
  validateRankedReferrerMetricsRevShareLimit(metrics, rules);

  makePriceUsdcSchema("AwardedReferrerMetricsRevShareLimit.standardAwardValue").parse(
    metrics.standardAwardValue,
  );

  makePriceUsdcSchema("AwardedReferrerMetricsRevShareLimit.awardPoolApproxValue").parse(
    metrics.awardPoolApproxValue,
  );

  if (metrics.awardPoolApproxValue.amount > rules.totalAwardPoolValue.amount) {
    throw new Error(
      `AwardedReferrerMetricsRevShareLimit: awardPoolApproxValue.amount ${metrics.awardPoolApproxValue.amount.toString()} exceeds totalAwardPoolValue.amount ${rules.totalAwardPoolValue.amount.toString()}.`,
    );
  }

  if (metrics.awardPoolApproxValue.amount > metrics.standardAwardValue.amount) {
    throw new Error(
      `AwardedReferrerMetricsRevShareLimit: awardPoolApproxValue.amount ${metrics.awardPoolApproxValue.amount.toString()} exceeds standardAwardValue.amount ${metrics.standardAwardValue.amount.toString()}.`,
    );
  }
};

export const buildAwardedReferrerMetricsRevShareLimit = (
  referrer: RankedReferrerMetricsRevShareLimit,
  standardAwardValue: PriceUsdc,
  awardPoolApproxValue: PriceUsdc,
  rules: ReferralProgramRulesRevShareLimit,
): AwardedReferrerMetricsRevShareLimit => {
  const result = {
    ...referrer,
    standardAwardValue,
    awardPoolApproxValue,
  } satisfies AwardedReferrerMetricsRevShareLimit;

  validateAwardedReferrerMetricsRevShareLimit(result, rules);
  return result;
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

export const validateUnrankedReferrerMetricsRevShareLimit = (
  metrics: UnrankedReferrerMetricsRevShareLimit,
): void => {
  validateReferrerMetrics(metrics);

  if (metrics.rank !== null) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: rank must be null, got: ${metrics.rank}.`,
    );
  }
  if (metrics.isQualified !== false) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: isQualified must be false, got: ${metrics.isQualified}.`,
    );
  }
  if (metrics.totalReferrals !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: totalReferrals must be 0, got: ${metrics.totalReferrals}.`,
    );
  }
  if (metrics.totalIncrementalDuration !== 0) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: totalIncrementalDuration must be 0, got: ${metrics.totalIncrementalDuration}.`,
    );
  }

  makePriceEthSchema("UnrankedReferrerMetricsRevShareLimit.totalRevenueContribution").parse(
    metrics.totalRevenueContribution,
  );
  if (metrics.totalRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: totalRevenueContribution.amount must be 0n, got: ${metrics.totalRevenueContribution.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema(
    "UnrankedReferrerMetricsRevShareLimit.totalBaseRevenueContribution",
  ).parse(metrics.totalBaseRevenueContribution);
  if (metrics.totalBaseRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: totalBaseRevenueContribution.amount must be 0n, got: ${metrics.totalBaseRevenueContribution.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareLimit.standardAwardValue").parse(
    metrics.standardAwardValue,
  );
  if (metrics.standardAwardValue.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: standardAwardValue.amount must be 0n, got: ${metrics.standardAwardValue.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareLimit.awardPoolApproxValue").parse(
    metrics.awardPoolApproxValue,
  );
  if (metrics.awardPoolApproxValue.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: awardPoolApproxValue.amount must be 0n, got: ${metrics.awardPoolApproxValue.amount.toString()}.`,
    );
  }
};

/**
 * Build an unranked zero-metrics rev-share-limit referrer record for an address not on the leaderboard.
 */
export const buildUnrankedReferrerMetricsRevShareLimit = (
  referrer: Address,
): UnrankedReferrerMetricsRevShareLimit => {
  const metrics = buildReferrerMetrics(referrer, 0, 0, priceEth(0n));

  const result = {
    ...metrics,
    totalBaseRevenueContribution: priceUsdc(0n),
    rank: null,
    isQualified: false,
    standardAwardValue: priceUsdc(0n),
    awardPoolApproxValue: priceUsdc(0n),
  } satisfies UnrankedReferrerMetricsRevShareLimit;

  validateUnrankedReferrerMetricsRevShareLimit(result);
  return result;
};
