/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
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
  makeUnixTimestampSchema,
} from "../../shared/zod-schemas";
import {
  checkChainIndexingStatusesForBackfillOverallStatus,
  checkChainIndexingStatusesForCompletedOverallStatus,
  checkChainIndexingStatusesForFollowingOverallStatus,
  checkChainIndexingStatusesForUnstartedOverallStatus,
  getOverallApproxRealtimeDistance,
  getOverallIndexingStatus,
  getStandbyChains,
} from "./helpers";
import {
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingConfig,
  ChainIndexingFollowingStatus,
  ChainIndexingQueuedStatus,
  ChainIndexingStatus,
  ChainIndexingStatusForBackfillOverallStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  ENSIndexerOverallIndexingBackfillStatus,
  ENSIndexerOverallIndexingCompletedStatus,
  ENSIndexerOverallIndexingErrorStatus,
  ENSIndexerOverallIndexingFollowingStatus,
  ENSIndexerOverallIndexingUnstartedStatus,
  OverallIndexingStatusIds,
} from "./types";

/**
 * Makes Zod schema for {@link ChainIndexingConfig} type.
 */
const makeChainIndexingConfigSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("strategy", [
    z.strictObject({
      strategy: z.literal(ChainIndexingStrategyIds.Indefinite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: z.null(),
    }),
    z.strictObject({
      strategy: z.literal(ChainIndexingStrategyIds.Definite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: makeBlockRefSchema(valueLabel),
    }),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingQueuedStatus} type.
 */
export const makeChainIndexingQueuedStatusSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Queued),
      config: makeChainIndexingConfigSchema(valueLabel),
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
      config: makeChainIndexingConfigSchema(valueLabel),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
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
      ({ latestIndexedBlock, backfillEndBlock }) =>
        blockRef.isBeforeOrEqualTo(latestIndexedBlock, backfillEndBlock),
      {
        error: `latestIndexedBlock must be before or same as backfillEndBlock.`,
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
        strategy: z.literal(ChainIndexingStrategyIds.Indefinite),
        startBlock: makeBlockRefSchema(valueLabel),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
      latestKnownBlock: makeBlockRefSchema(valueLabel),
      approxRealtimeDistance: makeDurationSchema(valueLabel),
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
        strategy: z.literal(ChainIndexingStrategyIds.Definite),
        startBlock: makeBlockRefSchema(valueLabel),
        endBlock: makeBlockRefSchema(valueLabel),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
    })
    .refine(
      ({ config, latestIndexedBlock }) =>
        blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock),
      {
        error: `config.startBlock must be before or same as latestIndexedBlock.`,
      },
    )
    .refine(
      ({ config, latestIndexedBlock }) =>
        blockRef.isBeforeOrEqualTo(latestIndexedBlock, config.endBlock),
      {
        error: `latestIndexedBlock must be before or same as config.endBlock.`,
      },
    );

/**
 * Makes Zod schema for {@link ChainIndexingStatus}
 */
export const makeChainIndexingStatusSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("status", [
    makeChainIndexingQueuedStatusSchema(valueLabel),
    makeChainIndexingBackfillStatusSchema(valueLabel),
    makeChainIndexingFollowingStatusSchema(valueLabel),
    makeChainIndexingCompletedStatusSchema(valueLabel),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingStatus} per chain.
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
 * Makes Zod schema for {@link ENSIndexerOverallIndexingUnstartedStatus}
 */
const makeUnstartedOverallStatusSchema = (valueLabel?: string) =>
  z
    .strictObject({
      overallStatus: z.literal(OverallIndexingStatusIds.Unstarted),
      chains: makeChainIndexingStatusesSchema(valueLabel)
        .refine(
          (chains) =>
            checkChainIndexingStatusesForUnstartedOverallStatus(Array.from(chains.values())),
          {
            error: `${valueLabel} all chains must have "queued" status`,
          },
        )
        .transform((chains) => chains as Map<ChainId, ChainIndexingQueuedStatus>),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOverallIndexingStatus(chains) === indexingStatus.overallStatus;
      },
      { error: `${valueLabel} is an invalid overallStatus.` },
    );

/**
 * Makes Zod schema for {@link ENSIndexerOverallIndexingBackfillStatus}
 */
const makeBackfillOverallStatusSchema = (valueLabel?: string) =>
  z
    .strictObject({
      overallStatus: z.literal(OverallIndexingStatusIds.Backfill),
      chains: makeChainIndexingStatusesSchema(valueLabel)
        .refine(
          (chains) =>
            checkChainIndexingStatusesForBackfillOverallStatus(Array.from(chains.values())),
          {
            error: `${valueLabel} at least one chain must be in "backfill" status and
each chain has to have a status of either "queued", "backfill" or "completed"`,
          },
        )
        .transform((chains) => chains as Map<ChainId, ChainIndexingStatusForBackfillOverallStatus>),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOverallIndexingStatus(chains) === indexingStatus.overallStatus;
      },
      { error: `${valueLabel} is an invalid overallStatus.` },
    )
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        const standbyChainStartBlocks = getStandbyChains(chains).map(
          (chain) => chain.config.startBlock.timestamp,
        );

        const standbyChainEarliestStartBlocks = Math.min(...standbyChainStartBlocks);

        return indexingStatus.omnichainIndexingCursor <= standbyChainEarliestStartBlocks;
      },
      {
        error:
          "omnichainIndexingCursor must be lower than or equal to the earliest config.startBlock across all standby chains",
      },
    );

/**
 * Makes Zod schema for {@link ENSIndexerOverallIndexingCompletedStatus}
 */
const makeCompletedOverallStatusSchema = (valueLabel?: string) =>
  z
    .strictObject({
      overallStatus: z.literal(OverallIndexingStatusIds.Completed),
      chains: makeChainIndexingStatusesSchema(valueLabel)
        .refine(
          (chains) =>
            checkChainIndexingStatusesForCompletedOverallStatus(Array.from(chains.values())),
          {
            error: `${valueLabel} all chains must have "completed" status`,
          },
        )
        .transform((chains) => chains as Map<ChainId, ChainIndexingCompletedStatus>),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOverallIndexingStatus(chains) === indexingStatus.overallStatus;
      },
      { error: `${valueLabel} is an invalid overallStatus.` },
    );

/**
 * Makes Zod schema for {@link ENSIndexerOverallIndexingFollowingStatus}
 */
const makeFollowingOverallStatusSchema = (valueLabel?: string) =>
  z
    .strictObject({
      overallStatus: z.literal(OverallIndexingStatusIds.Following),
      chains: makeChainIndexingStatusesSchema(valueLabel),
      overallApproxRealtimeDistance: makeDurationSchema(valueLabel),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOverallIndexingStatus(chains) === indexingStatus.overallStatus;
      },
      { error: `${valueLabel} is an invalid overallStatus.` },
    )
    .refine(
      (indexingStatus) =>
        checkChainIndexingStatusesForFollowingOverallStatus(
          Array.from(indexingStatus.chains.values()),
        ),
      {
        error: `${valueLabel} at least one chain must be in "following" status`,
      },
    )
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return (
          getOverallApproxRealtimeDistance(chains) === indexingStatus.overallApproxRealtimeDistance
        );
      },
      { error: `${valueLabel} is an invalid overallApproxRealtimeDistance.` },
    )
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        const standbyChainStartBlocks = getStandbyChains(chains).map(
          (chain) => chain.config.startBlock.timestamp,
        );

        const standbyChainEarliestStartBlocks = Math.min(...standbyChainStartBlocks);

        return indexingStatus.omnichainIndexingCursor <= standbyChainEarliestStartBlocks;
      },
      {
        error:
          "omnichainIndexingCursor must be lower than or equal to the earliest config.startBlock across all standby chains",
      },
    );

/**
 * Makes Zod schema for {@link ENSIndexerOverallIndexingErrorStatus}
 */
const makeErrorSchemaOverallStatusSchema = (valueLabel?: string) =>
  z.strictObject({
    overallStatus: z.literal(OverallIndexingStatusIds.IndexerError),
  });

/**
 * ENSIndexer Overall Indexing Status Schema
 *
 * Makes a Zod schema definition for validating indexing status
 * across all chains indexed by ENSIndexer instance.
 */
export const makeENSIndexerIndexingStatusSchema = (
  valueLabel: string = "ENSIndexerIndexingStatus",
) =>
  z.discriminatedUnion("overallStatus", [
    makeUnstartedOverallStatusSchema(valueLabel),
    makeBackfillOverallStatusSchema(valueLabel),
    makeCompletedOverallStatusSchema(valueLabel),
    makeFollowingOverallStatusSchema(valueLabel),
    makeErrorSchemaOverallStatusSchema(valueLabel),
  ]);
