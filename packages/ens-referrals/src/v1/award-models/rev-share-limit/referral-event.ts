import type { Address } from "viem";

import type { Duration, PriceEth, UnixTimestamp } from "@ensnode/ensnode-sdk";

/**
 * Represents a single raw referral event.
 *
 * Used as input to the sequential race algorithm for the rev-share-limit award model.
 * Events are processed in chronological order to determine award claims from the pool.
 */
export interface ReferralEvent {
  /**
   * The fully lowercase Ethereum address of the referrer.
   */
  referrer: Address;

  /**
   * Unix seconds block timestamp.
   * Used as the primary sort key for chronological ordering.
   */
  timestamp: UnixTimestamp;

  /**
   * Block number. Used for tie-breaking within the same timestamp.
   */
  blockNumber: bigint;

  /**
   * Transaction hash. Used for tie-breaking within the same block.
   */
  transactionHash: `0x${string}`;

  /**
   * Registrar action ID.
   */
  id: string;

  /**
   * Duration in seconds contributed by this single referral event.
   */
  incrementalDuration: Duration;

  /**
   * Revenue contribution in ETH from this single referral event.
   */
  incrementalRevenueContribution: PriceEth;
}
