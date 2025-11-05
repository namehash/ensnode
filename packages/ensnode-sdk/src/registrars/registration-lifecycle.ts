import type { Node } from "../ens";
import type { UnixTimestamp } from "../shared";
import type { Subregistry } from "./subregistry";

export const RegistrationLifecycleStages = {
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
   * Subregistry account that this Registration Lifecycle belongs to.
   */
  subregistry: Subregistry;

  /**
   * The node of the FQDN of the domain this is associated with,
   * guaranteed to be a subname of the associated subregistry
   * for which the registration was executed.
   */
  node: Node;

  /**
   * Expires at
   *
   * The moment when the RegistrationLifecycle will transition
   * from {@link RegistrationLifecycleStages.Active}
   * to  {@link RegistrationLifecycleStages.GracePeriod}.
   */
  expiresAt: UnixTimestamp;
}
