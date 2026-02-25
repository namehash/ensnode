import type { Address } from "viem";

import {
  type Duration,
  priceEth,
  priceUsdc,
  scalePrice,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { normalizeAddress } from "../../address";
import { buildReferrerMetrics } from "../../referrer-metrics";
import { SECONDS_PER_YEAR } from "../../time";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { AggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import { buildAggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import type { AwardedReferrerMetricsRevShareLimit } from "./metrics";
import {
  buildAwardedReferrerMetricsRevShareLimit,
  buildRankedReferrerMetricsRevShareLimit,
  buildReferrerMetricsRevShareLimit,
} from "./metrics";
import type { ReferralEvent } from "./referral-event";
import {
  BASE_REVENUE_CONTRIBUTION_PER_YEAR,
  type ReferralProgramRulesRevShareLimit,
} from "./rules";

/**
 * Represents a leaderboard with the rev-share-limit award model for any number of referrers.
 */
export interface ReferrerLeaderboardRevShareLimit {
  /**
   * Discriminant identifying this as a rev-share-limit leaderboard.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareLimit}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareLimit;

  /**
   * The rules of the referral program that generated the {@link ReferrerLeaderboardRevShareLimit}.
   */
  rules: ReferralProgramRulesRevShareLimit;

  /**
   * The {@link AggregatedReferrerMetricsRevShareLimit} for all {@link AwardedReferrerMetricsRevShareLimit} values in `referrers`.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit;

  /**
   * Ordered map containing {@link AwardedReferrerMetricsRevShareLimit} for all referrers with 1 or more
   * `totalReferrals` within the `rules` as of `accurateAsOf`.
   *
   * @invariant Map entries are ordered by `rank` (ascending).
   * @invariant Map is empty if there are no referrers with 1 or more `totalReferrals`
   *            within the `rules` as of `accurateAsOf`.
   * @invariant If a fully-lowercase `Address` is not a key in this map then that `Address` had
   *            0 `totalReferrals`, `totalIncrementalDuration`, and `totalRevenueContribution` within the
   *            `rules` as of `accurateAsOf`.
   * @invariant Each value in this map is guaranteed to have a non-zero
   *            `totalReferrals` and `totalIncrementalDuration`.
   */
  referrers: Map<Address, AwardedReferrerMetricsRevShareLimit>;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboardRevShareLimit} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Per-referrer mutable state used during sequential race processing.
 */
interface ReferrerRaceState {
  totalReferrals: number;
  totalIncrementalDuration: Duration;
  totalRevenueContributionAmount: bigint;
  /** Whether this referrer has ever crossed the qualification threshold. */
  wasQualified: boolean;
  /** Amount actually claimed from the award pool. */
  qualifiedAwardValueAmount: bigint;
}

/**
 * Builds a {@link ReferrerLeaderboardRevShareLimit} using a sequential "first-come, first-served"
 * race algorithm over individual referral events.
 *
 * Events are processed in chronological order. When a referrer first crosses the qualification
 * threshold, they claim ALL accumulated standard award value at once (capped by remaining pool).
 * After qualifying, each subsequent event claims that event's incremental standard award (also
 * capped). Once the pool reaches $0, no further awards are issued to anyone.
 *
 * @param events - Raw referral events from the database (unsorted; will be sorted internally).
 * @param rules - The {@link ReferralProgramRulesRevShareLimit} defining the program parameters.
 * @param accurateAsOf - Timestamp indicating data freshness.
 */
export const buildReferrerLeaderboardRevShareLimit = (
  events: ReferralEvent[],
  rules: ReferralProgramRulesRevShareLimit,
  accurateAsOf: UnixTimestamp,
): ReferrerLeaderboardRevShareLimit => {
  // 1. Sort events deterministically: timestamp asc, blockNumber asc, transactionHash asc.
  const sortedEvents = [...events].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    if (a.blockNumber !== b.blockNumber) return a.blockNumber < b.blockNumber ? -1 : 1;
    if (a.transactionHash < b.transactionHash) return -1;
    if (a.transactionHash > b.transactionHash) return 1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  // 2. Process events sequentially to run the race.
  const referrerStates = new Map<Address, ReferrerRaceState>();
  let poolRemainingAmount = rules.totalAwardPoolValue.amount;

  for (const event of sortedEvents) {
    const referrer = normalizeAddress(event.referrer);

    let state = referrerStates.get(referrer);
    if (!state) {
      state = {
        totalReferrals: 0,
        totalIncrementalDuration: 0,
        totalRevenueContributionAmount: 0n,
        wasQualified: false,
        qualifiedAwardValueAmount: 0n,
      };
      referrerStates.set(referrer, state);
    }

    // Update raw totals.
    state.totalReferrals += 1;
    state.totalIncrementalDuration += event.incrementalDuration;
    state.totalRevenueContributionAmount += event.incrementalRevenueContribution.amount;

    // Compute totalBaseRevenue from aggregated duration (single division — avoids per-event
    // truncation that would compound into a sum lower than the correct aggregated value).
    const totalBaseRevenueAmount =
      (BASE_REVENUE_CONTRIBUTION_PER_YEAR.amount * BigInt(state.totalIncrementalDuration)) /
      BigInt(SECONDS_PER_YEAR);

    // Determine if newly qualifying or already qualified.
    const isNowQualified = totalBaseRevenueAmount >= rules.minQualifiedRevenueContribution.amount;

    if (isNowQualified && !state.wasQualified) {
      // First time crossing the qualification threshold: claim all accumulated standard award.
      // Compute from aggregated totals to match the single-division used in final output.
      const accumulatedStandardAwardAmount = scalePrice(
        priceUsdc(totalBaseRevenueAmount),
        rules.qualifiedRevenueShare,
      ).amount;
      const claimAmount =
        accumulatedStandardAwardAmount < poolRemainingAmount
          ? accumulatedStandardAwardAmount
          : poolRemainingAmount;
      state.qualifiedAwardValueAmount += claimAmount;
      poolRemainingAmount -= claimAmount;
      state.wasQualified = true;
    } else if (state.wasQualified) {
      // Already qualified: claim this event's incremental standard award.
      const incrementalBaseRevenueAmount =
        (BASE_REVENUE_CONTRIBUTION_PER_YEAR.amount * BigInt(event.incrementalDuration)) /
        BigInt(SECONDS_PER_YEAR);
      const incrementalStandardAwardAmount = scalePrice(
        priceUsdc(incrementalBaseRevenueAmount),
        rules.qualifiedRevenueShare,
      ).amount;
      const claimAmount =
        incrementalStandardAwardAmount < poolRemainingAmount
          ? incrementalStandardAwardAmount
          : poolRemainingAmount;
      state.qualifiedAwardValueAmount += claimAmount;
      poolRemainingAmount -= claimAmount;
    }
    // If not yet qualified, nothing is claimed from the pool.
  }

  // 3. Sort referrers to assign ranks:
  //    1. qualifiedAwardValue (awardPoolApproxValue) desc — actual pool claims, race winners first
  //    2. standardAwardValue desc — uncapped earned value, separates pool-depleted referrers
  //    3. referrer address desc — deterministic tie-break
  // Both `a` and `b` are keys from `referrerStates`, so lookups are always defined.
  const sortedAddresses = [...referrerStates.keys()].sort((a, b) => {
    const stateA = referrerStates.get(a) as ReferrerRaceState;
    const stateB = referrerStates.get(b) as ReferrerRaceState;

    // Primary: qualifiedAwardValue desc (bigint comparison)
    if (stateB.qualifiedAwardValueAmount !== stateA.qualifiedAwardValueAmount) {
      return stateB.qualifiedAwardValueAmount > stateA.qualifiedAwardValueAmount ? 1 : -1;
    }

    // Secondary: totalIncrementalDuration desc — monotonically equivalent to standardAwardValue desc
    // and avoids recomputing scalePrice for every comparison pair.
    if (stateB.totalIncrementalDuration !== stateA.totalIncrementalDuration) {
      return stateB.totalIncrementalDuration - stateA.totalIncrementalDuration;
    }

    // Tertiary: referrer address desc (lexicographic)
    if (b > a) return 1;
    if (b < a) return -1;
    return 0;
  });

  // 4. Build AwardedReferrerMetricsRevShareLimit for each referrer.
  const awardedReferrers: AwardedReferrerMetricsRevShareLimit[] = sortedAddresses.map(
    (referrerAddr, index) => {
      // `sortedAddresses` is derived directly from `referrerStates.keys()`, so
      // the state entry is always present.
      const state = referrerStates.get(referrerAddr) as ReferrerRaceState;

      const baseMetrics = buildReferrerMetrics(
        referrerAddr,
        state.totalReferrals,
        state.totalIncrementalDuration,
        priceEth(state.totalRevenueContributionAmount),
      );

      const revShareMetrics = buildReferrerMetricsRevShareLimit(baseMetrics);

      const rankedMetrics = buildRankedReferrerMetricsRevShareLimit(
        revShareMetrics,
        index + 1,
        rules,
      );

      const standardAwardValue = scalePrice(
        revShareMetrics.totalBaseRevenueContribution,
        rules.qualifiedRevenueShare,
      );

      return buildAwardedReferrerMetricsRevShareLimit(
        rankedMetrics,
        standardAwardValue,
        priceUsdc(state.qualifiedAwardValueAmount),
        rules,
      );
    },
  );

  const awardPoolRemaining = priceUsdc(poolRemainingAmount);

  const aggregatedMetrics = buildAggregatedReferrerMetricsRevShareLimit(
    awardedReferrers,
    awardPoolRemaining,
  );

  const referrers = new Map(awardedReferrers.map((r) => [r.referrer, r]));

  return { awardModel: rules.awardModel, rules, aggregatedMetrics, referrers, accurateAsOf };
};
