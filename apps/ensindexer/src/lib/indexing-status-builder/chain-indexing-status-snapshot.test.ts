import { describe, expect, it } from "vitest";

import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "@ensnode/ensnode-sdk";
import { buildBlockRefRange, ChainIndexingStates, RangeTypeIds } from "@ensnode/ponder-sdk";

import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import type { ChainIndexingMetadata } from "./chain-indexing-metadata";
import { buildChainIndexingMetadataMock } from "./chain-indexing-metadata.mock";
import { buildChainStatusSnapshots } from "./chain-indexing-status-snapshot";

describe("ChainIndexingStatusSnapshot", () => {
  describe("buildChainStatusSnapshots", () => {
    it("returns Queued status when checkpointBlock equals startBlock", () => {
      // arrange
      const metadata = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, latestBlockRef),
        checkpointBlock: earliestBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: earlierBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadata]]);

      // act
      const result = buildChainStatusSnapshots(chainsMetadata);

      // assert
      expect(result.get(1)).toStrictEqual({
        chainStatus: ChainIndexingStatusIds.Queued,
        config: {
          rangeType: RangeTypeIds.Bounded,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
      } satisfies ChainIndexingStatusSnapshotQueued);
    });

    it("returns Completed status when indexingMetrics.state is Completed", () => {
      // arrange
      const metadata = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, latestBlockRef),
        checkpointBlock: latestBlockRef,
        state: ChainIndexingStates.Completed,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadata]]);

      // act
      const result = buildChainStatusSnapshots(chainsMetadata);

      // assert
      expect(result.get(1)).toStrictEqual({
        chainStatus: ChainIndexingStatusIds.Completed,
        config: {
          rangeType: RangeTypeIds.Bounded,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: latestBlockRef,
      } satisfies ChainIndexingStatusSnapshotCompleted);
    });

    it("returns Following status when indexingMetrics.state is Realtime", () => {
      // arrange
      const metadata = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, undefined),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Realtime,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadata]]);

      // act
      const result = buildChainStatusSnapshots(chainsMetadata);

      // assert
      expect(result.get(1)).toStrictEqual({
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: laterBlockRef,
        latestKnownBlock: latestBlockRef,
      } satisfies ChainIndexingStatusSnapshotFollowing);
    });

    it("returns Backfill status for Historical state with definite config", () => {
      // arrange
      const metadata = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, latestBlockRef),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadata]]);

      // act
      const result = buildChainStatusSnapshots(chainsMetadata);

      // assert
      expect(result.get(1)).toStrictEqual({
        chainStatus: ChainIndexingStatusIds.Backfill,
        config: {
          rangeType: RangeTypeIds.Bounded,
          startBlock: earliestBlockRef,
          endBlock: latestBlockRef,
        },
        latestIndexedBlock: laterBlockRef,
        backfillEndBlock: latestBlockRef,
      } satisfies ChainIndexingStatusSnapshotBackfill);
    });

    it("returns Backfill status for Historical state with indefinite config", () => {
      // arrange
      const metadata = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, undefined),
        checkpointBlock: earlierBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: laterBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadata]]);

      // act
      const result = buildChainStatusSnapshots(chainsMetadata);

      // assert
      expect(result.get(1)).toStrictEqual({
        chainStatus: ChainIndexingStatusIds.Backfill,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: earliestBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        backfillEndBlock: latestBlockRef,
      } satisfies ChainIndexingStatusSnapshotBackfill);
    });

    it("returns empty map when no chains provided", () => {
      // arrange
      const chainsMetadata = new Map<number, ChainIndexingMetadata>();

      // act
      const result = buildChainStatusSnapshots(chainsMetadata);

      // assert
      expect(result.size).toBe(0);
    });
  });
});
