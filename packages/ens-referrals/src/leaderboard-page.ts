import type { AggregatedReferrerMetrics } from "./aggregations";
import type { ReferrerLeaderboard } from "./leaderboard";
import { isNonNegativeInteger, isPositiveInteger } from "./number";
import type { AwardedReferrerMetrics } from "./referrer-metrics";
import type { ReferralProgramRules } from "./rules";
import type { UnixTimestamp } from "./time";

/**
 * The default number of referrers per leaderboard page.
 */
export const REFERRERS_PER_LEADERBOARD_PAGE_DEFAULT = 25;

/**
 * The maximum number of referrers per leaderboard page.
 */

export const REFERRERS_PER_LEADERBOARD_PAGE_MAX = 100;

/**
 * Pagination params for leaderboard queries.
 */
export interface ReferrerLeaderboardPaginationParams {
  /**
   * Requested referrer leaderboard page number (1-indexed)
   * @invariant Must be a positive integer (>= 1)
   * @default 1
   */
  page?: number;

  /**
   * Maximum number of referrers to return per leaderboard page
   * @invariant Must be a positive integer (>= 1) and less than or equal to {@link REFERRERS_PER_LEADERBOARD_PAGE_MAX}
   * @default {@link REFERRERS_PER_LEADERBOARD_PAGE_DEFAULT}
   */
  itemsPerPage?: number;
}

const validateReferrerLeaderboardPaginationParams = (
  params: ReferrerLeaderboardPaginationParams,
): void => {
  if (params.page !== undefined && !isPositiveInteger(params.page)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationParams: ${params.page}. page must be a positive integer.`,
    );
  }
  if (params.itemsPerPage !== undefined && !isPositiveInteger(params.itemsPerPage)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationParams: ${params.itemsPerPage}. itemsPerPage must be a positive integer.`,
    );
  }
  if (
    params.itemsPerPage !== undefined &&
    params.itemsPerPage > REFERRERS_PER_LEADERBOARD_PAGE_MAX
  ) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationParams: ${params.itemsPerPage}. itemsPerPage must be less than or equal to ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}.`,
    );
  }
};

export const buildReferrerLeaderboardPaginationParams = (
  params: ReferrerLeaderboardPaginationParams,
): Required<ReferrerLeaderboardPaginationParams> => {
  const result = {
    page: params.page ?? 1,
    itemsPerPage: params.itemsPerPage ?? REFERRERS_PER_LEADERBOARD_PAGE_DEFAULT,
  } satisfies Required<ReferrerLeaderboardPaginationParams>;
  validateReferrerLeaderboardPaginationParams(result);
  return result;
};

export interface ReferrerLeaderboardPaginationContext
  extends Required<ReferrerLeaderboardPaginationParams> {
  /**
   * Total number of referrers across all leaderboard pages
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  totalRecords: number;

  /**
   * Total number of pages in the leaderboard
   * @invariant Guaranteed to be a positive integer (>= 1)
   */
  totalPages: number;

  /**
   * Indicates if there is a next page available
   * @invariant true if and only if (`page` * `itemsPerPage` < `total`)
   */
  hasNext: boolean;

  /**
   * Indicates if there is a previous page available
   * @invariant true if and only if (`page` > 1)
   */
  hasPrev: boolean;

  /**
   * The start index of the referrers on the page (0-indexed)
   *
   * `undefined` if and only if `totalRecords` is 0.
   *
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  startIndex?: number;

  /**
   * The end index of the referrers on the page (0-indexed)
   *
   * `undefined` if and only if `totalRecords` is 0.
   *
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   * @invariant If `totalRecords` is > 0:
   *            - Guaranteed to be greater than or equal to `startIndex`.
   *            - Guaranteed to be less than `totalRecords`.
   */
  endIndex?: number;
}

export const validateReferrerLeaderboardPaginationContext = (
  context: ReferrerLeaderboardPaginationContext,
): void => {
  validateReferrerLeaderboardPaginationParams(context);
  if (!isNonNegativeInteger(context.totalRecords)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationContext: total must be a non-negative integer but is ${context.totalRecords}.`,
    );
  }
  const startIndex = (context.page - 1) * context.itemsPerPage;
  const endIndex = startIndex + context.itemsPerPage;

  if (!context.hasNext && endIndex < context.totalRecords) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationContext: if hasNext is false, endIndex (${endIndex}) must be greater than or equal to total (${context.totalRecords}).`,
    );
  } else if (context.hasNext && context.page * context.itemsPerPage >= context.totalRecords) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationContext: if hasNext is true, endIndex (${endIndex}) must be less than total (${context.totalRecords}).`,
    );
  }
  if (!context.hasPrev && context.page !== 1) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationContext: if hasPrev is false, page must be the first page (1) but is ${context.page}.`,
    );
  } else if (context.hasPrev && context.page === 1) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationContext: if hasPrev is true, page must not be the first page (1) but is ${context.page}.`,
    );
  }
};

export const buildReferrerLeaderboardPaginationContext = (
  optionalParams: ReferrerLeaderboardPaginationParams,
  leaderboard: ReferrerLeaderboard,
): ReferrerLeaderboardPaginationContext => {
  const materializedParams = buildReferrerLeaderboardPaginationParams(optionalParams);

  const totalRecords = leaderboard.referrers.size;

  const totalPages = Math.max(1, Math.ceil(totalRecords / materializedParams.itemsPerPage));

  if (materializedParams.page > totalPages) {
    throw new Error(
      `Invalid ReferrerLeaderboardPaginationContext: page ${materializedParams.page} exceeds total pages ${totalPages}.`,
    );
  }

  if (totalRecords === 0) {
    return {
      ...materializedParams,
      totalRecords: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      startIndex: undefined,
      endIndex: undefined,
    } satisfies ReferrerLeaderboardPaginationContext;
  }

  const startIndex = (materializedParams.page - 1) * materializedParams.itemsPerPage;
  const maxTheoreticalIndexOnPage = startIndex + (materializedParams.itemsPerPage - 1);
  const endIndex = Math.min(maxTheoreticalIndexOnPage, totalRecords - 1);
  const hasNext = maxTheoreticalIndexOnPage < totalRecords;
  const hasPrev = materializedParams.page > 1;

  const result = {
    ...materializedParams,
    totalRecords,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
  } satisfies ReferrerLeaderboardPaginationContext;
  validateReferrerLeaderboardPaginationContext(result);
  return result;
};

/**
 * A page of referrers from the referrer leaderboard.
 */
export interface ReferrerLeaderboardPage {
  /**
   * The {@link ReferralProgramRules} used to generate the {@link ReferrerLeaderboard}
   * that this {@link ReferrerLeaderboardPage} comes from.
   */
  rules: ReferralProgramRules;

  /**
   * Ordered list of {@link AwardedReferrerMetrics} for the {@link ReferrerLeaderboardPage}
   * described by `paginationContext` within the related {@link ReferrerLeaderboard}.
   *
   * @invariant Array will be empty if `paginationContext.totalRecords` is 0.
   * @invariant Array entries are ordered by `rank` (descending).
   */
  referrers: AwardedReferrerMetrics[];

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetrics;

  /**
   * The {@link ReferrerLeaderboardPaginationContext} of this {@link ReferrerLeaderboardPage} relative to the overall
   * {@link ReferrerLeaderboard}.
   */
  paginationContext: ReferrerLeaderboardPaginationContext;

  /** The {@link UnixTimestamp} of when the {@link ReferrerLeaderboard} was last updated */
  updatedAt: UnixTimestamp;
}

export const getReferrerLeaderboardPage = (
  paginationParams: ReferrerLeaderboardPaginationParams,
  leaderboard: ReferrerLeaderboard,
): ReferrerLeaderboardPage => {
  const paginationContext = buildReferrerLeaderboardPaginationContext(
    paginationParams,
    leaderboard,
  );

  let referrers: AwardedReferrerMetrics[];

  if (
    paginationContext.totalRecords > 0 &&
    typeof paginationContext.startIndex !== "undefined" &&
    typeof paginationContext.endIndex !== "undefined"
  ) {
    // extract the referrers from the leaderboard in the range specified by `paginationContext`.
    referrers = Array.from(leaderboard.referrers.values()).slice(
      paginationContext.startIndex,
      paginationContext.endIndex + 1, // For `slice`, this is exclusive of the element at the index 'end'. We need it to be inclusive, hence plus one.
    );
  } else {
    referrers = [];
  }

  return {
    rules: leaderboard.rules,
    referrers,
    aggregatedMetrics: leaderboard.aggregatedMetrics,
    paginationContext,
    updatedAt: leaderboard.updatedAt,
  };
};
