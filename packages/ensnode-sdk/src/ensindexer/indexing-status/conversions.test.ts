import { describe, expect, it } from "vitest";

import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "./chain-indexing-status-snapshot";
import { deserializeOmnichainIndexingStatusSnapshot } from "./deserialize";
import {
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "./omnichain-indexing-status-snapshot";
import { serializeOmnichainIndexingStatusSnapshot } from "./serialize";
import type { SerializedOmnichainIndexingStatusSnapshot } from "./serialize/omnichain-indexing-status-snapshot";

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
                configType: ChainIndexingConfigTypeIds.Indefinite,
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
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
                configType: ChainIndexingConfigTypeIds.Indefinite,
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
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: laterBlockRef,
            latestKnownBlock: latestBlockRef,
          } satisfies ChainIndexingStatusSnapshotFollowing,
          "8453": {
            chainStatus: ChainIndexingStatusIds.Queued,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: latestBlockRef,
            },
          } satisfies ChainIndexingStatusSnapshotQueued,
          "10": {
            chainStatus: ChainIndexingStatusIds.Backfill,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
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
