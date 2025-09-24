import { describe, expect, it } from "vitest";
import { BlockRef } from "../../shared";
import {
  createIndexingConfig,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
} from "./helpers";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingConfigDefinite,
  ChainIndexingConfigIndefinite,
  ChainIndexingConfigTypeIds,
  ChainIndexingSnapshot,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotQueued,
  ChainIndexingStatusIds,
  OmnichainIndexingStatusIds,
} from "./types";

describe("ENSIndexer: Indexing Snapshot helpers", () => {
  describe("getOmnichainIndexingStatus", () => {
    it("can correctly derive 'completed' status if all chains are 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingSnapshot[] = [
        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,

            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotCompleted,

        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotCompleted,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Completed);
    });

    it("can correctly derive 'unstarted' status if all chains are in 'queued' status", () => {
      // arrange
      const chainStatuses: ChainIndexingSnapshot[] = [
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued,
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Unstarted);
    });

    it("can correctly derive 'backfill' status if all chains are either 'queued', 'backfill' or 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingSnapshot[] = [
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued,

        {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotBackfill,

        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotCompleted,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Backfill);
    });

    it("can correctly derive 'following' status if at least one chain is 'following", () => {
      // arrange
      const chainStatuses: ChainIndexingSnapshot[] = [
        {
          status: ChainIndexingStatusIds.Following,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotFollowing,

        {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotBackfill,

        {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotCompleted,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Following);
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
        type: ChainIndexingConfigTypeIds.Definite,
        startBlock: earlierBlockRef,
        endBlock: laterBlockRef,
      } satisfies ChainIndexingConfigDefinite);
    });

    it("returns 'indefinite' indexer config if the endBlock exists", () => {
      // arrange
      const startBlock = earlierBlockRef;
      const endBlock = null;

      // act
      const indexingConfig = createIndexingConfig(startBlock, endBlock);

      // assert
      expect(indexingConfig).toStrictEqual({
        type: ChainIndexingConfigTypeIds.Indefinite,
        startBlock: earlierBlockRef,
        endBlock: null,
      } satisfies ChainIndexingConfigIndefinite);
    });
  });
});

describe("getOmnichainIndexingCursor", () => {
  it("returns the correct cursor for the given chain statuses", () => {
    // arrange

    const evenLaterBlockRef: BlockRef = {
      timestamp: latestBlockRef.timestamp + 1000,
      number: latestBlockRef.number + 1000,
    };

    const chainStatuses = [
      {
        status: ChainIndexingStatusIds.Queued,
        config: {
          type: ChainIndexingConfigTypeIds.Indefinite,
          startBlock: evenLaterBlockRef,
        },
      } satisfies ChainIndexingSnapshotQueued,

      {
        status: ChainIndexingStatusIds.Backfill,
        config: {
          type: ChainIndexingConfigTypeIds.Definite,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: laterBlockRef,
      } satisfies ChainIndexingSnapshotBackfill,

      {
        status: ChainIndexingStatusIds.Following,
        config: {
          type: ChainIndexingConfigTypeIds.Indefinite,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        latestKnownBlock: laterBlockRef,
      } satisfies ChainIndexingSnapshotFollowing,
      {
        status: ChainIndexingStatusIds.Completed,
        config: {
          type: ChainIndexingConfigTypeIds.Definite,
          startBlock: earlierBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: latestBlockRef,
      } satisfies ChainIndexingSnapshotCompleted,
    ];

    // act
    const omnichainIndexingCursor = getOmnichainIndexingCursor(chainStatuses);

    // assert
    expect(omnichainIndexingCursor).toEqual(latestBlockRef.timestamp);
  });

  it("throws error when no chains were provided", () => {
    expect(() => getOmnichainIndexingCursor([])).toThrowError(
      /Unable to determine omnichain indexing cursor/,
    );
  });

  it("throws error when all chains are in 'queued' status", () => {
    expect(() =>
      getOmnichainIndexingCursor([
        {
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earliestBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued,
      ]),
    ).toThrowError(/Unable to determine omnichain indexing cursor/);
  });
});
