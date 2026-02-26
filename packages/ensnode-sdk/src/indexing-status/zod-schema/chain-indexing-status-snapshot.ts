import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import * as blockRef from "../../shared/block-ref";
import { makeBlockRefSchema } from "../../shared/zod-schemas";
import {
  BlockRefRangeTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotFollowing,
  type ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";

/**
 * Invariants for chain snapshot in 'queued' status:
 * - `config.endBlock` (if set) is after `config.startBlock`.
 */
export function invariant_chainSnapshotQueuedBlocks(
  ctx: ParsePayload<ChainIndexingStatusSnapshotQueued>,
) {
  const { config } = ctx.value;

  // The `config.endBlock` does not exist for `indefinite` config type
  if (config.blockRangeType === BlockRefRangeTypeIds.Indefinite) {
    // invariant holds
    return;
  }

  if (blockRef.isBeforeOrEqualTo(config.startBlock, config.endBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`config.startBlock` must be before or same as `config.endBlock`.",
    });
  }
}

/**
 * Invariants for chain snapshot in 'backfill' status:
 * - `config.startBlock` is before or same as `latestIndexedBlock`.
 * - `latestIndexedBlock` is before or same as `backfillEndBlock`.
 * - `backfillEndBlock` is the same as `config.endBlock` (if set).
 */
export function invariant_chainSnapshotBackfillBlocks(
  ctx: ParsePayload<ChainIndexingStatusSnapshotBackfill>,
) {
  const { config, latestIndexedBlock, backfillEndBlock } = ctx.value;

  if (blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`config.startBlock` must be before or same as `latestIndexedBlock`.",
    });
  }

  if (blockRef.isBeforeOrEqualTo(latestIndexedBlock, backfillEndBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`latestIndexedBlock` must be before or same as `backfillEndBlock`.",
    });
  }

  // The `config.endBlock` does not exist for `indefinite` config type
  if (config.blockRangeType === BlockRefRangeTypeIds.Indefinite) {
    // invariant holds
    return;
  }

  if (blockRef.isEqualTo(backfillEndBlock, config.endBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`backfillEndBlock` must be the same as `config.endBlock`.",
    });
  }
}

/**
 * Invariants for chain snapshot in 'completed' status:
 * - `config.startBlock` is before or same as `latestIndexedBlock`.
 * - `latestIndexedBlock` is before or same as `config.endBlock`.
 */
export function invariant_chainSnapshotCompletedBlocks(
  ctx: ParsePayload<ChainIndexingStatusSnapshotCompleted>,
) {
  const { config, latestIndexedBlock } = ctx.value;

  if (blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`config.startBlock` must be before or same as `latestIndexedBlock`.",
    });
  }

  if (blockRef.isBeforeOrEqualTo(latestIndexedBlock, config.endBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`latestIndexedBlock` must be before or same as `config.endBlock`.",
    });
  }
}

/**
 * Invariants for chain snapshot in 'following' status:
 * - `config.startBlock` is before or same as `latestIndexedBlock`.
 * - `latestIndexedBlock` is before or same as `latestKnownBlock`.
 */
export function invariant_chainSnapshotFollowingBlocks(
  ctx: ParsePayload<ChainIndexingStatusSnapshotFollowing>,
) {
  const { config, latestIndexedBlock, latestKnownBlock } = ctx.value;

  if (blockRef.isBeforeOrEqualTo(config.startBlock, latestIndexedBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`config.startBlock` must be before or same as `latestIndexedBlock`.",
    });
  }

  if (blockRef.isBeforeOrEqualTo(latestIndexedBlock, latestKnownBlock) === false) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "`latestIndexedBlock` must be before or same as `latestKnownBlock`.",
    });
  }
}

/**
 * Makes Zod schema for {@link BlockRefRange} type.
 */
export const makeBlockRefRangeSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("blockRangeType", [
    z.object({
      blockRangeType: z.literal(BlockRefRangeTypeIds.Indefinite),
      startBlock: makeBlockRefSchema(valueLabel),
    }),
    z.object({
      blockRangeType: z.literal(BlockRefRangeTypeIds.Definite),
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
      config: makeBlockRefRangeSchema(valueLabel),
    })
    .check(invariant_chainSnapshotQueuedBlocks);

/**
 * Makes Zod schema for {@link ChainIndexingStatusSnapshotBackfill} type.
 */
export const makeChainIndexingStatusSnapshotBackfillSchema = (valueLabel: string = "Value") =>
  z
    .object({
      chainStatus: z.literal(ChainIndexingStatusIds.Backfill),
      config: makeBlockRefRangeSchema(valueLabel),
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
        blockRangeType: z.literal(BlockRefRangeTypeIds.Definite),
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
        blockRangeType: z.literal(BlockRefRangeTypeIds.Indefinite),
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
