import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  ChainIndexingUnstartedStatus,
} from "./types";
import { makeChainIndexingStatusSchema } from "./zod-schemas";

describe("ENSIndexer: Indexing Status", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("ChainIndexingUnstartedStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Unstarted,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingUnstartedStatus;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Unstarted,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingUnstartedStatus);
      });

      it("won't parse if the config.startBlock is after the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Unstarted,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: laterBlockRef,
            endBlock: earlierBlockRef,
          },
        } satisfies ChainIndexingUnstartedStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as config.endBlock.`);
      });
    });

    describe("ChainIndexingBackfillStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingBackfillStatus;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingBackfillStatus);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: earliestBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingBackfillStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the backfillEndBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingBackfillStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as backfillEndBlock.`);
      });

      it("won't parse if the backfillEndBlock different than the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingBackfillStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ backfillEndBlock must be the same as config.endBlock.`);
      });
    });

    describe("ChainIndexingFollowingStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
          approxRealtimeDistance: 0,
        } satisfies ChainIndexingFollowingStatus;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
          approxRealtimeDistance: 0,
        } satisfies ChainIndexingFollowingStatus);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: laterBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
          approxRealtimeDistance: 777,
        } satisfies ChainIndexingFollowingStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the latestKnownBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          latestKnownBlock: laterBlockRef,
          approxRealtimeDistance: 777,
        } satisfies ChainIndexingFollowingStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as latestKnownBlock.`);
      });

      it("won't parse if the approxRealtimeDistance was a negative integer", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Following,
          config: {
            strategy: ChainIndexingStrategyIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
          approxRealtimeDistance: -1,
        } satisfies ChainIndexingFollowingStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ Value must be a non-negative integer (>=0).
  → at approxRealtimeDistance`);
      });
    });

    describe("ChainIndexingCompletedStatus", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus;

        // act
        const parsed = makeChainIndexingStatusSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: latestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingCompletedStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingStatus = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            strategy: ChainIndexingStrategyIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingCompletedStatus;

        // act
        const notParsed = formatParseError(makeChainIndexingStatusSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as config.endBlock.`);
      });
    });
  });
});
