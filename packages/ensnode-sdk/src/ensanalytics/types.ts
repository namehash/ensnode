import type { Address } from "viem";

import type { Duration, UnixTimestamp } from "../shared";

/**
 * Represents the aggregated metrics for a single referrer.
 */
export interface AggregatedReferrerMetrics {
  /** The Ethereum address of the referrer */
  referrer: Address;
  /**
   * The total number of qualified referrals made by this referrer
   * @invariant Guaranteed to be a positive integer (> 0)
   */
  totalReferrals: number;
  /**
   * The total incremental duration (in seconds) of all referrals made by this referrer
   * @invariant Guaranteed to be a non-negative integer (>= 0), measured in seconds
   */
  totalIncrementalDuration: Duration;
}

/**
 * Request parameters for paginated top referrers query.
 */
export interface PaginatedTopReferrersRequest {
  /**
   * Current page number (1-indexed)
   * @invariant Must be a positive integer (>= 1)
   * @default 1
   */
  page?: number;
  /**
   * Maximum number of items per page
   * @invariant Must be a positive integer (>= 1)
   * @default 25
   */
  limit?: number;
}

/**
 * A paginated top referrers data with metadata.
 */
export interface PaginatedTopReferrers {
  /**
   * Array of top referrers for the current page
   * @invariant Array may be empty for the first page if there are no qualified referrers.
   */
  topReferrers: AggregatedReferrerMetrics[];
  /**
   * Total number of top referrers across all pages
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  total: number;
  /**
   * Current page number (1-indexed)
   * @invariant Guaranteed to be a positive integer (>= 1)
   */
  page: number;
  /**
   * Maximum number of items per page
   * @invariant Guaranteed to be a positive integer (>= 1)
   */
  limit: number;
  /**
   * Indicates whether there is a next page available
   * @invariant true if and only if (page * limit < total)
   */
  hasNext: boolean;
  /**
   * Indicates whether there is a previous page available
   * @invariant true if and only if (page > 1)
   */
  hasPrev: boolean;
  /** Unix timestamp of when the leaderboard was last updated */
  updatedAt: UnixTimestamp;
}

/**
 * A status code for top referrers API responses.
 */
export const PaginatedTopReferrersResponseCodes = {
  /**
   * Represents that the top referrers data is available.
   * @note The response may contain an empty array for the first page if there are no qualified referrers.
   * When the array is empty, total will be 0, page will be 1, and both hasNext and hasPrev will be false.
   */
  Ok: "ok",

  /**
   * Represents that the request failed due to pagination parameters being out of range.
   * @note This error is only returned when there is data available but the requested page exceeds the total pages.
   */
  PageOutOfRange: "page_out_of_range",

  /**
   * Represents that the top referrers data is not available.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link PaginatedTopReferrersResponseCodes}.
 */
export type PaginatedTopReferrersResponseCode =
  (typeof PaginatedTopReferrersResponseCodes)[keyof typeof PaginatedTopReferrersResponseCodes];

/**
 * A paginated top referrers response when the top referrers data is available.
 */
export type PaginatedTopReferrersResponseOk = {
  responseCode: typeof PaginatedTopReferrersResponseCodes.Ok;
  data: PaginatedTopReferrers;
};

/**
 * A paginated top referrers response when pagination parameters are out of range.
 */
export type PaginatedTopReferrersResponsePageOutOfRange = {
  responseCode: typeof PaginatedTopReferrersResponseCodes.PageOutOfRange;
  error: string;
  errorMessage: string;
  totalPages: number;
};

/**
 * A paginated top referrers response when the top referrers data is not available.
 */
export type PaginatedTopReferrersResponseError = {
  responseCode: typeof PaginatedTopReferrersResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A paginated top referrers API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type PaginatedTopReferrersResponse =
  | PaginatedTopReferrersResponseOk
  | PaginatedTopReferrersResponsePageOutOfRange
  | PaginatedTopReferrersResponseError;
