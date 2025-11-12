import type { Address } from "viem";

import type { Duration, UnixTimestamp } from "../shared";

/**
 * The default number of items per page for paginated aggregated referrer queries.
 */
export const PAGINATION_DEFAULT_LIMIT = 25;

/**
 * The maximum number of items per page for paginated aggregated referrer queries.
 */
export const PAGINATION_MAX_LIMIT = 100;

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
 * Represents the aggregated metrics for a single referrer with contribution percentages.
 * Extends {@link AggregatedReferrerMetrics} with additional fields that show the referrer's
 * contribution as a percentage of the grand totals.
 */
export interface AggregatedReferrerMetricsContribution extends AggregatedReferrerMetrics {
  /**
   * The referrer's contribution to the grand total referrals as a decimal between 0 and 1 (inclusive).
   * Calculated as: totalReferrals / grandTotalReferrals
   * @invariant 0 <= totalReferralsContribution <= 1
   */
  totalReferralsContribution: number;

  /**
   * The referrer's contribution to the grand total incremental duration as a decimal between 0 and 1 (inclusive).
   * Calculated as: totalIncrementalDuration / grandTotalIncrementalDuration
   * @invariant 0 <= totalIncrementalDurationContribution <= 1
   */
  totalIncrementalDurationContribution: number;
}

/**
 * Request parameters for paginated aggregated referrers query.
 */
export interface PaginatedAggregatedReferrersRequest {
  /**
   * Requested page number (1-indexed)
   * @invariant Must be a positive integer (>= 1)
   * @default 1
   */
  page?: number;

  /**
   * Maximum number of items per page
   * @invariant Must be a positive integer (>= 1) and less than or equal to {@link PAGINATION_MAX_LIMIT}
   * @default {@link PAGINATION_DEFAULT_LIMIT}
   */
  itemsPerPage?: number;
}

/**
 * Paginated aggregated referrers data with metadata.
 */
export interface PaginatedAggregatedReferrers {
  /**
   * Array of aggregated referrers for the current page with contribution percentages
   * @invariant Array may be empty for the first page if there are no qualified referrers.
   */
  referrers: AggregatedReferrerMetricsContribution[];

  /**
   * Total number of aggregated referrers across all pages
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
  itemsPerPage: number;

  /**
   * Indicates whether there is a next page available
   * @invariant true if and only if (page * itemsPerPage < total)
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
 * A status code for paginated aggregated referrers API responses.
 */
export const PaginatedAggregatedReferrersResponseCodes = {
  /**
   * Represents that the aggregated referrers data is available.
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
   * Represents that the aggregated referrers data is not available.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link PaginatedAggregatedReferrersResponseCodes}.
 */
export type PaginatedAggregatedReferrersResponseCode =
  (typeof PaginatedAggregatedReferrersResponseCodes)[keyof typeof PaginatedAggregatedReferrersResponseCodes];

/**
 * A paginated aggregated referrers response when the data is available.
 */
export type PaginatedAggregatedReferrersResponseOk = {
  responseCode: typeof PaginatedAggregatedReferrersResponseCodes.Ok;
  data: PaginatedAggregatedReferrers;
};

/**
 * A paginated aggregated referrers response when pagination parameters are out of range.
 */
export type PaginatedAggregatedReferrersResponsePageOutOfRange = {
  responseCode: typeof PaginatedAggregatedReferrersResponseCodes.PageOutOfRange;
  error: string;
  errorMessage: string;
  totalPages: number;
};

/**
 * A paginated aggregated referrers response when the data is not available.
 */
export type PaginatedAggregatedReferrersResponseError = {
  responseCode: typeof PaginatedAggregatedReferrersResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A paginated aggregated referrers API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type PaginatedAggregatedReferrersResponse =
  | PaginatedAggregatedReferrersResponseOk
  | PaginatedAggregatedReferrersResponsePageOutOfRange
  | PaginatedAggregatedReferrersResponseError;
