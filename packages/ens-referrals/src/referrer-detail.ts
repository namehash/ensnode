import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "./referrer-metrics";
import type { UnixTimestamp } from "./time";

/**
 * Referrer detail data for a specific referrer address on the leaderboard.
 *
 * Includes the referrer's awarded metrics from the leaderboard plus timestamp.
 *
 * @see {@link AwardedReferrerMetrics}
 */
export interface ReferrerDetailData {
  /**
   * The awarded referrer metrics from the leaderboard.
   *
   * Contains all calculated metrics including score, rank, qualification status,
   * and award pool share information.
   */
  referrer: AwardedReferrerMetrics;

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
 * @see {@link UnrankedReferrerMetrics}
 */
export interface UnrankedReferrerDetailData {
  /**
   * The unranked referrer metrics (not on the leaderboard).
   *
   * Contains all calculated metrics with rank set to null and isQualified set to false.
   */
  referrer: UnrankedReferrerMetrics;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link UnrankedReferrerDetailData} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}
