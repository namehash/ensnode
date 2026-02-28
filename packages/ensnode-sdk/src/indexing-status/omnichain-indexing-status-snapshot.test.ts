import { describe, expect, it } from "vitest";

import { RangeTypeIds } from "../shared/blockrange";
import type { BlockRef } from "../shared/types";
import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import {
  buildOmnichainIndexingStatusSnapshot,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
  OmnichainIndexingStatusIds,
} from "./omnichain-indexing-status-snapshot";

describe("ENSIndexer: Indexing Snapshot helpers", () => {
  describe("getOmnichainIndexingStatus", () => {
    it("can correctly derive 'completed' status if all chains are 'completed'", () => {
      // arrange
      const chainStatuses: ChainIndexingStatusSnapshot[] = [
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earlierBlockRef,

            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,

        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
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
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.Bounded,
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
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,

        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,

        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
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
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing,

        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,

        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
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
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: evenLaterBlockRef,
        },
      } satisfies ChainIndexingStatusSnapshotQueued,

      {
        chainStatus: ChainIndexingStatusIds.Backfill,
        config: {
          rangeType: RangeTypeIds.Bounded,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotBackfill,

      {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        latestKnownBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotFollowing,
      {
        chainStatus: ChainIndexingStatusIds.Completed,
        config: {
          rangeType: RangeTypeIds.Bounded,
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
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
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
          rangeType: RangeTypeIds.Bounded,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotBackfill,

      {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: evenLaterBlockRef,
        latestKnownBlock: laterBlockRef,
      } satisfies ChainIndexingStatusSnapshotFollowing,
      {
        chainStatus: ChainIndexingStatusIds.Completed,
        config: {
          rangeType: RangeTypeIds.Bounded,
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

describe("buildOmnichainIndexingStatusSnapshot()", () => {
  it("returns Unstarted status when all chains are Queued", () => {
    const chainStatusSnapshots = new Map([
      [
        1,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
      ],
      [
        8453,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
      ],
    ]);

    const result = buildOmnichainIndexingStatusSnapshot(chainStatusSnapshots);

    expect(result).toStrictEqual({
      omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
      chains: chainStatusSnapshots,
      omnichainIndexingCursor: earliestBlockRef.timestamp - 1,
    });
  });

  it("returns Backfill status when at least one chain is Backfill and none are Following", () => {
    const evenLaterBlockRef: BlockRef = {
      timestamp: latestBlockRef.timestamp + 1000,
      number: latestBlockRef.number + 1000,
    };

    const chainStatusSnapshots = new Map([
      [
        1,
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: evenLaterBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
      ],
      [
        8453,
        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,
      ],
      [
        10,
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
      ],
    ]);

    const result = buildOmnichainIndexingStatusSnapshot(chainStatusSnapshots);

    expect(result).toStrictEqual({
      omnichainStatus: OmnichainIndexingStatusIds.Backfill,
      chains: chainStatusSnapshots,
      omnichainIndexingCursor: latestBlockRef.timestamp,
    });
  });

  it("returns Following status when at least one chain is Following", () => {
    const chainStatusSnapshots = new Map([
      [
        1,
        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,
      ],
      [
        8453,
        {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing,
      ],
    ]);

    const result = buildOmnichainIndexingStatusSnapshot(chainStatusSnapshots);

    expect(result).toStrictEqual({
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      chains: chainStatusSnapshots,
      omnichainIndexingCursor: laterBlockRef.timestamp,
    });
  });

  it("returns Completed status when all chains are Completed", () => {
    const chainStatusSnapshots = new Map([
      [
        1,
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
      ],
      [
        8453,
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
      ],
    ]);

    const result = buildOmnichainIndexingStatusSnapshot(chainStatusSnapshots);

    expect(result).toStrictEqual({
      omnichainStatus: OmnichainIndexingStatusIds.Completed,
      chains: chainStatusSnapshots,
      omnichainIndexingCursor: latestBlockRef.timestamp,
    });
  });

  it("throws an error when no chain snapshots are provided", () => {
    expect(() => buildOmnichainIndexingStatusSnapshot(new Map())).toThrowError(
      /At least one chain indexing status snapshot is required to build an OmnichainIndexingStatusSnapshot/,
    );
  });
});
