import { describe, expect, it } from "vitest";
import { deserializeENSIndexerIndexingStatus } from "./deserialize";
import { serializeENSIndexerIndexingStatus } from "./serialize";
import { SerializedENSIndexerIndexingStatus } from "./serialized-types";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingStatusIds,
  ChainIndexingUnstartedStatus,
  ENSIndexerIndexingStatus,
} from "./types";

describe("ENSIndexer: Indexing Status", () => {
  describe("ENSIndexerIndexingStatus", () => {
    it("can serialize and deserialize indexing status object", () => {
      // arrange
      const indexingStatus = {
        chains: new Map([
          [
            1,
            {
              status: ChainIndexingStatusIds.Backfill,
              config: {
                startBlock: earliestBlockRef,
                endBlock: null,
              },
              latestIndexedBlock: earlierBlockRef,
              latestKnownBlock: latestBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingBackfillStatus,
          ],
          [
            8453,
            {
              status: ChainIndexingStatusIds.Unstarted,
              config: {
                startBlock: earliestBlockRef,
                endBlock: laterBlockRef,
              },
            } satisfies ChainIndexingUnstartedStatus,
          ],
        ]),
      } satisfies ENSIndexerIndexingStatus;

      // act
      const result = serializeENSIndexerIndexingStatus(indexingStatus);

      // assert
      expect(result).toStrictEqual({
        chains: {
          "1": {
            status: ChainIndexingStatusIds.Backfill,
            config: {
              startBlock: earliestBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: earlierBlockRef,
            latestKnownBlock: latestBlockRef,
            backfillEndBlock: latestBlockRef,
          },
          "8453": {
            status: ChainIndexingStatusIds.Unstarted,
            config: {
              startBlock: earliestBlockRef,
              endBlock: laterBlockRef,
            },
          },
        },
      } satisfies SerializedENSIndexerIndexingStatus);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeENSIndexerIndexingStatus(result);

      // assert
      expect(deserializedResult).toStrictEqual(indexingStatus);
    });
  });
});
