import { z } from "zod/v4";

import { makeBlockRefSchema } from "../../../shared/zod-schemas";
import {
  type ChainIndexingConfig,
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";
import {
  invariant_chainSnapshotBackfillBlocks,
  invariant_chainSnapshotCompletedBlocks,
  invariant_chainSnapshotFollowingBlocks,
  invariant_chainSnapshotQueuedBlocks,
} from "../validations";

/**
 * Makes Zod schema for {@link ChainIndexingConfig} type.
 */
export const makeChainIndexingConfigSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("configType", [
    z.object({
      configType: z.literal(ChainIndexingConfigTypeIds.Indefinite),
      startBlock: makeBlockRefSchema(valueLabel),
    }),
    z.object({
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
    .object({
      chainStatus: z.literal(ChainIndexingStatusIds.Queued),
      config: makeChainIndexingConfigSchema(valueLabel),
    })
    .check(invariant_chainSnapshotQueuedBlocks);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshotBackfill} type.
 */
export const makeChainIndexingStatusSnapshotBackfillSchema = (valueLabel: string = "Value") =>
  z
    .object({
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
    .object({
      chainStatus: z.literal(ChainIndexingStatusIds.Completed),
      config: z.object({
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
    .object({
      chainStatus: z.literal(ChainIndexingStatusIds.Following),
      config: z.object({
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
