import z, { prettifyError } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
} from "../chain-indexing-status-snapshot";
import {
  type CrossChainIndexingStatusSnapshot,
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
} from "../cross-chain-indexing-status-snapshot";
import { makeOmnichainIndexingStatusSnapshotSchema } from "./omnichain-indexing-status-snapshot";

/**
 * Validate an {@link CrossChainIndexingStatusSnapshot} object.
 */
export function validateCrossChainIndexingStatusSnapshot(
  unvalidatedSnapshot: CrossChainIndexingStatusSnapshot,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeCrossChainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedSnapshot);
  if (parsed.error) {
    throw new Error(`Invalid CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

/**
 * Invariant: for cross-chain indexing status snapshot omnichain,
 * slowestChainIndexingCursor equals to omnichainSnapshot.omnichainIndexingCursor
 */
export function invariant_slowestChainEqualsToOmnichainSnapshotTime(
  ctx: ParsePayload<CrossChainIndexingStatusSnapshotOmnichain>,
) {
  const { slowestChainIndexingCursor, omnichainSnapshot } = ctx.value;
  const { omnichainIndexingCursor } = omnichainSnapshot;

  if (slowestChainIndexingCursor !== omnichainIndexingCursor) {
    console.log("invariant_slowestChainEqualsToOmnichainSnapshotTime", {
      slowestChainIndexingCursor,
      omnichainIndexingCursor,
    });
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'slowestChainIndexingCursor' must be equal to 'omnichainSnapshot.omnichainIndexingCursor'`,
    });
  }
}

/**
 * Invariant: for cross-chain indexing status snapshot omnichain,
 * snapshotTime is greater than or equal to the "highest known block" timestamp.
 */
export function invariant_snapshotTimeIsTheHighestKnownBlockTimestamp(
  ctx: ParsePayload<CrossChainIndexingStatusSnapshotOmnichain>,
) {
  const { snapshotTime, omnichainSnapshot } = ctx.value;
  const chains = Array.from(omnichainSnapshot.chains.values());

  const startBlockTimestamps = chains.map((chain) => chain.config.startBlock.timestamp);

  const endBlockTimestamps = chains
    .map((chain) => chain.config)
    .filter((chainConfig) => chainConfig.configType === ChainIndexingConfigTypeIds.Definite)
    .map((chainConfig) => chainConfig.endBlock.timestamp);

  const backfillEndBlockTimestamps = chains
    .filter((chain) => chain.chainStatus === ChainIndexingStatusIds.Backfill)
    .map((chain) => chain.backfillEndBlock.timestamp);

  const latestKnownBlockTimestamps = chains
    .filter((chain) => chain.chainStatus === ChainIndexingStatusIds.Following)
    .map((chain) => chain.latestKnownBlock.timestamp);

  const highestKnownBlockTimestamp = Math.max(
    ...startBlockTimestamps,
    ...endBlockTimestamps,
    ...backfillEndBlockTimestamps,
    ...latestKnownBlockTimestamps,
  );

  if (snapshotTime < highestKnownBlockTimestamp) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'snapshotTime' (${snapshotTime}) must be greater than or equal to the "highest known block timestamp" (${highestKnownBlockTimestamp})`,
    });
  }
}

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
