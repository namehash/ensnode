import type { Address } from "viem";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "./aggregations";
import type { ReferrerLeaderboard } from "./leaderboard";
import {
  type AwardedReferrerMetrics,
  buildUnrankedReferrerMetrics,
  type UnrankedReferrerMetrics,
} from "./referrer-metrics";
import type { ReferralProgramRules } from "./rules";
import { calcReferralProgramStatus, type ReferralProgramStatusId } from "./status";

/**
 * The type of referrer edition metrics data.
 */
export const ReferrerEditionMetricsTypeIds = {
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
 * The derived string union of possible {@link ReferrerEditionMetricsTypeIds}.
 */
export type ReferrerEditionMetricsTypeId =
  (typeof ReferrerEditionMetricsTypeIds)[keyof typeof ReferrerEditionMetricsTypeIds];

/**
 * Referrer edition metrics data for a specific referrer address on the leaderboard.
 *
 * Includes the referrer's awarded metrics from the leaderboard plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerEditionMetricsTypeIds.Ranked}.
 *
 * @see {@link AwardedReferrerMetrics}
 */
export interface ReferrerEditionMetricsRanked {
  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Ranked;

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
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsRanked} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer edition metrics data for a specific referrer address NOT on the leaderboard.
 *
 * Includes the referrer's unranked metrics (with null rank and isQualified: false) plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerEditionMetricsTypeIds.Unranked}.
 *
 * @see {@link UnrankedReferrerMetrics}
 */
export interface ReferrerEditionMetricsUnranked {
  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Unranked;

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
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsUnranked} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer edition metrics data for a specific referrer address.
 *
 * Use the `type` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerEditionMetrics = ReferrerEditionMetricsRanked | ReferrerEditionMetricsUnranked;

/**
 * Get the edition metrics for a specific referrer from the leaderboard.
 *
 * Returns a {@link ReferrerEditionMetricsRanked} if the referrer is on the leaderboard,
 * or a {@link ReferrerEditionMetricsUnranked} if the referrer has no referrals.
 *
 * @param referrer - The referrer address to look up
 * @param leaderboard - The referrer leaderboard to query
 * @returns The appropriate {@link ReferrerEditionMetrics} (ranked or unranked)
 */
export const getReferrerEditionMetrics = (
  referrer: Address,
  leaderboard: ReferrerLeaderboard,
): ReferrerEditionMetrics => {
  const awardedReferrerMetrics = leaderboard.referrers.get(referrer);
  const status = calcReferralProgramStatus(leaderboard.rules, leaderboard.accurateAsOf);

  // If referrer is on the leaderboard, return their ranked metrics
  if (awardedReferrerMetrics) {
    return {
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: leaderboard.rules,
      referrer: awardedReferrerMetrics,
      aggregatedMetrics: leaderboard.aggregatedMetrics,
      status,
      accurateAsOf: leaderboard.accurateAsOf,
    };
  }

  // If referrer not found, return an unranked referrer record
  return {
    type: ReferrerEditionMetricsTypeIds.Unranked,
    rules: leaderboard.rules,
    referrer: buildUnrankedReferrerMetrics(referrer),
    aggregatedMetrics: leaderboard.aggregatedMetrics,
    status,
    accurateAsOf: leaderboard.accurateAsOf,
  };
};
