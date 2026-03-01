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
