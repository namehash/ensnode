import type { Address } from "viem";

import type { AggregatedReferrerMetrics, Duration, UnixTimestamp } from "@ensnode/ensnode-sdk";

/**
 * Represents a snapshot of aggregated metrics for all referrers with 1 or more qualifying referrals as of `updatedAt`.
 */
export interface AggregatedReferrerSnapshot {
  /**
   * Ordered map containing `AggregatedReferrerMetrics` for all referrers with 1 or more qualifying referrals as of `updatedAt`.
   * @invariant Map entries are ordered by `totalIncrementalDuration` (descending).
   * @invariant Map may be empty if there are no referrers with 1 or more qualifying referrals as of `updatedAt`.
   * @invariant If an `Address` is not a key in this map then that `Address` had 0 qualifying referrals as of `updatedAt`.
   * @invariant Each `Address` key in this map is unique.
   */
  referrers: Map<Address, AggregatedReferrerMetrics>;

  /** Unix timestamp identifying when this `AggregatedReferrerSnapshot` was generated. */
  updatedAt: UnixTimestamp;

  /**
   * @invariant The sum of `totalReferrals` across all `referrers`.
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  grandTotalReferrals: number;

  /**
   * @invariant The sum of `totalIncrementalDuration` across all `referrers`.
   * @invariant Guaranteed to be a non-negative integer (>= 0), measured in seconds
   */
  grandTotalIncrementalDuration: Duration;
}
