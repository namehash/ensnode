import type { Address } from "viem";

/**
 * Data associated with Registration event
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

  //TODO: Do we even want to keep these two types (createdAt & expiresAt - the nested one)?
  // We never use it in the Recent Registrations panel (but maybe they will be usefull for something else later?)
  // If so, we have to rename the nested (inside "domain" in GQL result) expiresAt field somehow to differentiate between this one and the one in the registration itself
  // as they hold different values (afaik for the nested one it's the outer expiresAt + grace period? cause it matches the 90 days difference that would then occur)
  /**
   * a UNIX timestamp in seconds of when the domain was originally created
   */
  domainCreatedAt: string;

  /**
   * a UNIX timestamp in seconds when the registration is scheduled to expire, includes grace period
   */
  expiresAtWithGracePeriod: string;

  /**
   * The "true" owner of the domain in the ENS Registry.
   */
  ownerInRegistry: Address;

  /**
   * The owner according to the ENS NameWrapper.
   * If undefined, the domain associated with the registration is unwrapped (not in the ENS NameWrapper).
   */
  ownerInNameWrapper?: Address;

  /**
   * Effective owner of the registered domain.
   * TODO: Ask @lightwalker about precise definition of this field
   * TODO: (if it should be changed/expanded or swapped with ownerInRegistry's def)
   */
  owner: Address;
}
