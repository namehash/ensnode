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
  ChainIndexingStatusIds,
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotQueued,
  CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  OmnichainIndexingStatusIds,
  OmnichainIndexingStatusSnapshotBackfill,
  OmnichainIndexingStatusSnapshotCompleted,
  OmnichainIndexingStatusSnapshotFollowing,
  OmnichainIndexingStatusSnapshotUnstarted,
  RealtimeIndexingStatusProjection,
} from "./types";
import {
  invariant_chainSnapshotBackfillBlocks,
  invariant_chainSnapshotCompletedBlocks,
  invariant_chainSnapshotFollowingBlocks,
  invariant_chainSnapshotQueuedBlocks,
  invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain,
  invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains,
  invariant_omnichainSnapshotStatusIsConsistentWithChainSnapshot,
  invariant_omnichainSnapshotUnstartedHasValidChains,
  invariant_omnichainStatusSnapshotBackfillHasValidChains,
  invariant_omnichainStatusSnapshotCompletedHasValidChains,
  invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime,
  invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect,
  invariant_slowestChainEqualsToOmnichainSnapshotTime,
  invariant_snapshotTimeIsTheHighestKnownBlockTimestamp,
} from "./validations";

/**
 * Makes Zod schema for {@link ChainIndexingConfig} type.
 */
const makeChainIndexingConfigSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("configType", [
    z.strictObject({
      configType: z.literal(ChainIndexingConfigTypeIds.Indefinite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: z.null(),
    }),
    z.strictObject({
      configType: z.literal(ChainIndexingConfigTypeIds.Definite),
      startBlock: makeBlockRefSchema(valueLabel),
      endBlock: makeBlockRefSchema(valueLabel),
    }),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshotQueued} type.
 */
export const makeChainIndexingStatusSnapshotQueuedSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      chainStatus: z.literal(ChainIndexingStatusIds.Queued),
      config: makeChainIndexingConfigSchema(valueLabel),
    })
    .check(invariant_chainSnapshotQueuedBlocks);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshotBackfill} type.
 */
export const makeChainIndexingStatusSnapshotBackfillSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      chainStatus: z.literal(ChainIndexingStatusIds.Backfill),
      config: makeChainIndexingConfigSchema(valueLabel),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
      backfillEndBlock: makeBlockRefSchema(valueLabel),
    })
    .check(invariant_chainSnapshotBackfillBlocks);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshotCompleted} type.
 */
export const makeChainIndexingStatusSnapshotCompletedSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      chainStatus: z.literal(ChainIndexingStatusIds.Completed),
      config: z.strictObject({
        configType: z.literal(ChainIndexingConfigTypeIds.Definite),
        startBlock: makeBlockRefSchema(valueLabel),
        endBlock: makeBlockRefSchema(valueLabel),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
    })
    .check(invariant_chainSnapshotCompletedBlocks);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshotFollowing} type.
 */
export const makeChainIndexingStatusSnapshotFollowingSchema = (valueLabel: string = "Value") =>
  z
    .strictObject({
      chainStatus: z.literal(ChainIndexingStatusIds.Following),
      config: z.strictObject({
        configType: z.literal(ChainIndexingConfigTypeIds.Indefinite),
        startBlock: makeBlockRefSchema(valueLabel),
      }),
      latestIndexedBlock: makeBlockRefSchema(valueLabel),
      latestKnownBlock: makeBlockRefSchema(valueLabel),
    })
    .check(invariant_chainSnapshotFollowingBlocks);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshot}
 */
export const makeChainIndexingStatusSnapshotSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("chainStatus", [
    makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
    makeChainIndexingStatusSnapshotBackfillSchema(valueLabel),
    makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
    makeChainIndexingStatusSnapshotFollowingSchema(valueLabel),
  ]);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshot} per chain.
 */
export const makeChainIndexingStatusesSchema = (valueLabel: string = "Value") =>
  z
    .record(makeChainIdStringSchema(), makeChainIndexingStatusSnapshotSchema(valueLabel), {
      error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
    })
    .transform((serializedChainsIndexingStatus) => {
      const chainsIndexingStatus = new Map<ChainId, ChainIndexingStatusSnapshot>();

      for (const [chainIdString, chainStatus] of Object.entries(serializedChainsIndexingStatus)) {
        chainsIndexingStatus.set(deserializeChainId(chainIdString), chainStatus);
      }

      return chainsIndexingStatus;
    });

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotUnstarted}
 */
const makeOmnichainIndexingStatusSnapshotUnstartedSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Unstarted),
    chains: makeChainIndexingStatusesSchema(valueLabel)
      .check(invariant_omnichainSnapshotUnstartedHasValidChains)
      .transform((chains) => chains as Map<ChainId, ChainIndexingStatusSnapshotQueued>),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotBackfill}
 */
const makeOmnichainIndexingStatusSnapshotBackfillSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Backfill),
    chains: makeChainIndexingStatusesSchema(valueLabel)
      .check(invariant_omnichainStatusSnapshotBackfillHasValidChains)
      .transform(
        (chains) =>
          chains as Map<
            ChainId,
            ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill
          >,
      ),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotCompleted}
 */
const makeOmnichainIndexingStatusSnapshotCompletedSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Completed),
    chains: makeChainIndexingStatusesSchema(valueLabel)
      .check(invariant_omnichainStatusSnapshotCompletedHasValidChains)
      .transform((chains) => chains as Map<ChainId, ChainIndexingStatusSnapshotCompleted>),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotFollowing}
 */
const makeOmnichainIndexingStatusSnapshotFollowingSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Following),
    chains: makeChainIndexingStatusesSchema(valueLabel),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Omnichain Indexing Snapshot Schema
 *
 * Makes a Zod schema definition for validating indexing snapshot
 * across all chains indexed by ENSIndexer instance.
 */
export const makeOmnichainIndexingStatusSnapshotSchema = (
  valueLabel: string = "Omnichain Indexing Snapshot",
) =>
  z
    .discriminatedUnion("omnichainStatus", [
      makeOmnichainIndexingStatusSnapshotUnstartedSchema(valueLabel),
      makeOmnichainIndexingStatusSnapshotBackfillSchema(valueLabel),
      makeOmnichainIndexingStatusSnapshotCompletedSchema(valueLabel),
      makeOmnichainIndexingStatusSnapshotFollowingSchema(valueLabel),
    ])
    .check(invariant_omnichainSnapshotStatusIsConsistentWithChainSnapshot)
    .check(invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains)
    .check(invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain);

/**
 * Makes Zod schema for {@link CrossChainIndexingStatusSnapshotOmnichain}
 */
const makeCrossChainIndexingStatusSnapshotOmnichainSchema = (
  valueLabel: string = "Cross-chain Indexing Status Snapshot Omnichain",
) =>
  z
    .strictObject({
      strategy: z.literal(CrossChainIndexingStrategyIds.Omnichain),
      slowestChainIndexingCursor: makeUnixTimestampSchema(valueLabel),
      snapshotTime: makeUnixTimestampSchema(valueLabel),
      omnichainSnapshot: makeOmnichainIndexingStatusSnapshotSchema(valueLabel),
    })
    .check(invariant_slowestChainEqualsToOmnichainSnapshotTime)
    .check(invariant_snapshotTimeIsTheHighestKnownBlockTimestamp);

/**
 * Makes Zod schema for {@link CrossChainIndexingStatusSnapshot}
 */
export const makeCrossChainIndexingStatusSnapshotSchema = (
  valueLabel: string = "Cross-chain Indexing Status Snapshot",
) =>
  z.discriminatedUnion("strategy", [
    makeCrossChainIndexingStatusSnapshotOmnichainSchema(valueLabel),
  ]);

/**
 * Makes Zod schema for {@link RealtimeIndexingStatusProjection}
 */
export const makeRealtimeIndexingStatusProjectionSchema = (
  valueLabel: string = "Realtime Indexing Status Projection",
) =>
  z
    .strictObject({
      projectedAt: makeUnixTimestampSchema(valueLabel),
      worstCaseDistance: makeDurationSchema(valueLabel),
      snapshot: makeCrossChainIndexingStatusSnapshotSchema(valueLabel),
    })
    .check(invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime)
    .check(invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect);
