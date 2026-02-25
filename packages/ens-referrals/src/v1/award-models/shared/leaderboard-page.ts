import type { Address } from "viem";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { ReferrerLeaderboard } from "../../leaderboard";
import { isNonNegativeInteger, isPositiveInteger } from "../../number";
import type { ReferralProgramStatusId } from "../../status";
import type { ReferralProgramAwardModel } from "./rules";

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
export interface ReferrerLeaderboardPageParams {
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
  recordsPerPage?: number;
}

const validateReferrerLeaderboardPageParams = (params: ReferrerLeaderboardPageParams): void => {
  if (params.page !== undefined && !isPositiveInteger(params.page)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageParams: ${params.page}. page must be a positive integer.`,
    );
  }
  if (params.recordsPerPage !== undefined && !isPositiveInteger(params.recordsPerPage)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageParams: ${params.recordsPerPage}. recordsPerPage must be a positive integer.`,
    );
  }
  if (
    params.recordsPerPage !== undefined &&
    params.recordsPerPage > REFERRERS_PER_LEADERBOARD_PAGE_MAX
  ) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageParams: ${params.recordsPerPage}. recordsPerPage must be less than or equal to ${REFERRERS_PER_LEADERBOARD_PAGE_MAX}.`,
    );
  }
};

export const buildReferrerLeaderboardPageParams = (
  params: ReferrerLeaderboardPageParams,
): Required<ReferrerLeaderboardPageParams> => {
  const result = {
    page: params.page ?? 1,
    recordsPerPage: params.recordsPerPage ?? REFERRERS_PER_LEADERBOARD_PAGE_DEFAULT,
  } satisfies Required<ReferrerLeaderboardPageParams>;
  validateReferrerLeaderboardPageParams(result);
  return result;
};

export interface ReferrerLeaderboardPageContext extends Required<ReferrerLeaderboardPageParams> {
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
   * @invariant true if and only if (`page` * `recordsPerPage` < `totalRecords`)
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

export const validateReferrerLeaderboardPageContext = (
  context: ReferrerLeaderboardPageContext,
): void => {
  validateReferrerLeaderboardPageParams(context);
  if (!isNonNegativeInteger(context.totalRecords)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: totalRecords must be a non-negative integer but is ${context.totalRecords}.`,
    );
  }

  // Validate totalPages
  if (!isPositiveInteger(context.totalPages)) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: totalPages must be a positive integer (>= 1) but is ${context.totalPages}.`,
    );
  }

  const expectedTotalPages =
    context.totalRecords === 0 ? 1 : Math.ceil(context.totalRecords / context.recordsPerPage);

  if (context.totalPages !== expectedTotalPages) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: totalPages is ${context.totalPages} but expected ${expectedTotalPages} based on totalRecords (${context.totalRecords}) and recordsPerPage (${context.recordsPerPage}).`,
    );
  }

  if (context.page > context.totalPages) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: page ${context.page} exceeds totalPages ${context.totalPages}.`,
    );
  }

  // Validate startIndex and endIndex
  const expectedStartIndex = (context.page - 1) * context.recordsPerPage;
  const expectedEndIndex = Math.min(
    expectedStartIndex + context.recordsPerPage - 1,
    context.totalRecords - 1,
  );

  if (context.totalRecords === 0) {
    if (context.startIndex !== undefined) {
      throw new Error(
        `Invalid ReferrerLeaderboardPageContext: startIndex must be undefined when totalRecords is 0 but is ${context.startIndex}.`,
      );
    }
    if (context.endIndex !== undefined) {
      throw new Error(
        `Invalid ReferrerLeaderboardPageContext: endIndex must be undefined when totalRecords is 0 but is ${context.endIndex}.`,
      );
    }
  } else {
    if (context.startIndex !== expectedStartIndex) {
      throw new Error(
        `Invalid ReferrerLeaderboardPageContext: startIndex is ${context.startIndex} but expected ${expectedStartIndex} based on page (${context.page}) and recordsPerPage (${context.recordsPerPage}).`,
      );
    }
    if (context.endIndex !== expectedEndIndex) {
      throw new Error(
        `Invalid ReferrerLeaderboardPageContext: endIndex is ${context.endIndex} but expected ${expectedEndIndex} based on startIndex (${expectedStartIndex}), recordsPerPage (${context.recordsPerPage}), and totalRecords (${context.totalRecords}).`,
      );
    }
    if (
      typeof context.endIndex !== "undefined" &&
      typeof context.startIndex !== "undefined" &&
      context.endIndex < context.startIndex
    ) {
      throw new Error(
        `Invalid ReferrerLeaderboardPageContext: endIndex (${context.endIndex}) must be greater than or equal to startIndex (${context.startIndex}).`,
      );
    }
  }

  const startIndex = (context.page - 1) * context.recordsPerPage;
  const endIndex = startIndex + context.recordsPerPage;

  if (!context.hasNext && endIndex < context.totalRecords) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: if hasNext is false, endIndex (${endIndex}) must be greater than or equal to totalRecords (${context.totalRecords}).`,
    );
  } else if (context.hasNext && context.page * context.recordsPerPage >= context.totalRecords) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: if hasNext is true, endIndex (${endIndex}) must be less than totalRecords (${context.totalRecords}).`,
    );
  }
  if (!context.hasPrev && context.page !== 1) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: if hasPrev is false, page must be the first page (1) but is ${context.page}.`,
    );
  } else if (context.hasPrev && context.page === 1) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: if hasPrev is true, page must not be the first page (1) but is ${context.page}.`,
    );
  }
};

export const buildReferrerLeaderboardPageContext = (
  optionalParams: ReferrerLeaderboardPageParams,
  leaderboard: ReferrerLeaderboard,
): ReferrerLeaderboardPageContext => {
  const materializedParams = buildReferrerLeaderboardPageParams(optionalParams);

  const totalRecords = leaderboard.referrers.size;

  const totalPages = Math.max(1, Math.ceil(totalRecords / materializedParams.recordsPerPage));

  if (materializedParams.page > totalPages) {
    throw new Error(
      `Invalid ReferrerLeaderboardPageContext: page ${materializedParams.page} exceeds total pages ${totalPages}.`,
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
    } satisfies ReferrerLeaderboardPageContext;
  }

  const startIndex = (materializedParams.page - 1) * materializedParams.recordsPerPage;
  const maxTheoreticalIndexOnPage = startIndex + (materializedParams.recordsPerPage - 1);
  const endIndex = Math.min(maxTheoreticalIndexOnPage, totalRecords - 1);
  const hasNext = maxTheoreticalIndexOnPage < totalRecords - 1;
  const hasPrev = materializedParams.page > 1;

  const result = {
    ...materializedParams,
    totalRecords,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
  } satisfies ReferrerLeaderboardPageContext;
  validateReferrerLeaderboardPageContext(result);
  return result;
};

/**
 * Base fields shared by all leaderboard page variants.
 */
export interface BaseReferrerLeaderboardPage {
  /**
   * Discriminant identifying the award model for this leaderboard page.
   */
  awardModel: ReferralProgramAwardModel;

  /**
   * The {@link ReferrerLeaderboardPageContext} of this page relative to the overall leaderboard.
   */
  pageContext: ReferrerLeaderboardPageContext;

  /**
   * The status of the referral program ("Scheduled", "Active", or "Closed")
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build this page was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Extracts the referrers for the current page from a fully-ranked Map.
 * Generic over the referrer type so each model variant retains its specific type.
 */
export function sliceReferrers<T>(
  referrers: Map<Address, T>,
  pageContext: ReferrerLeaderboardPageContext,
): T[] {
  // pageContext invariants: startIndex and endIndex are defined iff totalRecords > 0
  if (
    pageContext.totalRecords === 0 ||
    pageContext.startIndex === undefined ||
    pageContext.endIndex === undefined
  ) {
    return [];
  }
  const all = [...referrers.values()];
  return all.slice(pageContext.startIndex, pageContext.endIndex + 1);
}
