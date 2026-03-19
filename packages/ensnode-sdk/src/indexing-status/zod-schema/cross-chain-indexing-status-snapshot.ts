import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeUnixTimestampSchema } from "../../shared/zod-schemas";
import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  getHighestKnownBlockTimestamp,
} from "../cross-chain-indexing-status-snapshot";
import type { SerializedCrossChainIndexingStatusSnapshot } from "../serialize/cross-chain-indexing-status-snapshot";
import {
  makeOmnichainIndexingStatusSnapshotSchema,
  makeSerializedOmnichainIndexingStatusSnapshotSchema,
} from "./omnichain-indexing-status-snapshot";

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
  const highestKnownBlockTimestamp = getHighestKnownBlockTimestamp(chains);

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
    .object({
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
 * Makes Zod schema for {@link SerializedCrossChainIndexingStatusSnapshot}
 */
export const makeSerializedCrossChainIndexingStatusSnapshotSchema = (
  valueLabel: string = "Serialized Cross-chain Indexing Status Snapshot",
) =>
  z.object({
    strategy: z.enum(CrossChainIndexingStrategyIds),
    slowestChainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    snapshotTime: makeUnixTimestampSchema(valueLabel),
    omnichainSnapshot: makeSerializedOmnichainIndexingStatusSnapshotSchema(valueLabel),
  });
