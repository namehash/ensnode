import type { AwardedReferrerMetrics } from "./referrer-metrics";
import type { UnixTimestamp } from "./time";

/**
 * Referrer detail data for a specific referrer address.
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
