import type { Address } from "viem";

import type { ReferralProgramCycleId } from "../cycle";
import type { ReferrerLeaderboardPage, ReferrerLeaderboardPageParams } from "../leaderboard-page";
import type { ReferrerDetail } from "../referrer-detail";

/**
 * Request parameters for a referrer leaderboard page query.
 */
export interface ReferrerLeaderboardPageRequest extends ReferrerLeaderboardPageParams {
  /** The referral program cycle ID */
  cycle: ReferralProgramCycleId;
}

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
export const ReferrerDetailAllCyclesResponseCodes = {
  /**
   * Represents that the referrer detail data across all cycles is available.
   */
  Ok: "ok",

  /**
   * Represents that an error occurred while fetching the data.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferrerDetailAllCyclesResponseCodes}.
 */
export type ReferrerDetailAllCyclesResponseCode =
  (typeof ReferrerDetailAllCyclesResponseCodes)[keyof typeof ReferrerDetailAllCyclesResponseCodes];

/**
 * Referrer detail data across all cycles.
 *
 * Maps each cycle ID to the referrer's detail for that cycle.
 */
export type ReferrerDetailAllCyclesData = Record<ReferralProgramCycleId, ReferrerDetail>;

/**
 * A successful response containing referrer detail for all cycles.
 */
export type ReferrerDetailAllCyclesResponseOk = {
  responseCode: typeof ReferrerDetailAllCyclesResponseCodes.Ok;
  data: ReferrerDetailAllCyclesData;
};

/**
 * A referrer detail across all cycles response when an error occurs.
 */
export type ReferrerDetailAllCyclesResponseError = {
  responseCode: typeof ReferrerDetailAllCyclesResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referrer detail across all cycles API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerDetailAllCyclesResponse =
  | ReferrerDetailAllCyclesResponseOk
  | ReferrerDetailAllCyclesResponseError;
