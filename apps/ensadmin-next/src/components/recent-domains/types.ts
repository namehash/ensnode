/**
 * Types for the recent domains component
 */
export interface RecentDomain {
  id: string;
  name: string;
  labelName: string;
  createdAt: string;
  expiryDate: string;
  owner: {
    id: string;
  };
}

export interface RecentDomainsResponse {
  domains: RecentDomain[];
} 
