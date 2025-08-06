/**
 * Zod schemas can never be included in the NPM package for ENSNode SDK.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import z from "zod/v4";
import { ChainId, deserializeChainId } from "../../shared";
import * as blockRef from "../../shared/block-ref";
import {
  makeBlockRefSchema,
  makeChainIdStringSchema,
  makeDurationSchema,
} from "../../shared/zod-schemas";
import { ChainIndexingStatusIds } from "./types";
import type {
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingNotStartedStatus,
  ChainIndexingStatus,
} from "./types";

/**
 * Makes Zod schema for {@link ChainIndexingNotStartedStatus} type.
 */
export const makeChainIndexingNotStartedStatusSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.NotStarted),
      config: z.strictObject({
        startBlock: makeBlockRefSchema(valueLabel),
        endBlock: makeBlockRefSchema(valueLabel).nullable(),
      }),
    })
    .refine(
      ({ config }) =>
        config.endBlock === null || blockRef.isBeforeOrEqualTo(config.startBlock, config.endBlock),
      {
        error: `config.startBlock must be before or same as config.endBlock.`,
      },
    );

/**
 * Makes Zod schema for {@link ChainIndexingBackfillStatus} type.
 */
export const makeChainIndexingBackfillStatusSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Backfill),
      config: z.strictObject({
        startBlock: makeBlockRefSchema(valueLabel),
        endBlock: makeBlockRefSchema(valueLabel).nullable(),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
      latestKnownBlock: makeBlockRefSchema(valueLabel),
      backfillEndBlock: makeBlockRefSchema(valueLabel),
    })
    .refine(
      ({ config, latestIndexedBlock }) =>
        blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock),
      {
        error: `config.startBlock must be before or same as latestIndexedBlock.`,
      },
    )
    .refine(
      ({ latestIndexedBlock, latestKnownBlock }) =>
        blockRef.isBeforeOrEqualTo(latestIndexedBlock, latestKnownBlock),
      {
        error: `latestIndexedBlock must be before or same as latestKnownBlock.`,
      },
    )
    .refine(
      ({ latestKnownBlock, backfillEndBlock }) =>
        blockRef.isEqualTo(latestKnownBlock, backfillEndBlock),
      {
        error: `latestKnownBlock must be the same as backfillEndBlock.`,
      },
    )
    .refine(
      ({ config, backfillEndBlock }) =>
        config.endBlock === null || blockRef.isEqualTo(backfillEndBlock, config.endBlock),
      {
        error: `backfillEndBlock must be the same as config.endBlock.`,
      },
    );

/**
 * Makes Zod schema for {@link ChainIndexingFollowingStatus} type.
 */
export const makeChainIndexingFollowingStatusSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Following),
      config: z.strictObject({
        startBlock: makeBlockRefSchema(valueLabel),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
      latestKnownBlock: makeBlockRefSchema(valueLabel),
      approximateRealtimeDistance: makeDurationSchema(valueLabel),
    })
    .refine(
      ({ config, latestIndexedBlock }) =>
        blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock),
      {
        error: `config.startBlock must be before or same as latestIndexedBlock.`,
      },
    )
    .refine(
      ({ latestIndexedBlock, latestKnownBlock }) =>
        blockRef.isBeforeOrEqualTo(latestIndexedBlock, latestKnownBlock),
      {
        error: `latestIndexedBlock must be before or same as latestKnownBlock.`,
      },
    );

/**
 * Makes Zod schema for {@link ChainIndexingCompletedStatus} type.
 */
export const makeChainIndexingCompletedStatusSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Completed),
      config: z.strictObject({
        startBlock: makeBlockRefSchema(valueLabel),
        endBlock: makeBlockRefSchema(valueLabel).nullable(),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
      latestKnownBlock: makeBlockRefSchema(valueLabel),
    })
    .refine(
      ({ config, latestIndexedBlock }) =>
        blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock),
      {
        error: `config.startBlock must be before or same as latestIndexedBlock.`,
      },
    )
    .refine(
      ({ latestIndexedBlock, latestKnownBlock }) =>
        blockRef.isBeforeOrEqualTo(latestIndexedBlock, latestKnownBlock),
      {
        error: `latestIndexedBlock must be before or same as latestKnownBlock.`,
      },
    )
    .refine(
      ({ config, latestKnownBlock }) =>
        config.endBlock === null || blockRef.isEqualTo(latestKnownBlock, config.endBlock),
      {
        error: `latestKnownBlock must be the same as config.endBlock.`,
      },
    );

/**
 * Makes Zod schema for {@link ChainIndexingStatus}
 */
export const makeChainIndexingStatusSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("status", [
    makeChainIndexingNotStartedStatusSchema(valueLabel),
    makeChainIndexingBackfillStatusSchema(valueLabel),
    makeChainIndexingFollowingStatusSchema(valueLabel),
    makeChainIndexingCompletedStatusSchema(valueLabel),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingStatuses}
 */
export const makeChainIndexingStatusesSchema = (valueLabel: string = "Value") =>
  z
    .record(makeChainIdStringSchema(), makeChainIndexingStatusSchema(valueLabel), {
      error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
    })
    .transform((serializedChainsIndexingStatus) => {
      const chainsIndexingStatus = new Map<ChainId, ChainIndexingStatus>();

      for (const [chainIdString, chainStatus] of Object.entries(serializedChainsIndexingStatus)) {
        chainsIndexingStatus.set(deserializeChainId(chainIdString), chainStatus);
      }

      return chainsIndexingStatus;
    });

/**
 * ENSIndexer Indexing Status Schema
 *
 * Makes a Zod schema definition for validating indexing status
 * across all chains indexed by ENSIndexer instance.
 */
export const makeENSIndexerIndexingStatusSchema = (
  valueLabel: string = "ENSIndexerIndexingStatus",
) =>
  z.object({
    chains: makeChainIndexingStatusesSchema(valueLabel),
  });
