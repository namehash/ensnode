import type { EncodedReferrer, zeroEncodedReferrer } from "@namehash/ens-referrals";
import type { Address } from "viem";

import type { InterpretedLabel, InterpretedName, Node } from "../ens";
import type { Duration, EventRef, PriceEth, UnixTimestamp } from "../shared";

export const RegistrarActionTypes = {
  Registration: "registration",
  Renewal: "renewal",
} as const;

export type RegistrarActionType = (typeof RegistrarActionTypes)[keyof typeof RegistrarActionTypes];

export const RegistrarEventNames = {
  NameRegistered: "NameRegistered",
  NameRenewed: "NameRenewed",
  ControllerAdded: "ControllerAdded",
  ControllerRemoved: "ControllerRemoved",
} as const;

export type RegistrarEventName = (typeof RegistrarEventNames)[keyof typeof RegistrarEventNames];

export type RegistrarEventRefNameRegistered = EventRef<typeof RegistrarEventNames.NameRegistered>;

export type RegistrarEventRefNameRenewed = EventRef<typeof RegistrarEventNames.NameRenewed>;

export type RegistrarEventRefControllerAdded = EventRef<typeof RegistrarEventNames.ControllerAdded>;

export type RegistrarEventRefControllerRemoved = EventRef<
  typeof RegistrarEventNames.ControllerRemoved
>;

export type RegistrarEventRef =
  | RegistrarEventRefNameRegistered
  | RegistrarEventRefNameRenewed
  | RegistrarEventRefControllerAdded
  | RegistrarEventRefControllerRemoved;

/**
 * Registrar Action
 */
export interface RegistrarAction {
  /**
   * Registrar Action ID
   *
   * A globally unique identifier of the Registrar Action.
   */
  id: string;

  /**
   * Type of registrar action
   */
  type: RegistrarActionType;

  /**
   * Node
   *
   * Node for the name associated with the registrar action.
   */
  node: Node;

  /**
   * Base cost
   *
   * Note: the "baseCost.amount" may be`0` or more.
   */
  baseCost: PriceEth;

  /**
   * Premium
   *
   * Note: the "premium.amount" may be`0` or more.
   */
  premium: PriceEth;

  /**
   * Total cost for performing the registrar action.
   *
   * Sum of `baseCost.amount` and `premium.amount`.
   *
   * Note: the "total.amount" may be`0` or more.
   */
  total: PriceEth;

  /**
   * Incremental Duration
   *
   * Represents the incremental increase in the duration of the lifespan of
   * the registration for `node` that was active as of `timestamp`.
   * Measured in seconds.
   *
   * A name with an active registration can be renewed at any time.
   *
   * Names that have expired may still be renewable.
   *
   * For example: assume the registration of a direct subname of Ethnames is
   * scheduled to expire on Jan 1, midnight UTC. It is currently 30 days after
   * this expiration time. Therefore, there are currently another 60 days of
   * grace period remaining for this name. Anyone can still make
   * a renewal of this name.
   *
   * Consider the following scenarios for renewals of a name that
   * has expired but is still within its grace period:
   *
   * 1) Expired (in grace period) -> Expired (in grace period):
   *    If a renewal is made for 10 days incremental duration,
   *    this name remains in an "expired" (in grace period) state, but it now
   *    has 70 days of grace period remaining instead of only 60.
   *
   * 2) Expired (in grace period) -> Active:
   *    If a renewal is made for 50 days incremental duration,
   *    this name is no longer "expired" (in grace period) and is active, but it now
   *    expires and begins a new grace period in 20 days.
   *
   * After the latest registration of a direct subname becomes expired by
   * more than the grace period, it can no longer be renewed by anyone.
   * It must first be registered again, starting a new registration lifecycle of
   * active / expiry / grace period / etc.
   */
  incrementalDuration: Duration;

  /**
   * Registrant
   *
   * Account that initiated the registrarAction and is paying the "total".
   * It may not be the owner of the name:
   *
   * 1. When a name is registered, the initial owner of the name may be
   *    distinct from the registrant.
   * 2. There are no restrictions on who may renew a name.
   *    Therefore the owner of the name may be distinct from the registrant.
   */
  registrant: Address;

  /**
   * Encoded Referrer
   *
   * Represents the "raw" 32-byte "referrer" value emitted onchain in
   * association with the registrar action.
   *
   * If a registrar / registrar controller doesn't support the concept of
   * referrers then this field is set to {@link zeroEncodedReferrer} value.
   */
  encodedReferrer: EncodedReferrer;

  /**
   * Decoded Referrer
   *
   * Represents ENSNode's subjective interpretation of
   * {@link RegistrarAction.encodedReferrer}.
   *
   * Invariants:
   * - If the first `12`-bytes of "encodedReferrer" are all `0`,
   *   then "decodedReferrer" is the last `20`-bytes of "encodedReferrer",
   *   else: "decodedReferrer" is the zero address.
   */
  decodedReferrer: Address;

  /**
   * Event
   *
   * References the EVM event which was used to derive the Registrar Action.
   */
  event: RegistrarEventRefNameRegistered | RegistrarEventRefNameRenewed;
}

/**
 * Registration
 *
 * Describes a certain `node` and when its registration expires.
 * Includes a reference to `parentNode` to allow data filtering.
 */
export interface Registration {
  node: Node;

  parentNode: Node;

  expiresAt: UnixTimestamp;
}

/**
 * Registration with Name Details
 *
 * Describes a view into Registration, including `label` and `name` the registration was made for.
 */
export interface RegistrationWithNameDetails extends Registration {
  label: InterpretedLabel;

  name: InterpretedName;
}

export interface RegistrarActionWithRegistration extends RegistrarAction {
  registration: RegistrationWithNameDetails;
}
