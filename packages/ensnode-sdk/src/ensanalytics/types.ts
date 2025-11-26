import type { Address } from "viem";

import type { Duration, PriceUsdc, UnixTimestamp } from "../shared";

/**
 * The default number of items per page for paginated aggregated referrer queries.
 */
export const ITEMS_PER_PAGE_DEFAULT = 25;

/**
 * The maximum number of items per page for paginated aggregated referrer queries.
 */
export const ITEMS_PER_PAGE_MAX = 100;

/**
 * Number of seconds in one year (365.2425 days on average).
 * Used to convert totalIncrementalDuration (seconds) to Qualifying Referral Years.
 *
 * Calculation: 60 seconds * 60 minutes * 24 hours * 365.2425 days
 */
export const SECONDS_PER_YEAR = 31_556_952;

/**
 * The ENS Holiday Awards Pool amount in USD for the referral program.
 * This is the total pool that gets distributed among referrers based on their contribution.
 */
export const ENS_HOLIDAY_AWARDS_POOL_USD = 10_000;

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
 * Base pagination parameters for paginated queries.
 */
export interface PaginationParams {
  /**
   * Requested page number (1-indexed)
   * @invariant Must be a positive integer (>= 1)
   * @default 1
   */
  page?: number;

  /**
   * Maximum number of items per page
   * @invariant Must be a positive integer (>= 1) and less than or equal to {@link ITEMS_PER_PAGE_MAX}
   * @default {@link ITEMS_PER_PAGE_DEFAULT}
   */
  itemsPerPage?: number;
}

/**
 * Request parameters for paginated aggregated referrers query.
 */
export interface PaginatedAggregatedReferrersRequest extends PaginationParams {}

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
   * Pagination parameters
   * @invariant Stores the pagination parameters from the request
   */
  paginationParams: PaginationParams;

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
  | PaginatedAggregatedReferrersResponseError;

/**
 * Referrer detail information for a specific referrer address.
 *
 * Extends {@link AggregatedReferrerMetrics} with additional fields including
 * referrer score, contribution percentage, and award pool share in USD.
 */
export interface ReferrerDetail extends AggregatedReferrerMetrics {
  /**
   * The referrer's score measured in "Qualifying Referral Years".
   *
   * 1 Referrer Point is awarded for each Qualifying Referral Year.
   * Referrer Score is the sum of Referrer Points (i.e., sum of Qualifying Referral Years).
   *
   * Calculated as: totalIncrementalDuration / {@link SECONDS_PER_YEAR}
   *
   * Supports fractional values (e.g., 0.5 represents half a year of referrals).
   *
   * @invariant Guaranteed to be a non-negative number (>= 0)
   */
  referrerScore: number;

  /**
   * The grand total referrer score across ALL referrers (sum of all Qualifying Referral Years).
   * @invariant Guaranteed to be a non-negative number (>= 0)
   */
  grandTotalReferrerScore: number;

  /**
   * The referrer's contribution as a decimal between 0 and 1 (both inclusive).
   * Calculated as: referrerScore / grandTotalReferrerScore
   * @invariant 0 <= referrerContribution <= 1
   */
  referrerContribution: number;

  /**
   * The referrer's award pool share in USD (USDC)
   * Calculated as: referrerContribution * {@link ENS_HOLIDAY_AWARDS_POOL_USD}
   * Amount is in the smallest unit of USDC (6 decimals)
   */
  awardPoolShare: PriceUsdc;

  /** Unix timestamp of when the data was last updated */
  updatedAt: UnixTimestamp;
}

/**
 * Request parameters for referrer detail query.
 */
export interface ReferrerDetailRequest {
  /** The Ethereum address of the referrer to query */
  referrer: Address;
}

/**
 * A status code for referrer detail API responses.
 */
export const ReferrerDetailResponseCodes = {
  /**
   * Represents that the referrer detail data is available.
   */
  Ok: "ok",

  /**
   * Represents that an error occurred while fetching the data.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferrerDetailResponseCodes}.
 */
export type ReferrerDetailResponseCode =
  (typeof ReferrerDetailResponseCodes)[keyof typeof ReferrerDetailResponseCodes];

/**
 * A referrer detail response when the data is available.
 */
export type ReferrerDetailResponseOk = {
  responseCode: typeof ReferrerDetailResponseCodes.Ok;
  data: ReferrerDetail;
};

/**
 * A referrer detail response when an error occurs.
 */
export type ReferrerDetailResponseError = {
  responseCode: typeof ReferrerDetailResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referrer detail API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerDetailResponse = ReferrerDetailResponseOk | ReferrerDetailResponseError;
