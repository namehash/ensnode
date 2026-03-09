import type { ReferralProgramAwardModels } from "./rules";

/**
 * The type of referrer edition metrics data.
 */
export const ReferrerEditionMetricsTypeIds = {
  /**
   * Represents a referrer who is ranked on the leaderboard.
   */
  Ranked: "ranked",

  /**
   * Represents a referrer who is not ranked on the leaderboard.
   */
  Unranked: "unranked",
} as const;

/**
 * The derived string union of possible {@link ReferrerEditionMetricsTypeIds}.
 */
export type ReferrerEditionMetricsTypeId =
  (typeof ReferrerEditionMetricsTypeIds)[keyof typeof ReferrerEditionMetricsTypeIds];

/**
 * Referrer edition metrics for an edition whose `awardModel` is not recognized by this client version.
 *
 * @remarks
 * This is a **client-side forward-compatibility** type only. It is never serialized or processed
 * by business logic on the backend. When the server introduces a new award model type, older
 * clients preserve the metrics rather than throwing, and downstream code that encounters this type
 * should handle it gracefully rather than crashing.
 */
export interface ReferrerEditionMetricsUnrecognized {
  /**
   * Discriminant — always `"unrecognized"`.
   */
  awardModel: typeof ReferralProgramAwardModels.Unrecognized;

  /**
   * The original, unrecognized `awardModel` string received from the server.
   *
   * @remarks Preserved for logging and debugging. Never used for business logic.
   */
  originalAwardModel: string;
}
