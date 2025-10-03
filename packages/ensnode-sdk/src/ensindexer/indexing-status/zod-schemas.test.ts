import { describe, expect, it } from "vitest";
import { type ZodSafeParseResult, prettifyError } from "zod/v4";
import { earlierBlockRef, earliestBlockRef, laterBlockRef, latestBlockRef } from "./test-helpers";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotQueued,
} from "./types";
import { makeChainIndexingStatusSnapshotSchema } from "./zod-schemas";

describe("ENSIndexer: Indexing Status", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("ChainIndexingStatusSnapshotQueued", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued;

        // act
        const parsed = makeChainIndexingStatusSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued);
      });

      it("won't parse if the config.startBlock is after the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Queued,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: laterBlockRef,
            endBlock: earlierBlockRef,
          },
        } satisfies ChainIndexingStatusSnapshotQueued;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `config.startBlock` must be before or same as `config.endBlock`.",
        );
      });
    });

    describe("ChainIndexingStatusSnapshotBackfill", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill;

        // act
        const parsed = makeChainIndexingStatusSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: latestBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: earliestBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `config.startBlock` must be before or same as `latestIndexedBlock`.",
        );
      });

      it("won't parse if the latestIndexedBlock is after the backfillEndBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          backfillEndBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `latestIndexedBlock` must be before or same as `backfillEndBlock`.",
        );
      });

      it("won't parse if the backfillEndBlock different than the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Backfill,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          backfillEndBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotBackfill;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe("✖ `backfillEndBlock` must be the same as `config.endBlock`.");
      });
    });

    describe("ChainIndexingStatusSnapshotFollowing", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing;

        // act
        const parsed = makeChainIndexingStatusSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
          latestKnownBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: laterBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `config.startBlock` must be before or same as `latestIndexedBlock`.",
        );
      });

      it("won't parse if the latestIndexedBlock is after the latestKnownBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Following,
          config: {
            configType: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
          latestKnownBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotFollowing;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `latestIndexedBlock` must be before or same as `latestKnownBlock`.",
        );
      });
    });

    describe("ChainIndexingStatusSnapshotCompleted", () => {
      it("can parse a valid serialized status object", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted;

        // act
        const parsed = makeChainIndexingStatusSnapshotSchema().parse(serialized);

        // assert
        expect(parsed).toStrictEqual({
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted);
      });

      it("won't parse if the config.startBlock is after the latestIndexedBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: latestBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: laterBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `config.startBlock` must be before or same as `latestIndexedBlock`.",
        );
      });

      it("won't parse if the latestIndexedBlock is after the config.endBlock", () => {
        // arrange
        const serialized: ChainIndexingStatusSnapshot = {
          chainStatus: ChainIndexingStatusIds.Completed,
          config: {
            configType: ChainIndexingConfigTypeIds.Definite,
            startBlock: earlierBlockRef,
            endBlock: laterBlockRef,
          },
          latestIndexedBlock: latestBlockRef,
        } satisfies ChainIndexingStatusSnapshotCompleted;

        // act
        const notParsed = formatParseError(
          makeChainIndexingStatusSnapshotSchema().safeParse(serialized),
        );

        // assert
        expect(notParsed).toBe(
          "✖ `latestIndexedBlock` must be before or same as `config.endBlock`.",
        );
      });
    });
  });
});
