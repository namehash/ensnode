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
  ChainIndexingStatusIds,
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotQueued,
  OmnichainIndexingStatusIds,
} from "./types";

describe("ENSIndexer: Indexing Snapshot helpers", () => {
  describe("getOmnichainIndexingStatus", () => {
    it("can correctly derive 'completed' status if all chains are 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingStatusSnapshot[] = [
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,

            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,

        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Completed);
    });

    it("can correctly derive 'unstarted' status if all chains are in 'queued' status", () => {
      // arrange
      const chainStatuses: ChainIndexingStatusSnapshot[] = [
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Unstarted);
    });

    it("can correctly derive 'backfill' status if all chains are either 'queued', 'backfill' or 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingStatusSnapshot[] = [
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,

        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,

        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
      ];

      // act
      const overallIndexingStatus = getOmnichainIndexingStatus(chainStatuses);

      // assert
      expect(overallIndexingStatus).toStrictEqual(OmnichainIndexingStatusIds.Backfill);
    });

    it("can correctly derive 'following' status if at least one chain is 'following", () => {
      // arrange
      const chainStatuses: ChainIndexingStatusSnapshot[] = [
        {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing,

        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,

        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
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
        configType: ChainIndexingConfigTypeIds.Definite,
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
        configType: ChainIndexingConfigTypeIds.Indefinite,
        startBlock: earlierBlockRef,
        endBlock: null,
      } satisfies ChainIndexingConfigIndefinite);
    });
  });
});

describe("getOmnichainIndexingCursor", () => {
  it("returns the correct cursor for the given chains in any status", () => {
    // arrange
    const evenLaterBlockRef: BlockRef = {
      timestamp: latestBlockRef.timestamp + 1000,
      number: latestBlockRef.number + 1000,
    };

    const chainStatuses = [
      {
        chainStatus: ChainIndexingStatusIds.Queued,
        config: {
          configType: ChainIndexingConfigTypeIds.Indefinite,
          startBlock: evenLaterBlockRef,
        },
      } satisfies ChainIndexingStatusSnapshotQueued,

      {
        chainStatus: ChainIndexingStatusIds.Backfill,
        config: {
          configType: ChainIndexingConfigTypeIds.Definite,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotBackfill,

      {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          configType: ChainIndexingConfigTypeIds.Indefinite,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        latestKnownBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotFollowing,
      {
        chainStatus: ChainIndexingStatusIds.Completed,
        config: {
          configType: ChainIndexingConfigTypeIds.Definite,
          startBlock: earlierBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: latestBlockRef,
      } satisfies ChainIndexingStatusSnapshotCompleted,
    ];

    // act
    const omnichainIndexingCursor = getOmnichainIndexingCursor(chainStatuses);

    // assert
    expect(omnichainIndexingCursor).toEqual(latestBlockRef.timestamp);
  });

  it("returns the correct cursor for the given queued chains only", () => {
    expect(
      getOmnichainIndexingCursor([
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earliestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: laterBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
      ]),
    ).toEqual(earliestBlockRef.timestamp - 1);
  });

  it("returns the correct cursor for the given indexed chains", () => {
    // arrange
    const evenLaterBlockRef: BlockRef = {
      timestamp: latestBlockRef.timestamp + 1000,
      number: latestBlockRef.number + 1000,
    };

    const chainStatuses = [
      {
        chainStatus: ChainIndexingStatusIds.Backfill,
        config: {
          configType: ChainIndexingConfigTypeIds.Definite,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotBackfill,

      {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          configType: ChainIndexingConfigTypeIds.Indefinite,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: evenLaterBlockRef,
        latestKnownBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotFollowing,
      {
        chainStatus: ChainIndexingStatusIds.Completed,
        config: {
          configType: ChainIndexingConfigTypeIds.Definite,
          startBlock: earlierBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: latestBlockRef,
      } satisfies ChainIndexingStatusSnapshotCompleted,
    ];

    // act
    const omnichainIndexingCursor = getOmnichainIndexingCursor(chainStatuses);

    // assert
    expect(omnichainIndexingCursor).toEqual(evenLaterBlockRef.timestamp);
  });

  it("throws error when no chains were provided", () => {
    expect(() => getOmnichainIndexingCursor([])).toThrowError(
      /Unable to determine omnichain indexing cursor/,
    );
  });
});
