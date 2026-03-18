import { describe, expect, it } from "vitest";

import { RangeTypeIds } from "../shared/blockrange";
import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  getHighestKnownBlockTimestamp,
} from "./cross-chain-indexing-status-snapshot";
import {
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type OmnichainIndexingStatusSnapshotUnstarted,
} from "./omnichain-indexing-status-snapshot";

describe("Cross-chain Indexing Status Snapshot", () => {
  describe("buildCrossChainIndexingStatusSnapshotOmnichain", () => {
    it("builds snapshot from omnichain backfill snapshot", () => {
      // arrange
      const snapshotTime = latestBlockRef.timestamp;
      const cursor = laterBlockRef.timestamp;

      const chains = new Map([
        [
          1,
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
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains,
        omnichainIndexingCursor: cursor,
      } satisfies OmnichainIndexingStatusSnapshotBackfill;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert
      expect(result).toStrictEqual({
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: cursor,
        snapshotTime,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Backfill,
          chains: new Map([
            [
              1,
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
            ],
          ]),
          omnichainIndexingCursor: cursor,
        },
      });
    });

    it("builds snapshot from omnichain completed snapshot", () => {
      // arrange
      const snapshotTime = latestBlockRef.timestamp;
      const cursor = latestBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Completed,
            config: {
              rangeType: RangeTypeIds.Bounded,
              startBlock: earliestBlockRef,
              endBlock: latestBlockRef,
            },
            latestIndexedBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotCompleted,
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains,
        omnichainIndexingCursor: cursor,
      } satisfies OmnichainIndexingStatusSnapshotCompleted;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert
      expect(result).toStrictEqual({
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: cursor,
        snapshotTime,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Completed,
          chains: new Map([
            [
              1,
              {
                chainStatus: ChainIndexingStatusIds.Completed,
                config: {
                  rangeType: RangeTypeIds.Bounded,
                  startBlock: earliestBlockRef,
                  endBlock: latestBlockRef,
                },
                latestIndexedBlock: latestBlockRef,
              },
            ],
          ]),
          omnichainIndexingCursor: cursor,
        },
      });
    });

    it("builds snapshot from omnichain following snapshot", () => {
      // arrange
      const snapshotTime = latestBlockRef.timestamp;
      const cursor = laterBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            config: {
              rangeType: RangeTypeIds.LeftBounded,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: laterBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotFollowing,
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains,
        omnichainIndexingCursor: cursor,
      } satisfies OmnichainIndexingStatusSnapshotFollowing;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert
      expect(result).toStrictEqual({
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: cursor,
        snapshotTime,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Following,
          chains: new Map([
            [
              1,
              {
                chainStatus: ChainIndexingStatusIds.Following,
                config: {
                  rangeType: RangeTypeIds.LeftBounded,
                  startBlock: earliestBlockRef,
                },
                latestIndexedBlock: laterBlockRef,
                latestKnownBlock: latestBlockRef,
              },
            ],
          ]),
          omnichainIndexingCursor: cursor,
        },
      });
    });

    it("builds snapshot from omnichain unstarted snapshot", () => {
      // arrange
      const cursor = earliestBlockRef.timestamp - 1;
      // snapshotTime must be >= highest known block timestamp
      // for unstarted with queued chain, this is endBlock timestamp
      const snapshotTime = latestBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Queued,
            config: {
              rangeType: RangeTypeIds.Bounded,
              startBlock: earliestBlockRef,
              endBlock: latestBlockRef,
            },
          } satisfies ChainIndexingStatusSnapshotQueued,
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains,
        omnichainIndexingCursor: cursor,
      } satisfies OmnichainIndexingStatusSnapshotUnstarted;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert
      expect(result).toStrictEqual({
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: cursor,
        snapshotTime,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
          chains: new Map([
            [
              1,
              {
                chainStatus: ChainIndexingStatusIds.Queued,
                config: {
                  rangeType: RangeTypeIds.Bounded,
                  startBlock: earliestBlockRef,
                  endBlock: latestBlockRef,
                },
              },
            ],
          ]),
          omnichainIndexingCursor: cursor,
        },
      });
    });

    it("includes correct slowestChainIndexingCursor value", () => {
      // arrange
      const cursor = latestBlockRef.timestamp;
      const snapshotTime = latestBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Completed,
            config: {
              rangeType: RangeTypeIds.Bounded,
              startBlock: earliestBlockRef,
              endBlock: latestBlockRef,
            },
            latestIndexedBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotCompleted,
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains,
        omnichainIndexingCursor: cursor,
      } satisfies OmnichainIndexingStatusSnapshotCompleted;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert
      expect(result).toStrictEqual({
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: cursor,
        snapshotTime,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Completed,
          chains: new Map([
            [
              1,
              {
                chainStatus: ChainIndexingStatusIds.Completed,
                config: {
                  rangeType: RangeTypeIds.Bounded,
                  startBlock: earliestBlockRef,
                  endBlock: latestBlockRef,
                },
                latestIndexedBlock: latestBlockRef,
              },
            ],
          ]),
          omnichainIndexingCursor: cursor,
        },
      });
    });

    it("preserves nested omnichainSnapshot structure", () => {
      // arrange
      const cursor = laterBlockRef.timestamp;
      const snapshotTime = latestBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            config: {
              rangeType: RangeTypeIds.LeftBounded,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: laterBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotFollowing,
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
            latestIndexedBlock: laterBlockRef,
            backfillEndBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotBackfill,
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains,
        omnichainIndexingCursor: cursor,
      } satisfies OmnichainIndexingStatusSnapshotFollowing;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert
      expect(result).toStrictEqual({
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: cursor,
        snapshotTime,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Following,
          chains: new Map([
            [
              1,
              {
                chainStatus: ChainIndexingStatusIds.Following,
                config: {
                  rangeType: RangeTypeIds.LeftBounded,
                  startBlock: earliestBlockRef,
                },
                latestIndexedBlock: laterBlockRef,
                latestKnownBlock: latestBlockRef,
              },
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
                latestIndexedBlock: laterBlockRef,
                backfillEndBlock: latestBlockRef,
              },
            ],
          ]),
          omnichainIndexingCursor: cursor,
        },
      });
    });

    it("clamps snapshotTime up to highest known block timestamp when too low", () => {
      // arrange
      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Completed,
            config: {
              rangeType: RangeTypeIds.Bounded,
              startBlock: earliestBlockRef,
              endBlock: latestBlockRef,
            },
            latestIndexedBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotCompleted,
        ],
      ]);

      const omnichainSnapshot = {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains,
        omnichainIndexingCursor: latestBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshotCompleted;

      const snapshotTime = latestBlockRef.timestamp - 1;

      // act
      const result = buildCrossChainIndexingStatusSnapshotOmnichain(
        omnichainSnapshot,
        snapshotTime,
      );

      // assert - snapshotTime should be clamped to the highest known block timestamp
      expect(result.snapshotTime).toBe(latestBlockRef.timestamp);
    });
  });

  describe("getHighestKnownBlockTimestamp", () => {
    it("returns startBlock timestamp for queued chains", () => {
      const chains = [
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: laterBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
      ];

      expect(getHighestKnownBlockTimestamp(chains)).toBe(laterBlockRef.timestamp);
    });

    it("returns endBlock timestamp for bounded chains", () => {
      const chains = [
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
      ];

      expect(getHighestKnownBlockTimestamp(chains)).toBe(latestBlockRef.timestamp);
    });

    it("returns latestKnownBlock timestamp for following chains", () => {
      const chains = [
        {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing,
      ];

      expect(getHighestKnownBlockTimestamp(chains)).toBe(latestBlockRef.timestamp);
    });

    it("returns backfillEndBlock timestamp for backfill chains", () => {
      const chains = [
        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,
      ];

      expect(getHighestKnownBlockTimestamp(chains)).toBe(latestBlockRef.timestamp);
    });

    it("returns the max across mixed-status multi-chain snapshots", () => {
      const chains = [
        {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued,
        {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            rangeType: RangeTypeIds.Bounded,
            startBlock: earliestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted,
        {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing,
        {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            rangeType: RangeTypeIds.LeftBounded,
            startBlock: earliestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill,
      ];

      // latestKnownBlock (from the Following chain) has the highest timestamp
      expect(getHighestKnownBlockTimestamp(chains)).toBe(latestBlockRef.timestamp);
    });

    it("throws when chains array is empty", () => {
      expect(() => getHighestKnownBlockTimestamp([])).toThrow("at least one chain is required");
    });
  });
});
