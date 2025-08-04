import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import { SerializedBlockRef, deserializeBlockRef } from "../../shared";
import { SerializedChainIndexingStatus } from "./serialized-types";
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
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingNotStartedStatus,
  ChainIndexingStatusIds,
} from "./types";
import { makeChainIndexingStatusSchema } from "./zod-schemas";

describe("ENSIndexer: Indexing Status", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("ChainIndexingNotStartedStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.NotStarted,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
        } satisfies ChainIndexingNotStartedStatus<SerializedBlockRef>;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.NotStarted,
          config: {
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingNotStartedStatus);
      });

      it("won't parse if the config.startBlock is after the config.endBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.NotStarted,
          config: {
            startBlock: laterSerializedBlockRef,
            endBlock: earlierSerializedBlockRef,
          },
        } satisfies ChainIndexingNotStartedStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as config.endBlock.`);
      });
    });

    describe("ChainIndexingBackfillStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: earlierSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          backfillEndBlock: laterSerializedBlockRef,
        } satisfies ChainIndexingBackfillStatus<SerializedBlockRef>;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Backfill,
          config: {
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingBackfillStatus);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: earliestSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          backfillEndBlock: laterSerializedBlockRef,
        } satisfies ChainIndexingBackfillStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the latestKnownBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: latestSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          backfillEndBlock: laterSerializedBlockRef,
        } satisfies ChainIndexingBackfillStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as latestKnownBlock.`);
      });

      it("won't parse if the backfillEndBlock different than the latestKnownBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: earlierSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          backfillEndBlock: latestSerializedBlockRef,
        } satisfies ChainIndexingBackfillStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestKnownBlock must be the same as backfillEndBlock.
✖ backfillEndBlock must be the same as config.endBlock.`);
      });

      it("won't parse if the backfillEndBlock different than the config.endBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: latestSerializedBlockRef,
          latestKnownBlock: latestSerializedBlockRef,
          backfillEndBlock: latestSerializedBlockRef,
        } satisfies ChainIndexingBackfillStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ backfillEndBlock must be the same as config.endBlock.`);
      });
    });

    describe("ChainIndexingFollowingStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            startBlock: earlierSerializedBlockRef,
          },
          latestIndexedBlock: laterSerializedBlockRef,
          latestKnownBlock: latestSerializedBlockRef,
          approximateRealtimeDistance: 0,
        } satisfies ChainIndexingFollowingStatus<SerializedBlockRef>;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Following,
          config: {
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
          approximateRealtimeDistance: 0,
        } satisfies ChainIndexingFollowingStatus);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            startBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: earlierSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          approximateRealtimeDistance: 777,
        } satisfies ChainIndexingFollowingStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the latestKnownBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            startBlock: earlierSerializedBlockRef,
          },
          latestIndexedBlock: latestSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          approximateRealtimeDistance: 777,
        } satisfies ChainIndexingFollowingStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as latestKnownBlock.`);
      });

      it("won't parse if the latestKnownBlock is after the config.endBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: latestSerializedBlockRef,
          latestKnownBlock: latestSerializedBlockRef,
        } satisfies ChainIndexingCompletedStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestKnownBlock must be the same as config.endBlock.`);
      });

      it("won't parse if the approximateRealtimeDistance was a negative integer", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            startBlock: earlierSerializedBlockRef,
          },
          latestIndexedBlock: earlierSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
          approximateRealtimeDistance: -1,
        } satisfies ChainIndexingFollowingStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ Value must be a non-negative integer (>=0).
  → at approximateRealtimeDistance`);
      });
    });

    describe("ChainIndexingCompletedStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: earlierSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
        } satisfies ChainIndexingCompletedStatus<SerializedBlockRef>;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Completed,
          config: {
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: earliestSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
        } satisfies ChainIndexingCompletedStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the latestKnownBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: latestSerializedBlockRef,
          latestKnownBlock: laterSerializedBlockRef,
        } satisfies ChainIndexingCompletedStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as latestKnownBlock.`);
      });

      it("won't parse if the latestKnownBlock is after the config.endBlock", () => {
        // arrange
        const serialized: SerializedChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            startBlock: earlierSerializedBlockRef,
            endBlock: laterSerializedBlockRef,
          },
          latestIndexedBlock: latestSerializedBlockRef,
          latestKnownBlock: latestSerializedBlockRef,
        } satisfies ChainIndexingCompletedStatus<SerializedBlockRef>;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestKnownBlock must be the same as config.endBlock.`);
      });
    });
  });
});
