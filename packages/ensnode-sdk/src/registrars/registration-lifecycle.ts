import type { InterpretedLabel, InterpretedName, Node } from "../ens";
import type { UnixTimestamp } from "../shared";
import { type SerializedSubregistry, type Subregistry, serializeSubregistry } from "./subregistry";

/**
 * Registration Lifecycle Stages
 *
 * Important: this definition should not be used anywhere.
 * It's only here to capture some ideas that were shared in the team.
 */
const RegistrationLifecycleStages = {
  /**
   * Active
   *
   * Happens when
   * the current timestamp <= expiry.
   */
  Active: "registrationLifecycle_active",

  /**
   * Grace Period
   *
   * Happens when
   * `expiry < the current timestamp <= expiry + 90 days`.
   */
  GracePeriod: "registrationLifecycle_gracePeriod",

  /**
   * Released with Temporary Premium Price
   *
   * Happens when
   * `expiry + 90 days < the current timestamp <= expiry + 120 days`.
   */
  ReleasedWithTempPrice: "registrationLifecycle_releasedWithTempPrice",

  /**
   * Fully Released (Regular Price)
   *
   * Happens when
   * ` expiry + 120 days < the current timestamp`.
   */
  FullyReleased: "registrationLifecycle_fullyReleased",
} as const;

export type RegistrationLifecycleStage =
  (typeof RegistrationLifecycleStages)[keyof typeof RegistrationLifecycleStages];

/**
 * Registration Lifecycle
 */
export interface RegistrationLifecycle {
  /**
   * Subregistry that manages this Registration Lifecycle.
   */
  subregistry: Subregistry;

  /**
   * The node (namehash) of the FQDN of the domain the registration lifecycle
   * is associated with.
   *
   * Guaranteed to be a subname of the node (namehash) of the subregistry
   * identified by `subregistryId.subregistryId`.
   */
  node: Node;

  /**
   * Expires at
   *
   * Identifies when the Registration Lifecycle is scheduled to expire.
   */
  expiresAt: UnixTimestamp;
}

/**
 * Registration Lifecycle with Domain details.
 */
export interface RegistrationLifecycleWithDomain extends RegistrationLifecycle {
  /**
   * Domain
   *
   * Domain associated with the Registration Lifecycle.
   */
  domain: {
    /**
     * Subname
     *
     * A child name like `sub.name.eth`, whose parent is `name.eth`.
     */
    subname: InterpretedLabel;

    /**
     * Name
     *
     * FQDN on the domain associated with the Registration Lifecycle.
     *
     * Guarantees:
     * 1) `domain.name` is always `domain.subname` + `subregistry.name`.
     * 2) `namehash(domain.name)` is always `node`.
     */
    name: InterpretedName;
  };
}

/**
 * Serialized representation of {@link RegistrationLifecycle}.
 */
export interface SerializedRegistrationLifecycle
  extends Omit<RegistrationLifecycle, "subregistry"> {
  subregistry: SerializedSubregistry;
}

/**
 * Serialized representation of {@link RegistrationLifecycleWithDomain}.
 */
export interface SerializedRegistrationLifecycleWithDomain
  extends Omit<RegistrationLifecycleWithDomain, "subregistry"> {
  subregistry: SerializedSubregistry;
}

export function serializeRegistrationLifecycle(
  registrationLifecycle: RegistrationLifecycle,
): SerializedRegistrationLifecycle {
  return {
    subregistry: serializeSubregistry(registrationLifecycle.subregistry),
    node: registrationLifecycle.node,
    expiresAt: registrationLifecycle.expiresAt,
  };
}

export function serializeRegistrationLifecycleWithDomain(
  registrationLifecycle: RegistrationLifecycleWithDomain,
): SerializedRegistrationLifecycleWithDomain {
  return {
    ...serializeRegistrationLifecycle(registrationLifecycle),
    domain: registrationLifecycle.domain,
  };
}
