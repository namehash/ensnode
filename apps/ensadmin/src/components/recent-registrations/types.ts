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

export interface Registration {
  registrationDate: string;
  expiryDate: string;
  domain: LatestRegistrationResult;
}

export interface RecentRegistrationsResponse {
  registrations: Registration[];
}
