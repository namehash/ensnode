import type {
  ReferrerLeaderboardPage,
  ReferrerLeaderboardPaginationParams,
} from "@namehash/ens-referrals";

/**
 * Request parameters for a referrer leaderboard page query.
 */
export interface ReferrerLeaderboardPaginationRequest extends ReferrerLeaderboardPaginationParams {}

/**
 * A status code for a referrer leaderboard page API response.
 */
export const ReferrerLeaderboardPageResponseCodes = {
  /**
   * Represents that the requested referrer leaderboard page is available.
   */
  Ok: "ok",

  /**
   * Represents that the referrer leaderboard data is not available.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferrerLeaderboardPageResponseCodes}.
 */
export type ReferrerLeaderboardPageResponseCode =
  (typeof ReferrerLeaderboardPageResponseCodes)[keyof typeof ReferrerLeaderboardPageResponseCodes];

/**
 * A referrer leaderboard page response when the data is available.
 */
export type ReferrerLeaderboardPageResponseOk = {
  responseCode: typeof ReferrerLeaderboardPageResponseCodes.Ok;
  data: ReferrerLeaderboardPage;
};

/**
 * A referrer leaderboard page response when the data is not available.
 */
export type ReferrerLeaderboardPageResponseError = {
  responseCode: typeof ReferrerLeaderboardPageResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referrer leaderboard page API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerLeaderboardPageResponse =
  | ReferrerLeaderboardPageResponseOk
  | ReferrerLeaderboardPageResponseError;
