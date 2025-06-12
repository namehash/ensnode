import type { Address } from "viem";

/**
 * The data model returned by a GraphQL query for the latest registrations.
 */
export interface LatestRegistrationResult {
  name: string;
  createdAt: string;
  expiryDate: string;
  owner: {
    id: Address;
  };
  wrappedOwner?: {
    id: Address;
  };
}

/**
 Data associated with a Registration event.
 **/
//TODO: to be unified with Registration
//TODO:Check whether these two expiryDate fields in those types always match before merging them
export interface LatestRegistration {
  /**
   * The registered ENS name
   */
  name: string;

  /**
   * a UNIX timestamp in seconds of when the domain was originally created
   */
  createdAt: number;

  /**
   * a UNIX timestamp in seconds when the registration is scheduled to expire
   */
  expiresAt: number;

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
  owner: Address
}

/**
 * Extended data associated with Registration event
 */
export interface Registration {
  /**
   * a UNIX timestamp in seconds of when the name was registered by its current owner
   */
  registeredAt: string;

  /**
   * a UNIX timestamp in seconds when the registration is scheduled to expire
   */
  expiresAt: string;

  /**
   * Data associated with a Registration event.
   */
  registration: LatestRegistration;
}

/**
 * Data about 5 most recent registrations
 */
export interface RecentRegistrationsResponse {
  registrations: Registration[];
}
