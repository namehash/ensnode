import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingSnapshot,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotQueued,
  ChainIndexingStatusIds,
} from "./types";
import { makeChainIndexingSnapshotSchema } from "./zod-schemas";

describe("ENSIndexer: Indexing Status", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("ChainIndexingSnapshotQueued", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued;

        // act
        const parsed = makeChainIndexingSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued);
      });

      it("won't parse if the config.startBlock is after the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Queued,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: laterBlockRef,
            endBlock: earlierBlockRef,
          },
        } satisfies ChainIndexingSnapshotQueued;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as config.endBlock.`);
      });
    });

    describe("ChainIndexingSnapshotBackfill", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotBackfill;

        // act
        const parsed = makeChainIndexingSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotBackfill);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: earliestBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotBackfill;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the backfillEndBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotBackfill;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as backfillEndBlock.`);
      });

      it("won't parse if the backfillEndBlock different than the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Backfill,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotBackfill;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ backfillEndBlock must be the same as config.endBlock.`);
      });
    });

    describe("ChainIndexingSnapshotFollowing", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Following,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotFollowing;

        // act
        const parsed = makeChainIndexingSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Following,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotFollowing);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Following,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: laterBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotFollowing;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the latestKnownBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Following,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          latestKnownBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotFollowing;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as latestKnownBlock.`);
      });
    });

    describe("ChainIndexingSnapshotCompleted", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotCompleted;

        // act
        const parsed = makeChainIndexingSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotCompleted);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: latestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingSnapshotCompleted;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ config.startBlock must be before or same as latestIndexedBlock.`);
      });

      it("won't parse if the latestIndexedBlock is after the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingSnapshot = {
          status: ChainIndexingStatusIds.Completed,
          config: {
            type: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingSnapshotCompleted;

        // act
        const notParsed = formatParseError(makeChainIndexingSnapshotSchema().safeParse(serialized));

        // assert
        expect(notParsed).toBe(`✖ latestIndexedBlock must be before or same as config.endBlock.`);
      });
    });
  });
});
