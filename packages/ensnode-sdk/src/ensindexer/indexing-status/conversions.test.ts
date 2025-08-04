import { describe, expect, it } from "vitest";
import { deserializeENSIndexerIndexingStatus } from "./deserialize";
import { serializeENSIndexerIndexingStatus } from "./serialize";
import { SerializedENSIndexerIndexingStatus } from "./serialized-types";
import {
  earlierBlockRef,
  earlierSerializedBlockRef,
  earliestBlockRef,
  earliestSerializedBlockRef,
  laterBlockRef,
  laterSerializedBlockRef,
  latestBlockRef,
  latestSerializedBlockRef,
} from "./test-helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingNotStartedStatus,
  ChainIndexingStatusIds,
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
              status: ChainIndexingStatusIds.NotStarted,
              config: {
                startBlock: earliestBlockRef,
                endBlock: laterBlockRef,
              },
            } satisfies ChainIndexingNotStartedStatus,
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
              startBlock: earliestSerializedBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: earlierSerializedBlockRef,
            latestKnownBlock: latestSerializedBlockRef,
            backfillEndBlock: latestSerializedBlockRef,
          },
          "8453": {
            status: ChainIndexingStatusIds.NotStarted,
            config: {
              startBlock: earliestSerializedBlockRef,
              endBlock: laterSerializedBlockRef,
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
