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
    it("can serialize and deserialize indexing status object maxRealtimeDistance was requested and satisfied", () => {
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
        ]),
        overallApproxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        maxRealtimeDistance: {
          requestedDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
          satisfiesRequestedDistance: true,
        },
      } satisfies ENSIndexerOverallIndexingStatus;

      // act
      const result = serializeENSIndexerIndexingStatus(indexingStatus);

      // assert
      expect(result).toMatchObject({
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
        maxRealtimeDistance: {
          requestedDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
          satisfiesRequestedDistance: true,
        },
      } satisfies SerializedENSIndexerOverallIndexingStatus);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeENSIndexerIndexingStatus(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });
    it("can serialize and deserialize indexing status object maxRealtimeDistance was requested, but not satisfied", () => {
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
        ]),
        overallApproxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
        omnichainIndexingCursor: earlierBlockRef.timestamp,
        maxRealtimeDistance: {
          requestedDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp - 1,
          satisfiesRequestedDistance: false,
        },
      } satisfies ENSIndexerOverallIndexingStatus;

      // act
      const result = serializeENSIndexerIndexingStatus(indexingStatus);

      // assert
      expect(result).toMatchObject({
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
        maxRealtimeDistance: {
          requestedDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp - 1,
          satisfiesRequestedDistance: false,
        },
      } satisfies SerializedENSIndexerOverallIndexingStatus);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeENSIndexerIndexingStatus(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });

    it("can serialize and deserialize indexing status object when no maxRealtimeDistance was requested", () => {
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
        ]),
        overallApproxRealtimeDistance: latestBlockRef.timestamp - earlierBlockRef.timestamp,
        omnichainIndexingCursor: earlierBlockRef.timestamp,
      } satisfies ENSIndexerOverallIndexingStatus;

      // act
      const result = serializeENSIndexerIndexingStatus(indexingStatus);

      console.log(result);

      // assert
      expect(result).toMatchObject({
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
        maxRealtimeDistance: undefined,
      } satisfies SerializedENSIndexerOverallIndexingStatus);

      // bonus step: deserialize serialized
      // act
      const deserializedResult = deserializeENSIndexerIndexingStatus(result);

      // assert
      expect(deserializedResult).toMatchObject(indexingStatus);
    });
  });
});
