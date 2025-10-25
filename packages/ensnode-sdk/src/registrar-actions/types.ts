import type { Address, Hash, Hex } from "viem";
import type { Node } from "../ens";
import type { ChainId, Price, UnixTimestamp } from "../shared";

export const RegistrarActionType = {
  Registration: "registration",
  Renewal: "renewal",
} as const;

export type RegistrarActionTypes = (typeof RegistrarActionType)[keyof typeof RegistrarActionType];

/**
 * Raw Referrer
 *
 * Guaranteed to be a string representation of 32-bytes.
 */
export type RawReferrer = Hex;

/**
 * Registrar Action
 */
export interface RegistrarAction {
  /**
   * Type of registrar action
   */
  type: RegistrarActionTypes;

  /**
   * Node
   *
   * Node for which registrar action was executed.
   */
  node: Node;

  /**
   * Base cost
   */
  baseCost: Price;

  /**
   * Premium
   */
  premium: Price;

  /**
   * Total cost of preforming the registrar action.
   *
   * Sum of `baseCost` and `premium`.
   */
  total: Price;

  /**
   * Registrant
   *
   * Account that initiated the registrarAction and is paying the "total".
   * Note: the “total” may be`0` or more.
   */
  registrant: Address;

  /**
   * Raw Referrer
   *
   * A 32-bytes value.
   */
  rawReferrer: RawReferrer;

  /**
   * Interpreted Referrer
   *
   * Invariants:
   * - If the first `12`-bytes of “rawReferrer” are all `0`,
   *   then “interpretedReferrer” is the last `20`-bytes of “rawReferrer”,
   *   else: “interpretedReferrer” is the zero address.
   */
  interpretedReferrer: Address;

  /**
   * Block timestamp
   */
  blockTimestamp: UnixTimestamp;

  /**
   * Chain ID
   */
  chainId: ChainId;

  /**
   * Transaction Hash
   */
  transactionHash: Hash;
}
