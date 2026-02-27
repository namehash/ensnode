import { assert, describe, expect, it } from "vitest";

import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import {
  type BlockRef,
  buildBlockRefRange,
  ChainIndexingStates,
  RangeTypeIds,
} from "@ensnode/ponder-sdk";

import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import { buildChainIndexingMetadataMock } from "./chain-indexing-metadata.mock";
import { buildOmnichainIndexingStatusSnapshot } from "./omnichain-indexing-status-snapshot";

describe("OmnichainIndexingStatusSnapshot", () => {
  describe("buildOmnichainIndexingStatusSnapshot", () => {
    it("returns Unstarted status when all chains are Queued", () => {
      // arrange
      const metadata = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, undefined),
        checkpointBlock: earliestBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: laterBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadata]]);

      // act
      const result = buildOmnichainIndexingStatusSnapshot(chainsMetadata);

      // assert
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: new Map([
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
        ]),
        omnichainIndexingCursor: earliestBlockRef.timestamp - 1,
      });
    });

    it("returns Backfill status when at least one chain is Backfill and none are Following", () => {
      // arrange
      const metadataQueued = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(laterBlockRef, undefined),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const metadataBackfill = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, undefined),
        checkpointBlock: earlierBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: laterBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([
        [1, metadataQueued],
        [8453, metadataBackfill],
      ]);

      // act
      const result = buildOmnichainIndexingStatusSnapshot(chainsMetadata);

      // assert
      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: new Map([
          [
            1,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: laterBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
              latestIndexedBlock: metadataBackfill.indexingStatus.checkpointBlock,
              backfillEndBlock: metadataBackfill.backfillScope.endBlock,
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
        ]),
        omnichainIndexingCursor: metadataBackfill.indexingStatus.checkpointBlock.timestamp,
      });
    });

    it("returns Following status when at least one chain is Following", () => {
      // arrange

      const metadataBackfill = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earlierBlockRef, undefined),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const metadataFollowing = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, undefined),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Realtime,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: earlierBlockRef,
      });

      const chainsMetadata = new Map([
        [1, metadataBackfill],
        [8453, metadataFollowing],
      ]);

      // act
      const result = buildOmnichainIndexingStatusSnapshot(chainsMetadata);

      // assert
      assert(
        metadataFollowing.indexingMetrics.state === ChainIndexingStates.Realtime,
        "Expected Realtime state for Following chain in test setup",
      );

      expect(result).toStrictEqual({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            1,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earlierBlockRef,
              },
              latestIndexedBlock: metadataBackfill.indexingStatus.checkpointBlock,
              backfillEndBlock: metadataBackfill.backfillScope.endBlock,
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earliestBlockRef,
              },
              latestIndexedBlock: metadataFollowing.indexingStatus.checkpointBlock,
              latestKnownBlock: metadataFollowing.indexingMetrics.latestSyncedBlock,
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: metadataFollowing.indexingStatus.checkpointBlock.timestamp,
      });
    });

    it("returns Completed status when all chains are Completed", () => {
      // arrange
      const metadataCompleted = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, latestBlockRef),
        checkpointBlock: latestBlockRef,
        state: ChainIndexingStates.Completed,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const chainsMetadata = new Map([[1, metadataCompleted]]);

      // act
      const result = buildOmnichainIndexingStatusSnapshot(chainsMetadata);

      // assert
      expect(result).toStrictEqual({
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
            } satisfies ChainIndexingStatusSnapshotCompleted,
          ],
        ]),
        omnichainIndexingCursor: latestBlockRef.timestamp,
      });
    });

    it("correctly calculates omnichainIndexingCursor with mixed status chains", () => {
      // arrange
      const evenLaterBlockRef: BlockRef = {
        timestamp: latestBlockRef.timestamp + 1000,
        number: latestBlockRef.number + 1000,
      };

      const metadata1 = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earliestBlockRef, undefined),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Realtime,
        latestSyncedBlock: evenLaterBlockRef,
        backfillEndBlock: earlierBlockRef,
      });

      const metadata2 = buildChainIndexingMetadataMock({
        config: buildBlockRefRange(earlierBlockRef, undefined),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Realtime,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: laterBlockRef,
      });

      const chainsMetadata = new Map([
        [1, metadata1],
        [8453, metadata2],
      ]);

      // act
      const result = buildOmnichainIndexingStatusSnapshot(chainsMetadata);

      // assert
      assert(
        metadata1.indexingMetrics.state === ChainIndexingStates.Realtime,
        "Expected Realtime state for Following chain in test setup",
      );
      assert(
        metadata2.indexingMetrics.state === ChainIndexingStates.Realtime,
        "Expected Realtime state for Following chain in test setup",
      );
      expect(result).toStrictEqual({
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
              latestIndexedBlock: metadata1.indexingStatus.checkpointBlock,
              latestKnownBlock: metadata1.indexingMetrics.latestSyncedBlock,
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earlierBlockRef,
              },
              latestIndexedBlock: metadata2.indexingStatus.checkpointBlock,
              latestKnownBlock: metadata2.indexingMetrics.latestSyncedBlock,
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      });
    });

    it("throws an error when no chains metadata is provided", () => {
      // arrange
      const chainsMetadata = new Map();

      // act & assert
      expect(() => buildOmnichainIndexingStatusSnapshot(chainsMetadata)).toThrowError(
        /At least one chain's indexing metadata is required to build an OmnichainIndexingStatusSnapshot/,
      );
    });
  });
});
