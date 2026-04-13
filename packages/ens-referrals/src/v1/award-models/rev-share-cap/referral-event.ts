import type { Address, UnixTimestamp } from "enssdk";

import type { Duration, PriceEth } from "@ensnode/ensnode-sdk";

/**
 * Represents a single raw referral event.
 *
 * Used as input to the sequential race algorithm for the rev-share-cap award model.
 * Events are processed in chronological order to determine award claims from the pool.
 */
export interface ReferralEvent {
  /**
   * The fully lowercase Ethereum address of the referrer.
   */
  referrer: Address;

  /**
   * Unix seconds block timestamp.
   */
  timestamp: UnixTimestamp;

  /**
   * Registrar action ID.
   *
   * @invariant Deterministic and globally unique identifier for the "logical registrar action"
   *   associated with this ReferralEvent.
   * @invariant Sorting by this value achieves a chronological ordering of each registrar action
   *   by the order they were executed onchain.
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
