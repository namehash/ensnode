import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { ReferralProgramStatusId } from "../../status";
import type { ReferrerEditionMetricsTypeIds } from "../shared/edition-metrics";
import type { AggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import type {
  AwardedReferrerMetricsRevShareLimit,
  UnrankedReferrerMetricsRevShareLimit,
} from "./metrics";
import type { ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * Referrer edition metrics data for a specific referrer on a rev-share-limit leaderboard.
 *
 * Includes the referrer's awarded metrics from the leaderboard plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerEditionMetricsTypeIds.Ranked}.
 *
 * @see {@link AwardedReferrerMetricsRevShareLimit}
 */
export interface ReferrerEditionMetricsRankedRevShareLimit {
  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Ranked;

  /**
   * The {@link ReferralProgramRulesRevShareLimit} used to calculate the {@link AwardedReferrerMetricsRevShareLimit}.
   */
  rules: ReferralProgramRulesRevShareLimit;

  /**
   * The awarded referrer metrics from the leaderboard.
   *
   * Contains all calculated metrics including score, rank, qualification status,
   * and award pool share information.
   */
  referrer: AwardedReferrerMetricsRevShareLimit;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit;

  /**
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsRankedRevShareLimit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer edition metrics data for a specific referrer address NOT on the rev-share-limit leaderboard.
 *
 * Includes the referrer's unranked metrics (with null rank and isQualified: false) plus timestamp.
 *
 * Invariants:
 * - `type` is always {@link ReferrerEditionMetricsTypeIds.Unranked}.
 *
 * @see {@link UnrankedReferrerMetricsRevShareLimit}
 */
export interface ReferrerEditionMetricsUnrankedRevShareLimit {
  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Unranked;

  /**
   * The {@link ReferralProgramRulesRevShareLimit} used to calculate the {@link UnrankedReferrerMetricsRevShareLimit}.
   */
  rules: ReferralProgramRulesRevShareLimit;

  /**
   * The unranked referrer metrics (not on the leaderboard).
   *
   * Contains all calculated metrics with rank set to null and isQualified set to false.
   */
  referrer: UnrankedReferrerMetricsRevShareLimit;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit;

  /**
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsUnrankedRevShareLimit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}
