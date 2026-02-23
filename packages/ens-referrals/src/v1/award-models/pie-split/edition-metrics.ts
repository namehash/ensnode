import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { ReferralProgramStatusId } from "../../status";
import type { ReferrerEditionMetricsTypeIds } from "../shared/edition-metrics";
import type { AggregatedReferrerMetricsPieSplit } from "./aggregations";
import type { AwardedReferrerMetricsPieSplit, UnrankedReferrerMetricsPieSplit } from "./metrics";
import type { ReferralProgramRulesPieSplit } from "./rules";

/**
 * Referrer edition metrics data for a specific referrer address on the pie-split leaderboard.
 *
 * Includes the referrer's awarded metrics from the leaderboard plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerEditionMetricsTypeIds.Ranked}.
 *
 * @see {@link AwardedReferrerMetricsPieSplit}
 */
export interface ReferrerEditionMetricsRankedPieSplit {
  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Ranked;

  /**
   * The {@link ReferralProgramRulesPieSplit} used to calculate the {@link AwardedReferrerMetricsPieSplit}.
   */
  rules: ReferralProgramRulesPieSplit;

  /**
   * The awarded referrer metrics from the leaderboard.
   *
   * Contains all calculated metrics including score, rank, qualification status,
   * and award pool share information.
   */
  referrer: AwardedReferrerMetricsPieSplit;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsPieSplit;

  /**
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsRankedPieSplit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer edition metrics data for a specific referrer address NOT on the pie-split leaderboard.
 *
 * Includes the referrer's unranked metrics (with null rank and isQualified: false) plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerEditionMetricsTypeIds.Unranked}.
 *
 * @see {@link UnrankedReferrerMetricsPieSplit}
 */
export interface ReferrerEditionMetricsUnrankedPieSplit {
  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Unranked;

  /**
   * The {@link ReferralProgramRulesPieSplit} used to calculate the {@link UnrankedReferrerMetricsPieSplit}.
   */
  rules: ReferralProgramRulesPieSplit;

  /**
   * The unranked referrer metrics (not on the leaderboard).
   *
   * Contains all calculated metrics with rank set to null and isQualified set to false.
   */
  referrer: UnrankedReferrerMetricsPieSplit;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsPieSplit;

  /**
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsUnrankedPieSplit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}
