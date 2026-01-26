import type { Address } from "viem";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "./aggregations-v1";
import type { ReferrerLeaderboard } from "./leaderboard-v1";
import {
  type AwardedReferrerMetrics,
  buildUnrankedReferrerMetrics,
  type UnrankedReferrerMetrics,
} from "./referrer-metrics-v1";
import type { ReferralProgramRules } from "./rules-v1";

/**
 * The type of referrer detail data.
 */
export const ReferrerDetailTypeIds = {
  /**
   * Represents a referrer who is ranked on the leaderboard.
   */
  Ranked: "ranked",

  /**
   * Represents a referrer who is not ranked on the leaderboard.
   */
  Unranked: "unranked",
} as const;

/**
 * The derived string union of possible {@link ReferrerDetailTypeIds}.
 */
export type ReferrerDetailTypeId =
  (typeof ReferrerDetailTypeIds)[keyof typeof ReferrerDetailTypeIds];

/**
 * Referrer detail data for a specific referrer address on the leaderboard.
 *
 * Includes the referrer's awarded metrics from the leaderboard plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerDetailTypeIds.Ranked}.
 *
 * @see {@link AwardedReferrerMetrics}
 */
export interface ReferrerDetailRanked {
  /**
   * The type of referrer detail data.
   */
  type: typeof ReferrerDetailTypeIds.Ranked;

  /**
   * The {@link ReferralProgramRules} used to calculate the {@link AwardedReferrerMetrics}.
   */
  rules: ReferralProgramRules;

  /**
   * The awarded referrer metrics from the leaderboard.
   *
   * Contains all calculated metrics including score, rank, qualification status,
   * and award pool share information.
   */
  referrer: AwardedReferrerMetrics;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetrics;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerDetailData} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer detail data for a specific referrer address NOT on the leaderboard.
 *
 * Includes the referrer's unranked metrics (with null rank and isQualified: false) plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerDetailTypeIds.Unranked}.
 *
 * @see {@link UnrankedReferrerMetrics}
 */
export interface ReferrerDetailUnranked {
  /**
   * The type of referrer detail data.
   */
  type: typeof ReferrerDetailTypeIds.Unranked;

  /**
   * The {@link ReferralProgramRules} used to calculate the {@link UnrankedReferrerMetrics}.
   */
  rules: ReferralProgramRules;

  /**
   * The unranked referrer metrics (not on the leaderboard).
   *
   * Contains all calculated metrics with rank set to null and isQualified set to false.
   */
  referrer: UnrankedReferrerMetrics;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetrics;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link UnrankedReferrerDetailData} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer detail data for a specific referrer address.
 *
 * Use the `type` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerDetail = ReferrerDetailRanked | ReferrerDetailUnranked;

/**
 * Get the detail for a specific referrer from the leaderboard.
 *
 * Returns a {@link ReferrerDetailRanked} if the referrer is on the leaderboard,
 * or a {@link ReferrerDetailUnranked} if the referrer has no referrals.
 *
 * @param referrer - The referrer address to look up
 * @param leaderboard - The referrer leaderboard to query
 * @returns The appropriate {@link ReferrerDetail} (ranked or unranked)
 */
export const getReferrerDetail = (
  referrer: Address,
  leaderboard: ReferrerLeaderboard,
): ReferrerDetail => {
  const awardedReferrerMetrics = leaderboard.referrers.get(referrer);

  // If referrer is on the leaderboard, return their ranked metrics
  if (awardedReferrerMetrics) {
    return {
      type: ReferrerDetailTypeIds.Ranked,
      rules: leaderboard.rules,
      referrer: awardedReferrerMetrics,
      aggregatedMetrics: leaderboard.aggregatedMetrics,
      accurateAsOf: leaderboard.accurateAsOf,
    };
  }

  // If referrer not found, return an unranked referrer record
  return {
    type: ReferrerDetailTypeIds.Unranked,
    rules: leaderboard.rules,
    referrer: buildUnrankedReferrerMetrics(referrer),
    aggregatedMetrics: leaderboard.aggregatedMetrics,
    accurateAsOf: leaderboard.accurateAsOf,
  };
};
