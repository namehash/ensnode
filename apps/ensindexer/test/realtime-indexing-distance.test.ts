import { setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules
import { hasAchievedRequestedDistance } from "@/indexing-status";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  ChainIndexingUnstartedStatus,
  Duration,
  OverallIndexingStatusIds,
  SerializedENSIndexerOverallIndexingBackfillStatus,
  SerializedENSIndexerOverallIndexingFollowingStatus,
  deserializeENSIndexerIndexingStatus,
} from "@ensnode/ensnode-sdk";
import { describe, expect, it } from "vitest";

describe("ENSIndexer: assertRealtimeIndexingDistance", () => {
  it("throws no error if requested realtime indexing distance was achieved", () => {
    // arrange
    const indexingStatus = deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.Following,
      chains: {
        "1": {
          approxRealtimeDistance: 99,
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 123,
              timestamp: 123123123,
            },
          },
          latestIndexedBlock: {
            number: 124,
            timestamp: 123123124,
          },
          latestKnownBlock: {
            number: 128,
            timestamp: 123123128,
          },
        } satisfies ChainIndexingFollowingStatus,
        "8453": {
          approxRealtimeDistance: 12,
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 23,
              timestamp: 23123123,
            },
          },
          latestIndexedBlock: {
            number: 24,
            timestamp: 23123124,
          },
          latestKnownBlock: {
            number: 28,
            timestamp: 23123128,
          },
        } satisfies ChainIndexingFollowingStatus,
      },
      overallApproxRealtimeDistance: 99,
      omnichainIndexingCursor: 123123124,
    } satisfies SerializedENSIndexerOverallIndexingFollowingStatus);

    const maxRealtimeDistance = 100 satisfies Duration;

    // act
    const hasAchievedRequestedRealtimeIndexingDistance = hasAchievedRequestedDistance(
      indexingStatus,
      maxRealtimeDistance,
    );

    // assert
    expect(hasAchievedRequestedRealtimeIndexingDistance).toBe(true);
  });

  it("throws error when overall status is not 'following'", () => {
    // arrange
    const indexingStatus = deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.Backfill,
      chains: {
        "1": {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 123,
              timestamp: 123123123,
            },
            endBlock: null,
          },
          latestIndexedBlock: {
            number: 124,
            timestamp: 123123124,
          },
          latestSyncedBlock: {
            number: 126,
            timestamp: 123123126,
          },
          backfillEndBlock: {
            number: 128,
            timestamp: 123123128,
          },
        } satisfies ChainIndexingBackfillStatus,
        "8453": {
          status: ChainIndexingStatusIds.Unstarted,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 23,
              timestamp: 123123125,
            },
            endBlock: null,
          },
        } satisfies ChainIndexingUnstartedStatus,
      },
      omnichainIndexingCursor: 123123124,
    } satisfies SerializedENSIndexerOverallIndexingBackfillStatus);

    const maxRealtimeDistance = 15 satisfies Duration;

    // act
    const hasAchievedRequestedRealtimeIndexingDistance = hasAchievedRequestedDistance(
      indexingStatus,
      maxRealtimeDistance,
    );

    // assert: overall status not following
    expect(indexingStatus.overallStatus).not.toEqual(OverallIndexingStatusIds.Following);
    expect(hasAchievedRequestedRealtimeIndexingDistance).toBe(false);
  });

  it("throws error when requested realtime indexing distance was not achieved", () => {
    // arrange
    const indexingStatus = deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.Following,
      chains: {
        "1": {
          approxRealtimeDistance: 1,
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 123,
              timestamp: 123123123,
            },
          },
          latestIndexedBlock: {
            number: 124,
            timestamp: 123123124,
          },
          latestKnownBlock: {
            number: 128,
            timestamp: 123123128,
          },
        } satisfies ChainIndexingFollowingStatus,
        "8453": {
          approxRealtimeDistance: 1,
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 23,
              timestamp: 23123123,
            },
          },
          latestIndexedBlock: {
            number: 24,
            timestamp: 23123124,
          },
          latestKnownBlock: {
            number: 28,
            timestamp: 23123128,
          },
        } satisfies ChainIndexingFollowingStatus,
      },
      overallApproxRealtimeDistance: 1,
      omnichainIndexingCursor: 123123124,
    } satisfies SerializedENSIndexerOverallIndexingFollowingStatus);

    const maxRealtimeDistance = 0 satisfies Duration;

    // act
    const hasAchievedRequestedRealtimeIndexingDistance = hasAchievedRequestedDistance(
      indexingStatus,
      maxRealtimeDistance,
    );

    // assert: requested realtime
    expect(hasAchievedRequestedRealtimeIndexingDistance).toBe(false);
  });
});
