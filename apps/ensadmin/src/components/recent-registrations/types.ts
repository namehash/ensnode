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
export interface LatestRegistration {
  /**
   * recently registered ENS name
   */
  name: string;

  /**
   * a UNIX timestamp in seconds of when the name was originally created
   */
  createdAt: number;

  /**
   * a UNIX timestamp in seconds of when will the current owner's tenure end
   */
  expiryDate: number;

  /**
   * owner's address
   */
  owner: Address;

  /**
   * wrapped owner's address
   */
  wrappedOwner?: Address;
}

/**
 * Extended data associated with Registration event
 */
export interface Registration {
  /**
   * a UNIX timestamp in seconds of when the name was registered by its current owner
   */
  registrationDate: string;

  /**
   * a UNIX timestamp in seconds of when will the current owner's tenure end
   */
  expiryDate: string;

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
