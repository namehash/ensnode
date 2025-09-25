import { describe, expect, it } from "vitest";
import { deserializeOmnichainIndexingSnapshot } from "./deserialize";
import { serializeOmnichainIndexingSnapshot } from "./serialize";
import { SerializedOmnichainIndexingSnapshot } from "./serialized-types";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotQueued,
  ChainIndexingStatusIds,
  OmnichainIndexingSnapshot,
  OmnichainIndexingStatusIds,
} from "./types";

describe("ENSIndexer: Indexing Status", () => {
  describe("ENSIndexerIndexingStatus", () => {
    it("can serialize and deserialize indexing status object maxRealtimeDistance was requested and satisfied", () => {
      // arrange
      const indexingStatus = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            1,
            {
              status: ChainIndexingStatusIds.Following,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earliestBlockRef,
              },
              latestIndexedBlock: earlierBlockRef,
              latestKnownBlock: latestBlockRef,
            } satisfies ChainIndexingSnapshotFollowing,
          ],
          [
            10,
            {
              status: ChainIndexingStatusIds.Backfill,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earlierBlockRef,
                endBlock: null,
              },
              latestIndexedBlock: laterBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingSnapshotBackfill,
          ],
          [
            8453,
            {
              status: ChainIndexingStatusIds.Queued,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: latestBlockRef,
                endBlock: null,
              },
            } satisfies ChainIndexingSnapshotQueued,
          ],
        ]),
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        snapshotTime: earlierBlockRef.timestamp + 1,
      } satisfies OmnichainIndexingSnapshot;

      // act
      const result = serializeOmnichainIndexingSnapshot(indexingStatus);

      // assert
      expect(result).toMatchObject({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: {
          "1": {
            status: ChainIndexingStatusIds.Following,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: earlierBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingSnapshotFollowing,
          "8453": {
            status: ChainIndexingStatusIds.Queued,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: latestBlockRef,
              endBlock: null,
            },
          } satisfies ChainIndexingSnapshotQueued,
          "10": {
            status: ChainIndexingStatusIds.Backfill,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earlierBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: laterBlockRef,
            backfillEndBlock: latestBlockRef,
          } satisfies ChainIndexingSnapshotBackfill,
        },
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        snapshotTime: earlierBlockRef.timestamp + 1,
      } satisfies SerializedOmnichainIndexingSnapshot);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeOmnichainIndexingSnapshot(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });
    it("can serialize and deserialize indexing status object maxRealtimeDistance was requested, but not satisfied", () => {
      // arrange
      const indexingStatus = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            1,
            {
              status: ChainIndexingStatusIds.Following,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earliestBlockRef,
              },
              latestIndexedBlock: earlierBlockRef,
              latestKnownBlock: latestBlockRef,
            } satisfies ChainIndexingSnapshotFollowing,
          ],
          [
            10,
            {
              status: ChainIndexingStatusIds.Backfill,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earlierBlockRef,
                endBlock: null,
              },
              latestIndexedBlock: laterBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingSnapshotBackfill,
          ],
          [
            8453,
            {
              status: ChainIndexingStatusIds.Queued,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: latestBlockRef,
                endBlock: null,
              },
            } satisfies ChainIndexingSnapshotQueued,
          ],
        ]),
        omnichainIndexingCursor: earlierBlockRef.timestamp,

        snapshotTime: earlierBlockRef.timestamp + 1,
      } satisfies OmnichainIndexingSnapshot;

      // act
      const result = serializeOmnichainIndexingSnapshot(indexingStatus);

      // assert
      expect(result).toMatchObject({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: {
          "1": {
            status: ChainIndexingStatusIds.Following,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: earlierBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingSnapshotFollowing,
          "8453": {
            status: ChainIndexingStatusIds.Queued,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: latestBlockRef,
              endBlock: null,
            },
          } satisfies ChainIndexingSnapshotQueued,
          "10": {
            status: ChainIndexingStatusIds.Backfill,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earlierBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: laterBlockRef,
            backfillEndBlock: latestBlockRef,
          } satisfies ChainIndexingSnapshotBackfill,
        },
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        snapshotTime: earlierBlockRef.timestamp + 1,
      } satisfies SerializedOmnichainIndexingSnapshot);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeOmnichainIndexingSnapshot(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });

    it("can serialize and deserialize indexing status object when no maxRealtimeDistance was requested", () => {
      // arrange
      const indexingStatus = {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: new Map([
          [
            1,
            {
              status: ChainIndexingStatusIds.Following,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earliestBlockRef,
              },
              latestIndexedBlock: earlierBlockRef,
              latestKnownBlock: latestBlockRef,
            } satisfies ChainIndexingSnapshotFollowing,
          ],
          [
            10,
            {
              status: ChainIndexingStatusIds.Backfill,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: earlierBlockRef,
                endBlock: null,
              },
              latestIndexedBlock: laterBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingSnapshotBackfill,
          ],
          [
            8453,
            {
              status: ChainIndexingStatusIds.Queued,
              config: {
                type: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: latestBlockRef,
                endBlock: null,
              },
            } satisfies ChainIndexingSnapshotQueued,
          ],
        ]),
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        snapshotTime: earlierBlockRef.timestamp + 1,
      } satisfies OmnichainIndexingSnapshot;

      // act
      const result = serializeOmnichainIndexingSnapshot(indexingStatus);

      // assert
      expect(result).toMatchObject({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: {
          "1": {
            status: ChainIndexingStatusIds.Following,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: earlierBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingSnapshotFollowing,
          "8453": {
            status: ChainIndexingStatusIds.Queued,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: latestBlockRef,
              endBlock: null,
            },
          } satisfies ChainIndexingSnapshotQueued,
          "10": {
            status: ChainIndexingStatusIds.Backfill,
            config: {
              type: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earlierBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: laterBlockRef,
            backfillEndBlock: latestBlockRef,
          } satisfies ChainIndexingSnapshotBackfill,
        },
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        snapshotTime: earlierBlockRef.timestamp + 1,
      } satisfies SerializedOmnichainIndexingSnapshot);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeOmnichainIndexingSnapshot(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });
  });
});
