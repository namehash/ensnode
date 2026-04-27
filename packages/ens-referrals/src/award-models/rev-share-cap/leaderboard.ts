import type { Duration, NormalizedAddress, UnixTimestamp } from "enssdk";

import {
  addPrices,
  minPrice,
  type PriceEth,
  type PriceUsdc,
  priceEth,
  priceUsdc,
  scalePrice,
  subtractPrice,
} from "@ensnode/ensnode-sdk";

import { buildReferrerMetrics } from "../../referrer-metrics";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type {
  ReferralAccountingRecordRevShareCap,
  TentativeReferralAwardRevShareCap,
} from "./accounting";
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
  type AdminAction,
  AdminActionTypes,
  calcBaseRevenueContribution,
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
 * A point-in-time snapshot of everything computed for a `rev-share-cap` referral program edition.
 */
export interface ReferralEditionSnapshotRevShareCap {
  /**
   * Discriminant identifying this as a rev-share-cap snapshot.
   *
   * @invariant Equals `leaderboard.awardModel` and `leaderboard.rules.awardModel`.
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

  /**
   * The {@link ReferrerLeaderboardRevShareCap} computed from `accountingRecords`.
   */
  leaderboard: ReferrerLeaderboardRevShareCap;

  /**
   * Per-event accounting trace.
   *
   * @invariant One entry per processed onchain event, in chronological order.
   */
  accountingRecords: ReferralAccountingRecordRevShareCap[];
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
  /** Amount tentatively claimed from the award pool (capped by the available award pool). */
  cappedAward: PriceUsdc;
}

/**
 * Builds a {@link ReferralEditionSnapshotRevShareCap} using a sequential "first-come, first-served"
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
export const buildReferralEditionSnapshotRevShareCap = (
  events: ReferralEvent[],
  rules: ReferralProgramRulesRevShareCap,
  accurateAsOf: UnixTimestamp,
): ReferralEditionSnapshotRevShareCap => {
  // 1. Sort events into chronological order by onchain execution order.
  const sortedEvents = sortReferralEvents(events);

  // Precompute admin-action object lookup for the accounting record.
  const adminActionByReferrer = new Map<NormalizedAddress, AdminAction>();
  for (const action of rules.adminActions) {
    adminActionByReferrer.set(action.referrer, action);
  }

  // 2. Process events sequentially to run the race.
  const referrerStates = new Map<NormalizedAddress, ReferrerRaceState>();
  const accountingRecords: ReferralAccountingRecordRevShareCap[] = [];
  let awardPoolRemaining: PriceUsdc = rules.awardPool;

  for (const event of sortedEvents) {
    const referrerId = event.referrer;

    let referrerState = referrerStates.get(referrerId);
    if (!referrerState) {
      referrerState = {
        totalReferrals: 0,
        totalIncrementalDuration: 0,
        totalRevenueContribution: priceEth(0n),
        hasQualified: false,
        cappedAward: priceUsdc(0n),
      };
      referrerStates.set(referrerId, referrerState);
    }

    // Update raw totals BEFORE computing the accounting record.
    // (The per-event accounting uses the post-event accumulated totals.)
    referrerState.totalReferrals += 1;
    referrerState.totalIncrementalDuration += event.incrementalDuration;
    referrerState.totalRevenueContribution = addPrices(
      referrerState.totalRevenueContribution,
      event.incrementalRevenueContribution,
    );

    const hasQualifiedBefore = referrerState.hasQualified;
    const awardPoolRemainingBefore = awardPoolRemaining;
    const adminAction = adminActionByReferrer.get(referrerId);
    const adminDisqualification =
      adminAction?.actionType === AdminActionTypes.Disqualification ? adminAction : null;

    const accumulatedBaseRevenueContribution = calcBaseRevenueContribution(
      rules,
      referrerState.totalIncrementalDuration,
    );
    const incrementalBaseRevenueContribution = calcBaseRevenueContribution(
      rules,
      event.incrementalDuration,
    );

    const isNowQualified = isReferrerQualifiedRevShareCap(
      referrerId,
      accumulatedBaseRevenueContribution,
      rules,
    );

    //   admin-disqualified → 0
    //   newly-qualifying   → claim accumulated uncapped award (catch-up), capped by pool
    //   already-qualified  → claim this event's incremental uncapped award, capped by pool
    //   not yet qualified  → 0
    let incrementalTentativeAward: PriceUsdc = priceUsdc(0n);
    if (isNowQualified && !hasQualifiedBefore) {
      const accumulatedUncappedAward = scalePrice(
        accumulatedBaseRevenueContribution,
        rules.maxBaseRevenueShare,
      );
      incrementalTentativeAward = minPrice(accumulatedUncappedAward, awardPoolRemainingBefore);
      referrerState.hasQualified = true;
    } else if (hasQualifiedBefore) {
      const incrementalUncappedAward = scalePrice(
        incrementalBaseRevenueContribution,
        rules.maxBaseRevenueShare,
      );
      incrementalTentativeAward = minPrice(incrementalUncappedAward, awardPoolRemainingBefore);
    }

    // Apply the claim to referrer state + pool (zero-amount claim is a no-op via bigint math).
    referrerState.cappedAward = addPrices(referrerState.cappedAward, incrementalTentativeAward);
    awardPoolRemaining = subtractPrice(awardPoolRemaining, incrementalTentativeAward);

    const tentativeAward: TentativeReferralAwardRevShareCap = {
      incrementalRevenueContribution: event.incrementalRevenueContribution,
      accumulatedRevenueContribution: referrerState.totalRevenueContribution,
      incrementalBaseRevenueContribution,
      accumulatedBaseRevenueContribution,
      awardPoolRemaining: awardPoolRemainingBefore,
      disqualified: adminDisqualification !== null,
      ...(adminDisqualification !== null && {
        disqualificationReason: adminDisqualification.reason,
      }),
      maxRevShare: rules.maxBaseRevenueShare,
      effectiveBaseRevShare:
        incrementalBaseRevenueContribution.amount === 0n
          ? 0
          : Number(incrementalTentativeAward.amount) /
            Number(incrementalBaseRevenueContribution.amount),
      incrementalTentativeAward,
    };

    accountingRecords.push({
      registrarActionId: event.id,
      timestamp: event.timestamp,
      name: event.name,
      actionType: event.actionType,
      transactionHash: event.transactionHash,
      registrant: event.registrant,
      referrer: referrerId,
      incrementalDuration: event.incrementalDuration,
      tentativeAward,
    });
  }

  // 3. Sort referrers to assign ranks:
  //    1. cappedAward desc — actual pool claims, race winners first
  //    2. totalIncrementalDuration desc — tie-break for pool-depleted referrers
  //    3. referrer address desc — deterministic tie-break
  const sortedEntries = [...referrerStates.entries()].sort(
    ([referrerIdA, referrerStateA], [referrerIdB, referrerStateB]) => {
      // Primary: cappedAward desc (bigint comparison)
      if (referrerStateB.cappedAward.amount !== referrerStateA.cappedAward.amount) {
        return referrerStateB.cappedAward.amount > referrerStateA.cappedAward.amount ? 1 : -1;
      }

      // Secondary: totalIncrementalDuration desc (used directly as the tie-breaker).
      if (referrerStateB.totalIncrementalDuration !== referrerStateA.totalIncrementalDuration) {
        return referrerStateB.totalIncrementalDuration - referrerStateA.totalIncrementalDuration;
      }

      // Tertiary: referrer address desc (lexicographic)
      if (referrerIdB > referrerIdA) return 1;
      if (referrerIdB < referrerIdA) return -1;
      return 0;
    },
  );

  // 4. Build AwardedReferrerMetricsRevShareCap for each referrer.
  const awardedReferrers: AwardedReferrerMetricsRevShareCap[] = sortedEntries.map(
    ([referrerId, referrerState], index) => {
      const baseMetrics = buildReferrerMetrics(
        referrerId,
        referrerState.totalReferrals,
        referrerState.totalIncrementalDuration,
        referrerState.totalRevenueContribution,
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
        referrerState.cappedAward,
        rules,
      );
    },
  );

  const aggregatedMetrics = buildAggregatedReferrerMetricsRevShareCap(
    awardedReferrers,
    awardPoolRemaining,
  );

  const referrers = new Map(awardedReferrers.map((r) => [r.referrer, r]));

  return {
    awardModel: rules.awardModel,
    leaderboard: {
      awardModel: rules.awardModel,
      rules,
      aggregatedMetrics,
      referrers,
      accurateAsOf,
    },
    accountingRecords,
  };
};
