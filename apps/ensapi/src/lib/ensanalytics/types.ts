import type { Address } from "viem";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

/**
 * Represents data for a single referrer and their referral count
 */
export interface ReferrerData {
  /** The Ethereum address of the referrer */
  referrer: Address;
  /** The total number of referrals made by this referrer */
  totalReferrals: number;
}

/**
 * Paginated response containing referrer data with pagination metadata
 */
export interface PaginatedReferrers {
  /** Array of referrer data for the current page */
  referrers: ReferrerData[];
  /** Total number of referrers across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Maximum number of items per page */
  limit: number;
  /** Indicates whether there is a next page available */
  hasNext: boolean;
  /** Indicates whether there is a previous page available */
  hasPrev: boolean;
  /** Unix timestamp of when the cache was last updated */
  updatedAt: UnixTimestamp;
}

/**
 * Represents the in-memory cache of referrer data.
 * All fields are updated atomically when the cache is refreshed.
 */
export interface ReferrerCache {
  /** Array of all referrer data sorted by total referrals */
  referrers: ReferrerData[];
  /** Unix timestamp of when the cache was last updated */
  updatedAt: UnixTimestamp;
}
