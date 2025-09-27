import { describe, expect, it } from "vitest";
import { deserializeENSIndexerIndexingStatus } from "./deserialize";
import { serializeENSIndexerIndexingStatus } from "./serialize";
import { SerializedENSIndexerOverallIndexingStatus } from "./serialized-types";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingQueuedStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  ENSIndexerOverallIndexingStatus,
} from "./types";

describe("ENSIndexer: Indexing Status", () => {
  describe("ENSIndexerIndexingStatus", () => {
    it("can serialize and deserialize indexing status object", () => {
      // arrange
      const indexingStatus = {
        overallStatus: ChainIndexingStatusIds.Following,
        chains: new Map([
          [
            1,
            {
              status: ChainIndexingStatusIds.Following,
              config: {
                strategy: ChainIndexingStrategyIds.Indefinite,
                startBlock: earliestBlockRef,
              },
              latestIndexedBlock: earlierBlockRef,
              latestKnownBlock: latestBlockRef,
              approxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
            } satisfies ChainIndexingFollowingStatus,
          ],
          [
            8453,
            {
              status: ChainIndexingStatusIds.Queued,
              config: {
                strategy: ChainIndexingStrategyIds.Indefinite,
                startBlock: latestBlockRef,
                endBlock: null,
              },
            } satisfies ChainIndexingQueuedStatus,
          ],
          [
            10,
            {
              status: ChainIndexingStatusIds.Backfill,
              config: {
                strategy: ChainIndexingStrategyIds.Indefinite,
                startBlock: earlierBlockRef,
                endBlock: null,
              },
              latestIndexedBlock: laterBlockRef,
              backfillEndBlock: latestBlockRef,
            } satisfies ChainIndexingBackfillStatus,
          ],
        ]),
        overallApproxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
        omnichainIndexingCursor: earlierBlockRef.timestamp,
      } satisfies ENSIndexerOverallIndexingStatus;

      // act
      const result = serializeENSIndexerIndexingStatus(indexingStatus);

      // assert
      expect(result).toStrictEqual({
        overallStatus: ChainIndexingStatusIds.Following,
        chains: {
          "1": {
            status: ChainIndexingStatusIds.Following,
            config: {
              strategy: ChainIndexingStrategyIds.Indefinite,
              startBlock: earliestBlockRef,
            },
            latestIndexedBlock: earlierBlockRef,
            latestKnownBlock: latestBlockRef,
            approxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
          } satisfies ChainIndexingFollowingStatus,
          "8453": {
            status: ChainIndexingStatusIds.Queued,
            config: {
              strategy: ChainIndexingStrategyIds.Indefinite,
              startBlock: latestBlockRef,
              endBlock: null,
            },
          } satisfies ChainIndexingQueuedStatus,
          "10": {
            status: ChainIndexingStatusIds.Backfill,
            config: {
              strategy: ChainIndexingStrategyIds.Indefinite,
              startBlock: earlierBlockRef,
              endBlock: null,
            },
            latestIndexedBlock: laterBlockRef,
            backfillEndBlock: latestBlockRef,
          } satisfies ChainIndexingBackfillStatus,
        },
        overallApproxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
        omnichainIndexingCursor: earlierBlockRef.timestamp,
      } satisfies SerializedENSIndexerOverallIndexingStatus);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeENSIndexerIndexingStatus(result);

      // assert
      expect(deserializedResult).toStrictEqual(indexingStatus);
    });
  });
});
