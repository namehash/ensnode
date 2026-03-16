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
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import { deserializeOmnichainIndexingStatusSnapshot } from "./deserialize/omnichain-indexing-status-snapshot";
import {
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "./omnichain-indexing-status-snapshot";
import {
  type SerializedOmnichainIndexingStatusSnapshot,
  serializeOmnichainIndexingStatusSnapshot,
} from "./serialize/omnichain-indexing-status-snapshot";

describe("ENSIndexer: Indexing Status", () => {
  describe("Omnichain Indexing Status Snapshot", () => {
    it("can serialize and deserialize indexing status object", () => {
      // arrange
      const indexingStatus = {
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
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
          [
            10,
            {
              chainStatus: ChainIndexingStatusIds.Backfill,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: earlierBlockRef,
              },
              latestIndexedBlock: laterBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                rangeType: RangeTypeIds.LeftBounded,
                startBlock: latestBlockRef,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
        ]),
        omnichainIndexingCursor: laterBlockRef.timestamp,
      } satisfies OmnichainIndexingStatusSnapshot;

      // act
      const result = serializeOmnichainIndexingStatusSnapshot(indexingStatus);

      // assert
      expect(result).toMatchObject({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: {
          "1": {
            chainStatus: ChainIndexingStatusIds.Following,
            config: {
              rangeType: RangeTypeIds.LeftBounded,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: laterBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotFollowing,
          "8453": {
            chainStatus: ChainIndexingStatusIds.Queued,
            config: {
              rangeType: RangeTypeIds.LeftBounded,
              startBlock: latestBlockRef,
            },
          } satisfies ChainIndexingStatusSnapshotQueued,
          "10": {
            chainStatus: ChainIndexingStatusIds.Backfill,
            config: {
              rangeType: RangeTypeIds.LeftBounded,
              startBlock: earlierBlockRef,
            },
            latestIndexedBlock: laterBlockRef,
            backfillEndBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotBackfill,
        },
        omnichainIndexingCursor: laterBlockRef.timestamp,
      } satisfies SerializedOmnichainIndexingStatusSnapshot);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeOmnichainIndexingStatusSnapshot(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });
  });
});
