import type { Address } from "viem";

/**
 * Data associated with a Registration
 */
export interface Registration {
  /**
   * Date object representing the registration date of the domain by its current owner.
   */
  registeredAt: Date;

  /**
   * Date object representing when the registration is scheduled to expire.
   */
  expiresAt: Date;

  /**
   * The registered ENS name
   */
  name: string;

  /**
   * Date object representing when the registered domain will be released, including the registration duration and grace period
   */
  releasesAt: Date;

  /**
   * The "official" owner of the domain in the ENS Registry.
   */
  ownerInRegistry: Address;

  /**
   * The owner of the domain according to the ENS NameWrapper.
   * If undefined, the domain associated with the registration is unwrapped (not in the ENS NameWrapper).
   */
  ownerInNameWrapper?: Address;

  /**
   * Effective owner of the registered domain.
   * Considers both ownerInRegistry and ownerInNameWrapper to determine the "effective" owner on a practical basis.
   */
  owner: Address;
}
