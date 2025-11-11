import type {
  AggregatedReferrerMetrics,
  Duration,
  UnixTimestamp,
} from "@ensnode/ensnode-sdk";

/**
 * Represents a snapshot of top referrers.
 */
export interface TopReferrersSnapshot {
  /**
   * Array of top referrers sorted by total incremental duration (descending)
   * @invariant Array may be empty if there are no qualified referrers.
   */
  topReferrers: AggregatedReferrerMetrics[];
  /** Unix timestamp of when the top referrers were last updated */
  updatedAt: UnixTimestamp;
  /**
   * The sum of totalReferrals across all referrers
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  grandTotalReferrals: number;
  /**
   * The sum of totalIncrementalDuration across all referrers
   * @invariant Guaranteed to be a non-negative integer (>= 0), measured in seconds
   */
  grandTotalIncrementalDuration: Duration;
}
