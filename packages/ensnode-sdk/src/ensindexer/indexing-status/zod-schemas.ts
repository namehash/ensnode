/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import z from "zod/v4";
import { type ChainId, deserializeChainId } from "../../shared";
import {
  makeBlockRefSchema,
  makeChainIdStringSchema,
  makeDurationSchema,
  makeUnixTimestampSchema,
} from "../../shared/zod-schemas";
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
  CurrentIndexingProjectionOmnichain,
  IndexingStrategyIds,
  OmnichainIndexingSnapshotBackfill,
  OmnichainIndexingSnapshotCompleted,
  OmnichainIndexingSnapshotFollowing,
  OmnichainIndexingSnapshotUnstarted,
  OmnichainIndexingStatusIds,
} from "./types";
import {
  invariant_chainSnapshotBackfillBlocks,
  invariant_chainSnapshotCompletedBlocks,
  invariant_chainSnapshotFollowingBlocks,
  invariant_chainSnapshotQueuedBlocks,
  invariant_currentIndexingProjectionOmnichainMaxRealtimeDistanceIsCorrect,
  invariant_currentIndexingProjectionOmnichainRealtimeIsAfterOrEqualToSnapshotTime,
  invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain,
  invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains,
  invariant_omnichainSnapshotBackfillHasValidChains,
  invariant_omnichainSnapshotCompletedHasValidChains,
  invariant_omnichainSnapshotStatusIsConsistentWithChainSnapshot,
  invariant_omnichainSnapshotTimeIsAfterLatestKnownBlock,
  invariant_omnichainSnapshotTimeIsAfterOmnichainIndexingCursor,
  invariant_omnichainSnapshotUnstartedHasValidChains,
} from "./validations";

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
    .check(invariant_chainSnapshotQueuedBlocks);

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
    .check(invariant_chainSnapshotBackfillBlocks);

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
    .check(invariant_chainSnapshotCompletedBlocks);

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
    .check(invariant_chainSnapshotFollowingBlocks);

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
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Unstarted),
    chains: makeChainIndexingStatusesSchema(valueLabel)
      .check(invariant_omnichainSnapshotUnstartedHasValidChains)
      .transform((chains) => chains as Map<ChainId, ChainIndexingSnapshotQueued>),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    snapshotTime: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotBackfill}
 */
const makeOmnichainIndexingSnapshotBackfillSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Backfill),
    chains: makeChainIndexingStatusesSchema(valueLabel)
      .check(invariant_omnichainSnapshotBackfillHasValidChains)
      .transform(
        (chains) =>
          chains as Map<ChainId, ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill>,
      ),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    snapshotTime: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotCompleted}
 */
const makeOmnichainIndexingSnapshotCompletedSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Completed),
    chains: makeChainIndexingStatusesSchema(valueLabel)
      .check(invariant_omnichainSnapshotCompletedHasValidChains)
      .transform((chains) => chains as Map<ChainId, ChainIndexingSnapshotCompleted>),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    snapshotTime: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link OmnichainIndexingSnapshotFollowing}
 */
const makeOmnichainIndexingSnapshotFollowingSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Following),
    chains: makeChainIndexingStatusesSchema(valueLabel),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    snapshotTime: makeUnixTimestampSchema(valueLabel),
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
  z
    .discriminatedUnion("omnichainStatus", [
      makeOmnichainIndexingSnapshotUnstartedSchema(valueLabel),
      makeOmnichainIndexingSnapshotBackfillSchema(valueLabel),
      makeOmnichainIndexingSnapshotCompletedSchema(valueLabel),
      makeOmnichainIndexingSnapshotFollowingSchema(valueLabel),
    ])
    .check(invariant_omnichainSnapshotStatusIsConsistentWithChainSnapshot)
    .check(invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains)
    .check(invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain)
    .check(invariant_omnichainSnapshotTimeIsAfterOmnichainIndexingCursor)
    .check(invariant_omnichainSnapshotTimeIsAfterLatestKnownBlock);

/**
 * Makes Zod schema for {@link CurrentIndexingProjectionOmnichain}
 */
const makeCurrentIndexingProjectionOmnichainSchema = (
  valueLabel: string = "Current Indexing Projection",
) =>
  z
    .strictObject({
      type: z.literal(IndexingStrategyIds.Omnichain),
      realtime: makeUnixTimestampSchema(valueLabel),
      maxRealtimeDistance: makeDurationSchema(valueLabel),
      snapshot: makeOmnichainIndexingSnapshotSchema(valueLabel),
    })
    .check(invariant_currentIndexingProjectionOmnichainRealtimeIsAfterOrEqualToSnapshotTime)
    .check(invariant_currentIndexingProjectionOmnichainMaxRealtimeDistanceIsCorrect);

const makeCurrentIndexingProjectionUnavailableSchema = (
  valueLabel: string = "Current Indexing Projection Unavailable",
) =>
  z.strictObject({
    type: z.null(),
    realtime: makeUnixTimestampSchema(valueLabel),
    maxRealtimeDistance: z.null(),
    snapshot: z.null(),
  });

/**
 * Current Indexing Projection Schema
 *
 * Makes a Zod schema definition for validating current indexing projection
 * based on the provided indexing snapshot.
 */
export const makeCurrentIndexingProjectionSchema = (
  valueLabel: string = "Current Indexing Projection",
) =>
  z.discriminatedUnion("type", [
    makeCurrentIndexingProjectionOmnichainSchema(valueLabel),
    makeCurrentIndexingProjectionUnavailableSchema(valueLabel),
  ]);
