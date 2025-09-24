/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import z from "zod/v4";
import { type ChainId, type UnixTimestamp, deserializeChainId } from "../../shared";
import * as blockRef from "../../shared/block-ref";
import {
  makeBlockRefSchema,
  makeChainIdStringSchema,
  makeDurationSchema,
  makeUnixTimestampSchema,
} from "../../shared/zod-schemas";
import {
  checkChainIndexingStatusesForOmnichainStatusBackfill,
  checkChainIndexingStatusesForOmnichainStatusCompleted,
  checkChainIndexingStatusesForOmnichainStatusFollowing,
  checkChainIndexingStatusesForOmnichainStatusUnstarted,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
} from "./helpers";
import {
  ChainIndexingConfig,
  ChainIndexingConfigTypeIds,
  ChainIndexingSnapshot,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill,
  ChainIndexingSnapshotQueued,
  ChainIndexingStatusIds,
  IndexingStrategyIds,
  OmnichainIndexingSnapshotBackfill,
  OmnichainIndexingSnapshotCompleted,
  OmnichainIndexingSnapshotFollowing,
  OmnichainIndexingSnapshotUnstarted,
  OmnichainIndexingStatusIds,
} from "./types";

/**
 * Makes Zod schema for {@link ChainIndexingConfig} type.
 */
const makeChainIndexingConfigSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("type", [
    z.strictObject({
      type: z.literal(ChainIndexingConfigTypeIds.Indefinite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: z.null(),
    }),
    z.strictObject({
      type: z.literal(ChainIndexingConfigTypeIds.Definite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: makeBlockRefSchema(valueLabel),
    }),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingSnapshotQueued} type.
 */
export const makeChainIndexingSnapshotQueuedSchema = (valueLabel: string = "Value") =>
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
 * Makes Zod schema for {@link ChainIndexingSnapshotBackfill} type.
 */
export const makeChainIndexingSnapshotBackfillSchema = (valueLabel: string = "Value") =>
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
 * Makes Zod schema for {@link ChainIndexingSnapshotFollowing} type.
 */
export const makeChainIndexingSnapshotFollowingSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Following),
      config: z.strictObject({
        type: z.literal(ChainIndexingConfigTypeIds.Indefinite),
        startBlock: makeBlockRefSchema(valueLabel),
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
    );

/**
 * Makes Zod schema for {@link ChainIndexingSnapshotCompleted} type.
 */
export const makeChainIndexingSnapshotCompletedSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      status: z.literal(ChainIndexingStatusIds.Completed),
      config: z.strictObject({
        type: z.literal(ChainIndexingConfigTypeIds.Definite),
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
 * Makes Zod schema for {@link ChainIndexingSnapshot}
 */
export const makeChainIndexingSnapshotSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("status", [
    makeChainIndexingSnapshotQueuedSchema(valueLabel),
    makeChainIndexingSnapshotBackfillSchema(valueLabel),
    makeChainIndexingSnapshotCompletedSchema(valueLabel),
    makeChainIndexingSnapshotFollowingSchema(valueLabel),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingSnapshot} per chain.
 */
export const makeChainIndexingStatusesSchema = (valueLabel: string = "Value") =>
  z
    .record(makeChainIdStringSchema(), makeChainIndexingSnapshotSchema(valueLabel), {
      error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
    })
    .transform((serializedChainsIndexingStatus) => {
      const chainsIndexingStatus = new Map<ChainId, ChainIndexingSnapshot>();

      for (const [chainIdString, chainStatus] of Object.entries(serializedChainsIndexingStatus)) {
        chainsIndexingStatus.set(deserializeChainId(chainIdString), chainStatus);
      }

      return chainsIndexingStatus;
    });

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotUnstarted}
 */
const makeOmnichainIndexingSnapshotUnstartedSchema = (valueLabel?: string) =>
  z
    .strictObject({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Unstarted),
      chains: makeChainIndexingStatusesSchema(valueLabel)
        .refine(
          (chains) =>
            checkChainIndexingStatusesForOmnichainStatusUnstarted(Array.from(chains.values())),
          {
            error: `${valueLabel} all chains must have "queued" status`,
          },
        )
        .transform((chains) => chains as Map<ChainId, ChainIndexingSnapshotQueued>),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
      snapshotTime: makeUnixTimestampSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOmnichainIndexingStatus(chains) === indexingStatus.omnichainStatus;
      },
      { error: `${valueLabel} is an invalid omnichainStatus.` },
    );

/**
 * Checks that the omnichain indexing cursor is lower than the earliest start block
 * across all queued chains.
 *
 * Note: if there are no queued chains, the invariant holds.
 *
 * @param indexingStatus The current indexing status.
 * @returns true if the invariant holds, false otherwise.
 */
function invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains(indexingStatus: {
  omnichainIndexingCursor: UnixTimestamp;
  chains: Map<ChainId, ChainIndexingSnapshot>;
}) {
  const chains = Array.from(indexingStatus.chains.values());
  const queuedChains = chains.filter((chain) => chain.status === ChainIndexingStatusIds.Queued);

  // there are no queued chains
  if (queuedChains.length === 0) {
    // the invariant holds
    return true;
  }

  const queuedChainStartBlocks = queuedChains.map((chain) => chain.config.startBlock.timestamp);
  const queuedChainEarliestStartBlock = Math.min(...queuedChainStartBlocks);

  // there are queued chains
  // the invariant holds if the omnichain indexing cursor is lower than
  // the earliest start block across all queued chains
  return indexingStatus.omnichainIndexingCursor < queuedChainEarliestStartBlock;
}

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotBackfill}
 */
const makeOmnichainIndexingSnapshotBackfillSchema = (valueLabel?: string) =>
  z
    .strictObject({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Backfill),
      chains: makeChainIndexingStatusesSchema(valueLabel)
        .refine(
          (chains) =>
            checkChainIndexingStatusesForOmnichainStatusBackfill(Array.from(chains.values())),
          {
            error: `${valueLabel} at least one chain must be in "backfill" status and
each chain has to have a status of either "queued", "backfill" or "completed"`,
          },
        )
        .transform(
          (chains) =>
            chains as Map<ChainId, ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill>,
        ),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
      snapshotTime: makeUnixTimestampSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOmnichainIndexingStatus(chains) === indexingStatus.omnichainStatus;
      },
      { error: `${valueLabel} is an invalid omnichainStatus.` },
    )
    .refine(invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains, {
      error:
        "omnichainIndexingCursor must be lower than the earliest config.startBlock across all queued chains",
    });

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotCompleted}
 */
const makeOmnichainIndexingSnapshotCompletedSchema = (valueLabel?: string) =>
  z
    .strictObject({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Completed),
      chains: makeChainIndexingStatusesSchema(valueLabel)
        .refine(
          (chains) =>
            checkChainIndexingStatusesForOmnichainStatusCompleted(Array.from(chains.values())),
          {
            error: `${valueLabel} all chains must have "completed" status`,
          },
        )
        .transform((chains) => chains as Map<ChainId, ChainIndexingSnapshotCompleted>),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
      snapshotTime: makeUnixTimestampSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOmnichainIndexingStatus(chains) === indexingStatus.omnichainStatus;
      },
      { error: `${valueLabel} is an invalid omnichainStatus.` },
    )
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return indexingStatus.omnichainIndexingCursor === getOmnichainIndexingCursor(chains);
      },
      {
        error:
          "omnichainIndexingCursor must be equal to the highest latestIndexedBlock across all chains",
      },
    );

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotFollowing}
 */
const makeOmnichainIndexingSnapshotFollowingSchema = (valueLabel?: string) =>
  z
    .strictObject({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Following),
      chains: makeChainIndexingStatusesSchema(valueLabel),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
      snapshotTime: makeUnixTimestampSchema(valueLabel),
    })
    .refine(
      (indexingStatus) => {
        const chains = Array.from(indexingStatus.chains.values());

        return getOmnichainIndexingStatus(chains) === indexingStatus.omnichainStatus;
      },
      { error: `${valueLabel} is an invalid omnichainStatus.` },
    )
    .refine(
      (indexingStatus) =>
        checkChainIndexingStatusesForOmnichainStatusFollowing(
          Array.from(indexingStatus.chains.values()),
        ),
      {
        error: `${valueLabel} at least one chain must be in "following" status`,
      },
    )
    .refine(invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains, {
      error:
        "omnichainIndexingCursor must be lower than the earliest config.startBlock across all queued chains",
    });

/**
 * Omnichain Indexing Snapshot Schema
 *
 * Makes a Zod schema definition for validating indexing snapshot
 * across all chains indexed by ENSIndexer instance.
 */
export const makeOmnichainIndexingSnapshotSchema = (
  valueLabel: string = "Omnichain Indexing Snapshot",
) =>
  z.discriminatedUnion("omnichainStatus", [
    makeOmnichainIndexingSnapshotUnstartedSchema(valueLabel),
    makeOmnichainIndexingSnapshotBackfillSchema(valueLabel),
    makeOmnichainIndexingSnapshotCompletedSchema(valueLabel),
    makeOmnichainIndexingSnapshotFollowingSchema(valueLabel),
  ]);

const makeCurrentIndexingProjectionOmnichainSchema = (
  valueLabel: string = "Current Indexing Projection",
) =>
  z.strictObject({
    type: z.literal(IndexingStrategyIds.Omnichain),
    realtime: makeUnixTimestampSchema(valueLabel),
    maxRealtimeDistance: makeDurationSchema(valueLabel),
    snapshot: makeOmnichainIndexingSnapshotSchema(valueLabel),
  });

const makeCurrentIndexingProjectionUnavailableSchema = (
  valueLabel: string = "Current Indexing Projection Unavailable",
) =>
  z.strictObject({
    type: z.null(),
    realtime: makeUnixTimestampSchema(valueLabel),
    maxRealtimeDistance: z.null(),
    snapshot: z.null(),
  });

export const makeCurrentIndexingProjectionSchema = (
  valueLabel: string = "Current Indexing Projection",
) =>
  z.discriminatedUnion("type", [
    makeCurrentIndexingProjectionOmnichainSchema(valueLabel),
    makeCurrentIndexingProjectionUnavailableSchema(valueLabel),
  ]);
