import type { Address } from "viem";

import type { ReferralProgramCycleConfig, ReferralProgramCycleSlug } from "../cycle";
import type { ReferrerLeaderboardPage, ReferrerLeaderboardPageParams } from "../leaderboard-page";
import type { ReferrerDetail } from "../referrer-detail";

/**
 * Request parameters for a referrer leaderboard page query.
 */
export interface ReferrerLeaderboardPageRequest extends ReferrerLeaderboardPageParams {
  /** The referral program cycle slug */
  cycle: ReferralProgramCycleSlug;
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
 * Maximum number of cycles that can be requested in a single {@link ReferrerDetailCyclesRequest}.
 */
export const MAX_CYCLES_PER_REQUEST = 20;

/**
 * Request parameters for referrer detail query.
 */
export interface ReferrerDetailCyclesRequest {
  /** The Ethereum address of the referrer to query */
  referrer: Address;
  /** Array of cycle slugs to query (min 1, max {@link MAX_CYCLES_PER_REQUEST}, must be distinct) */
  cycles: ReferralProgramCycleSlug[];
}

/**
 * A status code for referrer detail API responses.
 */
export const ReferrerDetailCyclesResponseCodes = {
  /**
   * Represents that the referrer detail data for the requested cycles is available.
   */
  Ok: "ok",

  /**
   * Represents that an error occurred while fetching the data.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferrerDetailCyclesResponseCodes}.
 */
export type ReferrerDetailCyclesResponseCode =
  (typeof ReferrerDetailCyclesResponseCodes)[keyof typeof ReferrerDetailCyclesResponseCodes];

/**
 * Referrer detail data for requested cycles.
 *
 * Maps each requested cycle slug to the referrer's detail for that cycle.
 * Uses Partial because TypeScript cannot know at compile time which specific cycle
 * slugs are requested. At runtime, when responseCode is Ok, all requested cycle slugs
 * are guaranteed to be present in this record.
 */
export type ReferrerDetailCyclesData = Partial<Record<ReferralProgramCycleSlug, ReferrerDetail>>;

/**
 * A successful response containing referrer detail for the requested cycles.
 */
export type ReferrerDetailCyclesResponseOk = {
  responseCode: typeof ReferrerDetailCyclesResponseCodes.Ok;
  data: ReferrerDetailCyclesData;
};

/**
 * A referrer detail cycles response when an error occurs.
 */
export type ReferrerDetailCyclesResponseError = {
  responseCode: typeof ReferrerDetailCyclesResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referrer detail cycles API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerDetailCyclesResponse =
  | ReferrerDetailCyclesResponseOk
  | ReferrerDetailCyclesResponseError;

/**
 * A status code for referral program cycle config set API responses.
 */
export const ReferralProgramCycleConfigSetResponseCodes = {
  /**
   * Represents that the cycle config set is available.
   */
  Ok: "ok",

  /**
   * Represents that the cycle config set is not available.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferralProgramCycleConfigSetResponseCodes}.
 */
export type ReferralProgramCycleConfigSetResponseCode =
  (typeof ReferralProgramCycleConfigSetResponseCodes)[keyof typeof ReferralProgramCycleConfigSetResponseCodes];

/**
 * The data payload containing cycle configs.
 * Cycles are sorted in descending order by start timestamp.
 */
export type ReferralProgramCycleConfigSetData = {
  cycles: ReferralProgramCycleConfig[];
};

/**
 * A successful response containing the configured cycle config set.
 */
export type ReferralProgramCycleConfigSetResponseOk = {
  responseCode: typeof ReferralProgramCycleConfigSetResponseCodes.Ok;
  data: ReferralProgramCycleConfigSetData;
};

/**
 * A cycle config set response when an error occurs.
 */
export type ReferralProgramCycleConfigSetResponseError = {
  responseCode: typeof ReferralProgramCycleConfigSetResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referral program cycle config set API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferralProgramCycleConfigSetResponse =
  | ReferralProgramCycleConfigSetResponseOk
  | ReferralProgramCycleConfigSetResponseError;
