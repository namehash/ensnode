import { setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules
import { assertRealtimeIndexingDistance } from "@/indexing-status";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  ChainIndexingUnstartedStatus,
  OverallIndexingStatusIds,
  SerializedENSIndexerOverallIndexingStatusBackfill,
  SerializedENSIndexerOverallIndexingStatusFollowing,
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
          approximateRealtimeDistance: 99,
          status: ChainIndexingStatusIds.Following,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
          approximateRealtimeDistance: 12,
          status: ChainIndexingStatusIds.Following,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
      maxApproximateRealtimeDistance: 99,
    } satisfies SerializedENSIndexerOverallIndexingStatusFollowing);

    const maxRealtimeDistanceQueryParam = "100";

    // act & assert
    expect(() =>
      assertRealtimeIndexingDistance(indexingStatus, maxRealtimeDistanceQueryParam),
    ).not.toThrowError();
  });

  it("throws no bad input error if requested realtime indexing distance was invalid", () => {
    // arrange
    const indexingStatus = deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.Following,
      chains: {
        "1": {
          approximateRealtimeDistance: 99,
          status: ChainIndexingStatusIds.Following,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
          approximateRealtimeDistance: 12,
          status: ChainIndexingStatusIds.Following,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
      maxApproximateRealtimeDistance: 99,
    } satisfies SerializedENSIndexerOverallIndexingStatusFollowing);

    // act & assert: empty input
    expect(() => assertRealtimeIndexingDistance(indexingStatus, "")).toThrowError(
      "maxRealtimeDistance must represent an integer.",
    );

    // // act & assert: not a number input
    expect(() => assertRealtimeIndexingDistance(indexingStatus, "yes")).toThrowError(
      "maxRealtimeDistance must represent an integer.",
    );

    // // act & assert: float number input
    expect(() => assertRealtimeIndexingDistance(indexingStatus, "1.5")).toThrowError(
      "maxRealtimeDistance must represent an integer.",
    );

    // // act & assert: negative integer input
    expect(() => assertRealtimeIndexingDistance(indexingStatus, "-1")).toThrowError(
      'Could not parse "maxRealtimeDistance" query param. If provided, it must represent a non-negative integer.',
    );
  });

  it("throws error when overall status is not 'following'", () => {
    // arrange
    const indexingStatus = deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.Backfill,
      chains: {
        "1": {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
          backfillEndBlock: {
            number: 128,
            timestamp: 123123128,
          },
        } satisfies ChainIndexingBackfillStatus,
        "8453": {
          status: ChainIndexingStatusIds.Unstarted,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: {
              number: 23,
              timestamp: 23123123,
            },
            endBlock: null,
          },
        } satisfies ChainIndexingUnstartedStatus,
      },
    } satisfies SerializedENSIndexerOverallIndexingStatusBackfill);

    // act & assert: empty input
    expect(() => assertRealtimeIndexingDistance(indexingStatus, "15")).toThrowError(
      "Overall indexing status must be 'following'.",
    );
  });

  it("throws error when requested realtime indexing distance was not achieved", () => {
    // arrange
    const indexingStatus = deserializeENSIndexerIndexingStatus({
      overallStatus: OverallIndexingStatusIds.Following,
      chains: {
        "1": {
          approximateRealtimeDistance: 1,
          status: ChainIndexingStatusIds.Following,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
          approximateRealtimeDistance: 1,
          status: ChainIndexingStatusIds.Following,
          config: {
            indexingStrategy: ChainIndexingStrategyIds.Indefinite,
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
      maxApproximateRealtimeDistance: 1,
    } satisfies SerializedENSIndexerOverallIndexingStatusFollowing);

    // act & assert
    expect(() => assertRealtimeIndexingDistance(indexingStatus, "0")).toThrowError(
      "Requested realtime indexing distance has not been achieved yet.",
    );
  });
});
