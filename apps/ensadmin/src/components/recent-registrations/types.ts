import type { Address } from "viem";

/**
 * Types for the recent registrations component
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
  A "pure" version of LatestRegistrationResult that streamlines data usage in RecentRegistrations component.
 @params:
 * name - string - recently registered name
 * createdAt - number - a UNIX timestamp in seconds of when the name was originally created
 * expiryDate - number - a UNIX timestamp in seconds of when will the current owner's tenure end
 * owner - Address -  owner's address
 * wrappedOwner - Address - optional - wrapped owner's address
 **/
export interface LatestRegistration {
  name: string;
  createdAt: number;
  expiryDate: number;
  owner:  Address;
  wrappedOwner?: Address;
}

export interface Registration {
  registrationDate: string;
  expiryDate: string;
  domain: LatestRegistration;
}

export interface RecentRegistrationsResponse {
  registrations: Registration[];
}
