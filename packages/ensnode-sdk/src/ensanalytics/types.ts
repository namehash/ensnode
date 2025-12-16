import type {
  ReferrerDetail,
  ReferrerLeaderboardPage,
  ReferrerLeaderboardPageParams,
} from "@namehash/ens-referrals";
import type { Address } from "viem";

/**
 * Request parameters for a referrer leaderboard page query.
 */
export interface ReferrerLeaderboardPageRequest extends ReferrerLeaderboardPageParams {}

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
 * A referrer detail response when the data is available for a referrer on the leaderboard.
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
