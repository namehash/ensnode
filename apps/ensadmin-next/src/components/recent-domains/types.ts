/**
 * Types for the recent domains component
 */
export interface Domain {
  id: string;
  name: string;
  labelName: string;
  createdAt: string;
  expiryDate: string;
  owner: {
    id: string;
  };
}

export interface Registration {
  registrationDate: string;
  expiryDate: string;
  domain: Domain;
}

export interface RecentDomainsResponse {
  registrations: Registration[];
}
