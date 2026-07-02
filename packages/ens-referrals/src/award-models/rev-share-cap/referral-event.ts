import type { AccountId, Address, Duration, InterpretedName, UnixTimestamp } from "enssdk";
import type { Hash } from "viem";

import type { PriceEth, RegistrarActionType } from "@ensnode/ensnode-sdk";

/**
 * Represents a single raw referral event.
 *
 * Used as input to the sequential race algorithm for the rev-share-cap award model.
 * Events are processed in chronological order to determine award claims from the pool.
 */
export interface ReferralEvent {
  /**
   * The {@link AccountId} of the referrer.
   */
  referrer: AccountId;

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

  /**
   * FQDN of the name the referral applies to.
   */
  name: InterpretedName;

  /**
   * Type of registrar action.
   */
  actionType: RegistrarActionType;

  /**
   * Transaction hash of the onchain registrar action that produced this referral.
   */
  transactionHash: Hash;

  /**
   * Ethereum address of the registrant that paid for / performed the action.
   */
  registrant: Address;
}
