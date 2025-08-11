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
} from "../../shared/zod-schemas";
import { getOverallApproxRealtimeDistance, getOverallIndexingStatus } from "./helpers";
import {
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  OverallIndexingStatusIds,
} from "./types";
import type {
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingConfig,
  ChainIndexingFollowingStatus,
  ChainIndexingStatus,
  ChainIndexingUnstartedStatus,
  ENSIndexerOverallIndexingStatusError,
  ENSIndexerOverallIndexingStatusOk,
  ENSIndexerOverallIndexingStatusOkFollowing,
} from "./types";

/**
 * Makes Zod schema for {@link ChainIndexingConfig} type.
 */
const makeChainIndexingConfigSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("indexingStrategy", [
    z.strictObject({
      indexingStrategy: z.literal(ChainIndexingStrategyIds.Indefinite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: z.null().default(null),
    }),
    z.strictObject({
      indexingStrategy: z.literal(ChainIndexingStrategyIds.Definite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: makeBlockRefSchema(valueLabel),
    }),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingUnstartedStatus} type.
 */
export const makeChainIndexingUnstartedStatusSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Unstarted),
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
        indexingStrategy: z.literal(ChainIndexingStrategyIds.Indefinite),
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
        indexingStrategy: z.literal(ChainIndexingStrategyIds.Definite),
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
      ({ config, latestIndexedBlock }) => blockRef.isEqualTo(latestIndexedBlock, config.endBlock),
      {
        error: `latestIndexedBlock must be the same as config.endBlock.`,
      },
    );

/**
 * Makes Zod schema for {@link ChainIndexingStatus}
 */
export const makeChainIndexingStatusSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("status", [
    makeChainIndexingUnstartedStatusSchema(valueLabel),
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
 * Makes Zod schema for {@link ENSIndexerOverallIndexingStatusOk}
 */
const makeOverallIndexingStatusWithDataSchema = (valueLabel?: string) => {
  const expectedStatuses = Object.values(OverallIndexingStatusIds).filter(
    (statusId) =>
      statusId !== OverallIndexingStatusIds.IndexerError &&
      statusId !== OverallIndexingStatusIds.Following,
  );

  return z
    .strictObject({
      chains: makeChainIndexingStatusesSchema(valueLabel),
      overallStatus: z.enum(
        Object.values(OverallIndexingStatusIds).filter(
          (statusId) =>
            statusId !== OverallIndexingStatusIds.IndexerError &&
            statusId !== OverallIndexingStatusIds.Following,
        ),
        {
          error: `${valueLabel}.overallStatus must be one of ${expectedStatuses.join(", ")}`,
        },
      ),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOverallIndexingStatus(chains) === indexingStatus.overallStatus;
      },
      { error: `${valueLabel} is an invalid overallStatus.` },
    );
};

/**
 * Makes Zod schema for {@link ENSIndexerOverallIndexingStatusOkFollowing}
 */
const makeOverallIndexingStatusFollowing = (valueLabel?: string) =>
  makeOverallIndexingStatusWithDataSchema(valueLabel)
    .extend({
      overallStatus: z.literal(OverallIndexingStatusIds.Following),
      approximateRealtimeDistance: makeDurationSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return (
          getOverallApproxRealtimeDistance(chains) === indexingStatus.approximateRealtimeDistance
        );
      },
      { error: `${valueLabel} is an invalid approximateRealtimeDistances.` },
    );

/**
 * Makes Zod schema for {@link ENSIndexerOverallIndexingStatusError}
 */
const makeOverallIndexingStatusErrorSchema = (valueLabel?: string) =>
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
    makeOverallIndexingStatusWithDataSchema(valueLabel),
    makeOverallIndexingStatusFollowing(valueLabel),
    makeOverallIndexingStatusErrorSchema(valueLabel),
  ]);
