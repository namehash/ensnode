import type { Address } from "viem";

/**
 * Data associated with a Registration
 */
// TODO: fix the order of the fields for improved clarity
export interface Registration {
  /**
   * a UNIX timestamp in seconds of when the domain was registered by its current owner
   */
  registeredAt: string;

  /**
   * a UNIX timestamp in seconds when the registration is scheduled to expire
   */
  expiresAt: string;

  /**
   * The registered ENS name
   */
  name: string;

  /**
   * a UNIX timestamp in seconds when the registration is scheduled to expire, includes grace period
   */
  releasesAt: string;

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
