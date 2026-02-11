import type { ParsePayload } from "zod/v4/core";

import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
} from "./chain-indexing-status-snapshot";
import type { CrossChainIndexingStatusSnapshotOmnichain } from "./cross-chain-indexing-status-snapshot";
import type { RealtimeIndexingStatusProjection } from "./types";

/**
 * Invariants for {@link OmnichainIndexingSnapshot}.
 */

/**
 * Invariants for {@link CrossChainIndexingStatusSnapshotOmnichain}.
 */

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
 * Invariants for {@link RealtimeIndexingStatusProjection}.
 */

/**
 * Invariant: For realtime indexing status projection,
 * `projectedAt` is after or same as `snapshot.snapshotTime`.
 */
export function invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime(
  ctx: ParsePayload<RealtimeIndexingStatusProjection>,
) {
  const projection = ctx.value;

  const { snapshot, projectedAt } = projection;

  if (snapshot.snapshotTime > projectedAt) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message: "`projectedAt` must be after or same as `snapshot.snapshotTime`.",
    });
  }
}

/**
 * Invariant: For realtime indexing status projection,
 * `worstCaseDistance` is the difference between `projectedAt`
 * and `omnichainIndexingCursor`.
 */
export function invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect(
  ctx: ParsePayload<RealtimeIndexingStatusProjection>,
) {
  const projection = ctx.value;
  const { projectedAt, snapshot, worstCaseDistance } = projection;
  const { omnichainSnapshot } = snapshot;
  const expectedWorstCaseDistance = projectedAt - omnichainSnapshot.omnichainIndexingCursor;

  if (worstCaseDistance !== expectedWorstCaseDistance) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message:
        "`worstCaseDistance` must be the exact difference between `projectedAt` and `snapshot.omnichainIndexingCursor`.",
    });
  }
}
