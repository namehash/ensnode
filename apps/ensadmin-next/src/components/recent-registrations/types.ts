import { Hex } from "viem";

/**
 * Types for the recent registrations component
 */
export interface Domain {
  name: string;
  createdAt: string;
  expiryDate: string;
  owner: {
    id: Hex;
  };
  wrappedOwner?: {
    id: Hex;
  };
}

export interface Registration {
  registrationDate: string;
  expiryDate: string;
  domain: Domain;
}

export interface RecentRegistrationsResponse {
  registrations: Registration[];
}
