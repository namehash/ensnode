import { describe, expect, it } from "vitest";

import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  CrossChainIndexingStrategyIds,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type OmnichainIndexingStatusSnapshotUnstarted,
} from "@ensnode/ensnode-sdk";
import type { UnixTimestamp } from "@ensnode/ponder-sdk";

import { earliestBlockRef, laterBlockRef, latestBlockRef } from "./block-refs.mock";
import { buildCrossChainIndexingStatusSnapshotOmnichain } from "./cross-chain-indexing-status-snapshot";

describe("cross-chain-indexing-status-snapshot", () => {
  describe("buildCrossChainIndexingStatusSnapshotOmnichain", () => {
    it("builds snapshot from omnichain backfill snapshot", () => {
      // arrange
      const snapshotTime = latestBlockRef.timestamp as UnixTimestamp;
      const cursor = laterBlockRef.timestamp;

      const chains = new Map([
        [
          1,
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
                  configType: ChainIndexingConfigTypeIds.Definite,
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
      const snapshotTime = latestBlockRef.timestamp as UnixTimestamp;
      const cursor = latestBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Completed,
            config: {
              configType: ChainIndexingConfigTypeIds.Definite,
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
                  configType: ChainIndexingConfigTypeIds.Definite,
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
      const snapshotTime = latestBlockRef.timestamp as UnixTimestamp;
      const cursor = laterBlockRef.timestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
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
                  configType: ChainIndexingConfigTypeIds.Indefinite,
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
      const snapshotTime = latestBlockRef.timestamp as UnixTimestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Queued,
            config: {
              configType: ChainIndexingConfigTypeIds.Definite,
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
                  configType: ChainIndexingConfigTypeIds.Definite,
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
      const snapshotTime = latestBlockRef.timestamp as UnixTimestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Completed,
            config: {
              configType: ChainIndexingConfigTypeIds.Definite,
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
                  configType: ChainIndexingConfigTypeIds.Definite,
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
      const snapshotTime = latestBlockRef.timestamp as UnixTimestamp;

      const chains = new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
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
              configType: ChainIndexingConfigTypeIds.Definite,
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
                  configType: ChainIndexingConfigTypeIds.Indefinite,
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
                  configType: ChainIndexingConfigTypeIds.Definite,
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
  });
});
