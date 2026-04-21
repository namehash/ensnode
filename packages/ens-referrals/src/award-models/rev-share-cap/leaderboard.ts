import type { Duration, NormalizedAddress, UnixTimestamp } from "enssdk";

import {
  addPrices,
  minPrices,
  type PriceEth,
  type PriceUsdc,
  priceEth,
  priceUsdc,
  scalePrice,
  subtractPrices,
} from "@ensnode/ensnode-sdk";

import { buildReferrerMetrics } from "../../referrer-metrics";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { AggregatedReferrerMetricsRevShareCap } from "./aggregations";
import { buildAggregatedReferrerMetricsRevShareCap } from "./aggregations";
import type { AwardedReferrerMetricsRevShareCap } from "./metrics";
import {
  buildAwardedReferrerMetricsRevShareCap,
  buildRankedReferrerMetricsRevShareCap,
  buildReferrerMetricsRevShareCap,
} from "./metrics";
import type { ReferralEvent } from "./referral-event";
import {
  computeBaseRevenueContribution,
  isReferrerQualifiedRevShareCap,
  type ReferralProgramRulesRevShareCap,
} from "./rules";
import { sortReferralEvents } from "./sort-referral-events";

/**
 * Represents a leaderboard with the rev-share-cap award model for any number of referrers.
 */
export interface ReferrerLeaderboardRevShareCap {
  /**
   * Discriminant identifying this as a rev-share-cap leaderboard.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareCap}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

  /**
   * The rules of the referral program that generated the {@link ReferrerLeaderboardRevShareCap}.
   */
  rules: ReferralProgramRulesRevShareCap;

  /**
   * The {@link AggregatedReferrerMetricsRevShareCap} for all {@link AwardedReferrerMetricsRevShareCap} values in `referrers`.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareCap;

  /**
   * Ordered map containing {@link AwardedReferrerMetricsRevShareCap} for all referrers with 1 or more
   * `totalReferrals` within the `rules` as of `accurateAsOf`.
   *
   * @invariant Map entries are ordered by `rank` (ascending).
   * @invariant Map is empty if there are no referrers with 1 or more `totalReferrals`
   *            within the `rules` as of `accurateAsOf`.
   * @invariant If a `NormalizedAddress` is not a key in this map then that `NormalizedAddress` had
   *            0 `totalReferrals`, `totalIncrementalDuration`, and `totalRevenueContribution` within the
   *            `rules` as of `accurateAsOf`.
   * @invariant Each value in this map is guaranteed to have a non-zero
   *            `totalReferrals` and `totalIncrementalDuration`.
   */
  referrers: Map<NormalizedAddress, AwardedReferrerMetricsRevShareCap>;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerLeaderboardRevShareCap} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Per-referrer mutable state used during sequential race processing.
 */
interface ReferrerRaceState {
  totalReferrals: number;
  totalIncrementalDuration: Duration;
  totalRevenueContribution: PriceEth;
  /**
   * Latch: becomes true the first time this referrer passes
   * {@link isReferrerQualifiedRevShareCap} during the race (min base revenue
   * contribution met AND not admin-disqualified), and stays true thereafter.
   */
  hasQualified: boolean;
  /** Amount actually claimed from the award pool (the capped award). */
  cappedAward: PriceUsdc;
}

/**
 * Builds a {@link ReferrerLeaderboardRevShareCap} using a sequential "first-come, first-served"
 * race algorithm over individual referral events.
 *
 * Events are processed in chronological order. When a referrer first crosses the qualification
 * threshold, they claim ALL accumulated uncapped awards at once (capped by remaining award pool).
 * After qualifying, each referrer's subsequent referrals claim that event's incremental capped award.
 * Once the award pool is exhausted, no further awards are issued to anyone.
 *
 * @param events - Raw referral events from ENSDb (unsorted; will be sorted internally).
 * @param rules - The {@link ReferralProgramRulesRevShareCap} defining the program parameters.
 * @param accurateAsOf - Timestamp indicating data freshness.
 */
export const buildReferrerLeaderboardRevShareCap = (
  events: ReferralEvent[],
  rules: ReferralProgramRulesRevShareCap,
  accurateAsOf: UnixTimestamp,
): ReferrerLeaderboardRevShareCap => {
  // 1. Sort events into chronological order by onchain execution order.
  const sortedEvents = sortReferralEvents(events);

  // 2. Process events sequentially to run the race.
  const referrerStates = new Map<NormalizedAddress, ReferrerRaceState>();
  let awardPoolRemaining: PriceUsdc = rules.awardPool;

  for (const event of sortedEvents) {
    const referrer = event.referrer;

    let state = referrerStates.get(referrer);
    if (!state) {
      state = {
        totalReferrals: 0,
        totalIncrementalDuration: 0,
        totalRevenueContribution: priceEth(0n),
        hasQualified: false,
        cappedAward: priceUsdc(0n),
      };
      referrerStates.set(referrer, state);
    }

    // Update raw totals.
    state.totalReferrals += 1;
    state.totalIncrementalDuration += event.incrementalDuration;
    state.totalRevenueContribution = addPrices(
      state.totalRevenueContribution,
      event.incrementalRevenueContribution,
    );

    // Compute totalBaseRevenue from aggregated duration (single division — avoids per-event
    // truncation that would compound into a sum lower than the correct aggregated value).
    const totalBaseRevenue = computeBaseRevenueContribution(rules, state.totalIncrementalDuration);

    // Determine if newly qualifying or already qualified.
    const isNowQualified = isReferrerQualifiedRevShareCap(referrer, totalBaseRevenue, rules);

    if (isNowQualified && !state.hasQualified) {
      // First time crossing the qualification threshold: claim all accumulated uncapped award.
      // Compute from aggregated totals to match the single-division used in final output.
      const accumulatedUncappedAward = scalePrice(totalBaseRevenue, rules.maxBaseRevenueShare);
      const incrementalCappedAward = minPrices(accumulatedUncappedAward, awardPoolRemaining);
      state.cappedAward = addPrices(state.cappedAward, incrementalCappedAward);
      awardPoolRemaining = subtractPrices(awardPoolRemaining, incrementalCappedAward);
      state.hasQualified = true;
    } else if (state.hasQualified) {
      // Already qualified: claim this event's incremental uncapped award.
      const incrementalBaseRevenue = computeBaseRevenueContribution(
        rules,
        event.incrementalDuration,
      );
      const incrementalUncappedAward = scalePrice(
        incrementalBaseRevenue,
        rules.maxBaseRevenueShare,
      );
      const incrementalCappedAward = minPrices(incrementalUncappedAward, awardPoolRemaining);
      state.cappedAward = addPrices(state.cappedAward, incrementalCappedAward);
      awardPoolRemaining = subtractPrices(awardPoolRemaining, incrementalCappedAward);
    }
    // If not yet qualified, nothing is claimed from the pool.
  }

  // 3. Sort referrers to assign ranks:
  //    1. cappedAward desc — actual pool claims, race winners first
  //    2. totalIncrementalDuration desc — tie-break for pool-depleted referrers
  //    3. referrer address desc — deterministic tie-break
  const sortedEntries = [...referrerStates.entries()].sort(([a, stateA], [b, stateB]) => {
    // Primary: cappedAward desc (bigint comparison)
    if (stateB.cappedAward.amount !== stateA.cappedAward.amount) {
      return stateB.cappedAward.amount > stateA.cappedAward.amount ? 1 : -1;
    }

    // Secondary: totalIncrementalDuration desc (used directly as the tie-breaker).
    if (stateB.totalIncrementalDuration !== stateA.totalIncrementalDuration) {
      return stateB.totalIncrementalDuration - stateA.totalIncrementalDuration;
    }

    // Tertiary: referrer address desc (lexicographic)
    if (b > a) return 1;
    if (b < a) return -1;
    return 0;
  });

  // 4. Build AwardedReferrerMetricsRevShareCap for each referrer.
  const awardedReferrers: AwardedReferrerMetricsRevShareCap[] = sortedEntries.map(
    ([referrerAddr, state], index) => {
      const baseMetrics = buildReferrerMetrics(
        referrerAddr,
        state.totalReferrals,
        state.totalIncrementalDuration,
        state.totalRevenueContribution,
      );

      const revShareMetrics = buildReferrerMetricsRevShareCap(baseMetrics, rules);

      const rankedMetrics = buildRankedReferrerMetricsRevShareCap(
        revShareMetrics,
        index + 1,
        rules,
      );

      const uncappedAward = scalePrice(
        revShareMetrics.totalBaseRevenueContribution,
        rules.maxBaseRevenueShare,
      );

      return buildAwardedReferrerMetricsRevShareCap(
        rankedMetrics,
        uncappedAward,
        state.cappedAward,
        rules,
      );
    },
  );

  const aggregatedMetrics = buildAggregatedReferrerMetricsRevShareCap(
    awardedReferrers,
    awardPoolRemaining,
  );

  const referrers = new Map(awardedReferrers.map((r) => [r.referrer, r]));

  return { awardModel: rules.awardModel, rules, aggregatedMetrics, referrers, accurateAsOf };
};
