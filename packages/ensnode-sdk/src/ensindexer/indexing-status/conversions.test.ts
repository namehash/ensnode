import { describe, expect, it } from "vitest";
import { deserializeENSIndexerIndexingStatus } from "./deserialize";
import { serializeENSIndexerIndexingStatus } from "./serialize";
import { SerializedENSIndexerOverallIndexingStatus } from "./serialized-types";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingStatusIds,
  ChainIndexingUnstartedStatus,
  ENSIndexerOverallIndexingStatus,
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
                indexingStrategy: "indefinite",
                startBlock: earliestBlockRef,
                endBlock: null,
              },
              latestIndexedBlock: earlierBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingBackfillStatus,
          ],
          [
            8453,
            {
              status: ChainIndexingStatusIds.Unstarted,
              config: {
                indexingStrategy: "definite",
                startBlock: earliestBlockRef,
                endBlock: laterBlockRef,
              },
            } satisfies ChainIndexingUnstartedStatus,
          ],
        ]),
        overallStatus: ChainIndexingStatusIds.Backfill,
      } satisfies ENSIndexerOverallIndexingStatus;

      // act
      const result = serializeENSIndexerIndexingStatus(indexingStatus);

      // assert
      expect(result).toStrictEqual({
        chains: {
          "1": {
            status: ChainIndexingStatusIds.Backfill,
            config: {
              indexingStrategy: "indefinite",
              startBlock: earliestBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: earlierBlockRef,
            backfillEndBlock: latestBlockRef,
          },
          "8453": {
            status: ChainIndexingStatusIds.Unstarted,
            config: {
              indexingStrategy: "definite",
              startBlock: earliestBlockRef,
              endBlock: laterBlockRef,
            },
          },
        },
        overallStatus: ChainIndexingStatusIds.Backfill,
      } satisfies SerializedENSIndexerOverallIndexingStatus);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeENSIndexerIndexingStatus(result);

      // assert
      expect(deserializedResult).toStrictEqual(indexingStatus);
    });
  });
});
