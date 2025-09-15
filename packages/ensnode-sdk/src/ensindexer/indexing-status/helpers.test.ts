import { describe, expect, it } from "vitest";
import {
  createIndexingConfig,
  getOmnichainIndexingCursor,
  getOverallApproxRealtimeDistance,
  getOverallIndexingStatus,
} from "./helpers";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingDefiniteConfig,
  ChainIndexingFollowingStatus,
  ChainIndexingIndefiniteConfig,
  ChainIndexingQueuedStatus,
  ChainIndexingStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  OverallIndexingStatusIds,
} from "./types";

describe("ENSIndexer: Indexing Status helpers", () => {
  describe("getOverallIndexingStatus", () => {
    it("can correctly derive 'completed' status if all chains are 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingStatus[] = [
        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,

            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingCompletedStatus,

        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus,
      ];

      // act
      const overallIndexingStatus = getOverallIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OverallIndexingStatusIds.Completed);
    });

    it("can correctly derive 'unstarted' status if all chains are in 'queued' status", () => {
      // arrange
      const chainStatuses: ChainIndexingStatus[] = [
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingQueuedStatus,
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingQueuedStatus,
      ];

      // act
      const overallIndexingStatus = getOverallIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OverallIndexingStatusIds.Unstarted);
    });

    it("can correctly derive 'backfill' status if all chains are either 'queued', 'backfill' or 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingStatus[] = [
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingQueuedStatus,

        {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingBackfillStatus,

        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus,
      ];

      // act
      const overallIndexingStatus = getOverallIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OverallIndexingStatusIds.Backfill);
    });

    it("can correctly derive 'following' status if at least one chain is 'following", () => {
      // arrange
      const chainStatuses: ChainIndexingStatus[] = [
        {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
          approxRealtimeDistance: 123,
        } satisfies ChainIndexingFollowingStatus,

        {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingBackfillStatus,

        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus,
      ];

      // act
      const overallIndexingStatus = getOverallIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OverallIndexingStatusIds.Following);
    });
  });

  describe("getOverallApproxRealtimeDistance", () => {
    it("returns overall approximate realtime distance across 'following' chains", () => {
      // arrange
      const chainStatuses: ChainIndexingStatus[] = [
        {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
          approxRealtimeDistance: 123,
        } satisfies ChainIndexingFollowingStatus,

        {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingBackfillStatus,

        {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
          approxRealtimeDistance: 432,
        } satisfies ChainIndexingFollowingStatus,
      ];

      // act
      const overallApproxRealtimeDistance = getOverallApproxRealtimeDistance(chainStatuses);

      // assert
      expect(overallApproxRealtimeDistance).toBe(432);
    });
  });

  describe("createIndexingConfig", () => {
    it("returns 'definite' indexer config if the endBlock exists", () => {
      // arrange
      const startBlock = earlierBlockRef;
      const endBlock = laterBlockRef;

      // act
      const indexingConfig = createIndexingConfig(startBlock, endBlock);

      // assert
      expect(indexingConfig).toStrictEqual({
        strategy: ChainIndexingStrategyIds.Definite,
        startBlock: earlierBlockRef,
        endBlock: laterBlockRef,
      } satisfies ChainIndexingDefiniteConfig);
    });

    it("returns 'indefinite' indexer config if the endBlock exists", () => {
      // arrange
      const startBlock = earlierBlockRef;
      const endBlock = null;

      // act
      const indexingConfig = createIndexingConfig(startBlock, endBlock);

      // assert
      expect(indexingConfig).toStrictEqual({
        strategy: ChainIndexingStrategyIds.Indefinite,
        startBlock: earlierBlockRef,
        endBlock: null,
      } satisfies ChainIndexingIndefiniteConfig);
    });
  });
});

describe("getOmnichainIndexingCursor", () => {
  it("returns the correct cursor for the given chain statuses", () => {
    // arrange
    const chainStatuses = [
      {
        status: ChainIndexingStatusIds.Backfill,
        config: {
          strategy: ChainIndexingStrategyIds.Definite,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: laterBlockRef,
      } satisfies ChainIndexingBackfillStatus,

      {
        status: ChainIndexingStatusIds.Following,
        config: {
          strategy: ChainIndexingStrategyIds.Indefinite,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        latestKnownBlock: laterBlockRef,
        approxRealtimeDistance: 432,
      } satisfies ChainIndexingFollowingStatus,
      {
        status: ChainIndexingStatusIds.Completed,
        config: {
          strategy: ChainIndexingStrategyIds.Definite,
          startBlock: earlierBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: latestBlockRef,
      } satisfies ChainIndexingCompletedStatus,
    ];

    // act
    const omnichainIndexingCursor = getOmnichainIndexingCursor(chainStatuses);

    // assert
    expect(omnichainIndexingCursor).toEqual(latestBlockRef.timestamp);
  });

  it("throws error when no chains were provided", () => {
    expect(() => getOmnichainIndexingCursor([])).toThrowError(
      "Unable to determine omnichain indexing cursor. No chains provided.",
    );
  });
});
