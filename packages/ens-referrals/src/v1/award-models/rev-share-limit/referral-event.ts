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
   */
  timestamp: UnixTimestamp;

  /**
   * Registrar action ID.
   *
   * A deterministic and globally unique identifier for the "logical registrar action"
   * associated with the ReferralEvent.
   *
   * A Ponder-encoded checkpoint string that uniquely and deterministically identifies
   * this event. Encodes all ordering-relevant properties:
   * `blockTimestamp → chainId → blockNumber → transactionIndex → eventType → eventIndex`
   *
   * This field alone is sufficient to establish a total chronological ordering over
   * all referral events.
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
