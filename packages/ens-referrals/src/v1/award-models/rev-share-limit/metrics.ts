import type { Address } from "viem";

import { type PriceUsdc, priceEth, priceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceEthSchema, makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import type { ReferrerMetrics } from "../../referrer-metrics";
import { buildReferrerMetrics, validateReferrerMetrics } from "../../referrer-metrics";
import { SECONDS_PER_YEAR } from "../../time";
import type { ReferrerRank } from "../shared/rank";
import { validateReferrerRank } from "../shared/rank";
import { isReferrerQualifiedRevShareLimit, type ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * Extends {@link ReferrerMetrics} with computed base revenue contribution.
 */
export interface ReferrerMetricsRevShareLimit extends ReferrerMetrics {
  /**
   * The referrer's base revenue contribution
   * (base-fee-only: `rules.baseAnnualRevenueContribution` × years of incremental duration).
   * Used for qualification and award calculation in the rev-share-limit model.
   *
   * @invariant Guaranteed to be `priceUsdc(rules.baseAnnualRevenueContribution.amount * BigInt(totalIncrementalDuration) / BigInt(SECONDS_PER_YEAR))`
   */
  totalBaseRevenueContribution: PriceUsdc;
}

export const validateReferrerMetricsRevShareLimit = (
  metrics: ReferrerMetricsRevShareLimit,
  rules: ReferralProgramRulesRevShareLimit,
): void => {
  validateReferrerMetrics(metrics);

  const expectedTotalBaseRevenueContribution = priceUsdc(
    (rules.baseAnnualRevenueContribution.amount * BigInt(metrics.totalIncrementalDuration)) /
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
  rules: ReferralProgramRulesRevShareLimit,
): ReferrerMetricsRevShareLimit => {
  const totalBaseRevenueContribution = priceUsdc(
    (rules.baseAnnualRevenueContribution.amount * BigInt(metrics.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR),
  );

  const result = {
    ...metrics,
    totalBaseRevenueContribution,
  } satisfies ReferrerMetricsRevShareLimit;

  validateReferrerMetricsRevShareLimit(result, rules);
  return result;
};

/**
 * Extends {@link ReferrerMetricsRevShareLimit} with rank, qualification status, and admin disqualification.
 */
export interface RankedReferrerMetricsRevShareLimit extends ReferrerMetricsRevShareLimit {
  /**
   * The referrer's rank on the {@link ReferrerLeaderboardRevShareLimit} relative to all other referrers.
   */
  rank: ReferrerRank;

  /**
   * Identifies if the referrer meets the qualifications of the {@link ReferralProgramRulesRevShareLimit} to receive a non-zero `cappedAwardValue`.
   *
   * @invariant true if and only if `totalBaseRevenueContribution` is greater than or equal to
   *   {@link ReferralProgramRulesRevShareLimit.minBaseRevenueContribution} AND
   *   {@link isAdminDisqualified} is false.
   */
  isQualified: boolean;

  /**
   * Whether this referrer has been admin-disqualified from the edition.
   *
   * @invariant When true, {@link isQualified} is false.
   */
  isAdminDisqualified: boolean;

  /**
   * The reason for admin disqualification, or null if not disqualified.
   *
   * @invariant null when {@link isAdminDisqualified} is false.
   * @invariant Non-empty string when {@link isAdminDisqualified} is true.
   */
  adminDisqualificationReason: string | null;
}

export const validateRankedReferrerMetricsRevShareLimit = (
  metrics: RankedReferrerMetricsRevShareLimit,
  rules: ReferralProgramRulesRevShareLimit,
): void => {
  validateReferrerMetricsRevShareLimit(metrics, rules);
  validateReferrerRank(metrics.rank);

  const expectedIsQualified = isReferrerQualifiedRevShareLimit(
    metrics.referrer,
    metrics.totalBaseRevenueContribution,
    rules,
  );
  if (metrics.isQualified !== expectedIsQualified) {
    throw new Error(
      `RankedReferrerMetricsRevShareLimit: Invalid isQualified: ${metrics.isQualified}, expected: ${expectedIsQualified}.`,
    );
  }

  const disqualification =
    rules.disqualifications.find((d) => d.referrer === metrics.referrer) ?? null;

  if (metrics.isAdminDisqualified !== (disqualification !== null)) {
    throw new Error(
      `RankedReferrerMetricsRevShareLimit: Invalid isAdminDisqualified: ${metrics.isAdminDisqualified}, expected: ${disqualification !== null}.`,
    );
  }

  const expectedReason = disqualification?.reason ?? null;
  if (metrics.adminDisqualificationReason !== expectedReason) {
    throw new Error(
      `RankedReferrerMetricsRevShareLimit: Invalid adminDisqualificationReason: ${metrics.adminDisqualificationReason}, expected: ${expectedReason}.`,
    );
  }
};

export const buildRankedReferrerMetricsRevShareLimit = (
  referrer: ReferrerMetricsRevShareLimit,
  rank: ReferrerRank,
  rules: ReferralProgramRulesRevShareLimit,
): RankedReferrerMetricsRevShareLimit => {
  const disqualification =
    rules.disqualifications.find((d) => d.referrer === referrer.referrer) ?? null;

  const result = {
    ...referrer,
    rank,
    isQualified: isReferrerQualifiedRevShareLimit(
      referrer.referrer,
      referrer.totalBaseRevenueContribution,
      rules,
    ),
    isAdminDisqualified: disqualification !== null,
    adminDisqualificationReason: disqualification?.reason ?? null,
  } satisfies RankedReferrerMetricsRevShareLimit;

  validateRankedReferrerMetricsRevShareLimit(result, rules);
  return result;
};

/**
 * Extends {@link RankedReferrerMetricsRevShareLimit} with approximate award value.
 */
export interface AwardedReferrerMetricsRevShareLimit extends RankedReferrerMetricsRevShareLimit {
  /**
   * The uncapped USDC award value for this referrer, computed as
   * `maxBaseRevenueShare × totalBaseRevenueContribution`.
   *
   * Represents what the referrer would receive if the pool were unlimited and the referrer were qualified.
   * Independent of the pool state, qualification status, and admin disqualification status.
   */
  uncappedAwardValue: PriceUsdc;

  /**
   * The USDC value of the referrer's (tentative) award.
   *
   * This is the amount actually claimed from the pool by this referrer, capped by
   * the remaining pool at the time of their qualifying referrals.
   *
   * @invariant Guaranteed to be a valid PriceUsdc with amount between 0 and {@link ReferralProgramRulesRevShareLimit.awardPool.amount} (inclusive)
   * @invariant Always <= uncappedAwardValue.amount
   * @invariant Amount equal to 0 when {@link isAdminDisqualified} is true.
   * @invariant Amount equal to 0 when {@link isQualified} is false.
   */
  cappedAwardValue: PriceUsdc;
}

export const validateAwardedReferrerMetricsRevShareLimit = (
  metrics: AwardedReferrerMetricsRevShareLimit,
  rules: ReferralProgramRulesRevShareLimit,
): void => {
  validateRankedReferrerMetricsRevShareLimit(metrics, rules);

  makePriceUsdcSchema("AwardedReferrerMetricsRevShareLimit.uncappedAwardValue").parse(
    metrics.uncappedAwardValue,
  );

  makePriceUsdcSchema("AwardedReferrerMetricsRevShareLimit.cappedAwardValue").parse(
    metrics.cappedAwardValue,
  );

  if (metrics.isAdminDisqualified && metrics.cappedAwardValue.amount !== 0n) {
    throw new Error(
      `AwardedReferrerMetricsRevShareLimit: cappedAwardValue.amount must be 0n for admin-disqualified referrers, got ${metrics.cappedAwardValue.amount.toString()}.`,
    );
  }

  if (!metrics.isQualified && metrics.cappedAwardValue.amount !== 0n) {
    throw new Error(
      `AwardedReferrerMetricsRevShareLimit: cappedAwardValue.amount must be 0n for unqualified referrers, got ${metrics.cappedAwardValue.amount.toString()}.`,
    );
  }

  if (metrics.cappedAwardValue.amount > rules.awardPool.amount) {
    throw new Error(
      `AwardedReferrerMetricsRevShareLimit: cappedAwardValue.amount ${metrics.cappedAwardValue.amount.toString()} exceeds awardPool.amount ${rules.awardPool.amount.toString()}.`,
    );
  }

  if (metrics.cappedAwardValue.amount > metrics.uncappedAwardValue.amount) {
    throw new Error(
      `AwardedReferrerMetricsRevShareLimit: cappedAwardValue.amount ${metrics.cappedAwardValue.amount.toString()} exceeds uncappedAwardValue.amount ${metrics.uncappedAwardValue.amount.toString()}.`,
    );
  }
};

export const buildAwardedReferrerMetricsRevShareLimit = (
  referrer: RankedReferrerMetricsRevShareLimit,
  uncappedAwardValue: PriceUsdc,
  cappedAwardValue: PriceUsdc,
  rules: ReferralProgramRulesRevShareLimit,
): AwardedReferrerMetricsRevShareLimit => {
  const result = {
    ...referrer,
    uncappedAwardValue,
    cappedAwardValue,
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
  rules: ReferralProgramRulesRevShareLimit,
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

  const disqualification =
    rules.disqualifications.find((d) => d.referrer === metrics.referrer) ?? null;

  if (metrics.isAdminDisqualified !== (disqualification !== null)) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: isAdminDisqualified: ${metrics.isAdminDisqualified}, expected: ${disqualification !== null}.`,
    );
  }

  const expectedReason = disqualification?.reason ?? null;
  if (metrics.adminDisqualificationReason !== expectedReason) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: adminDisqualificationReason: ${metrics.adminDisqualificationReason}, expected: ${expectedReason}.`,
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

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareLimit.totalBaseRevenueContribution").parse(
    metrics.totalBaseRevenueContribution,
  );
  if (metrics.totalBaseRevenueContribution.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: totalBaseRevenueContribution.amount must be 0n, got: ${metrics.totalBaseRevenueContribution.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareLimit.uncappedAwardValue").parse(
    metrics.uncappedAwardValue,
  );
  if (metrics.uncappedAwardValue.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: uncappedAwardValue.amount must be 0n, got: ${metrics.uncappedAwardValue.amount.toString()}.`,
    );
  }

  makePriceUsdcSchema("UnrankedReferrerMetricsRevShareLimit.cappedAwardValue").parse(
    metrics.cappedAwardValue,
  );
  if (metrics.cappedAwardValue.amount !== 0n) {
    throw new Error(
      `Invalid UnrankedReferrerMetricsRevShareLimit: cappedAwardValue.amount must be 0n, got: ${metrics.cappedAwardValue.amount.toString()}.`,
    );
  }
};

/**
 * Build an unranked zero-metrics rev-share-limit referrer record for an address not on the leaderboard.
 */
export const buildUnrankedReferrerMetricsRevShareLimit = (
  referrer: Address,
  rules: ReferralProgramRulesRevShareLimit,
): UnrankedReferrerMetricsRevShareLimit => {
  const metrics = buildReferrerMetrics(referrer, 0, 0, priceEth(0n));

  const disqualification =
    rules.disqualifications.find((d) => d.referrer === metrics.referrer) ?? null;

  const result = {
    ...metrics,
    totalBaseRevenueContribution: priceUsdc(0n),
    rank: null,
    isQualified: false,
    uncappedAwardValue: priceUsdc(0n),
    cappedAwardValue: priceUsdc(0n),
    isAdminDisqualified: disqualification !== null,
    adminDisqualificationReason: disqualification?.reason ?? null,
  } satisfies UnrankedReferrerMetricsRevShareLimit;

  validateUnrankedReferrerMetricsRevShareLimit(result, rules);
  return result;
};
