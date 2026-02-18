import { assert, describe, expect, it } from "vitest";

import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
  createIndexingConfig,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { type BlockRef, ChainIndexingStates } from "@ensnode/ponder-sdk";

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
        config: createIndexingConfig(earliestBlockRef, null),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
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
        config: createIndexingConfig(laterBlockRef, null),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const metadataBackfill = buildChainIndexingMetadataMock({
        config: createIndexingConfig(earliestBlockRef, null),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: metadataQueued.indexingConfig.startBlock,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: metadataBackfill.indexingConfig.startBlock,
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
        config: createIndexingConfig(earlierBlockRef, null),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Historical,
        latestSyncedBlock: latestBlockRef,
        backfillEndBlock: latestBlockRef,
      });

      const metadataFollowing = buildChainIndexingMetadataMock({
        config: createIndexingConfig(earliestBlockRef, null),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: metadataBackfill.indexingConfig.startBlock,
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: metadataFollowing.indexingConfig.startBlock,
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
        config: createIndexingConfig(earliestBlockRef, latestBlockRef),
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
                configType: ChainIndexingConfigTypeIds.Definite,
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
        config: createIndexingConfig(earliestBlockRef, null),
        checkpointBlock: laterBlockRef,
        state: ChainIndexingStates.Realtime,
        latestSyncedBlock: evenLaterBlockRef,
        backfillEndBlock: earlierBlockRef,
      });

      const metadata2 = buildChainIndexingMetadataMock({
        config: createIndexingConfig(earlierBlockRef, null),
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: metadata1.indexingConfig.startBlock,
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: metadata2.indexingConfig.startBlock,
              },
              latestIndexedBlock: metadata2.indexingStatus.checkpointBlock,
              latestKnownBlock: metadata2.indexingMetrics.latestSyncedBlock,
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      });
    });
  });
});
