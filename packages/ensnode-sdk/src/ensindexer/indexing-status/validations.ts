import type { ParsePayload } from "zod/v4/core";
import type { ChainId } from "../../shared";
import * as blockRef from "../../shared/block-ref";
import {
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
  getOmnichainIndexingStatus,
} from "./helpers";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotQueued,
  CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStatusSnapshotOmnichain,
  type OmnichainIndexingStatusSnapshot,
  OmnichainIndexingStatusSnapshotFollowing,
  RealtimeIndexingStatusProjection,
} from "./types";

/**
 * Invariants for {@link ChainIndexingSnapshot}.
 */

/**
 * Invariants for chain snapshot in 'queued' status:
 * - `config.endBlock` (if set) is after `config.startBlock`.
 */
export function invariant_chainSnapshotQueuedBlocks(
  ctx: ParsePayload<ChainIndexingStatusSnapshotQueued>,
) {
  const { config } = ctx.value;

  if (config.endBlock && blockRef.isBeforeOrEqualTo(config.startBlock, config.endBlock) === false) {
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

  if (config.endBlock && blockRef.isEqualTo(backfillEndBlock, config.endBlock) === false) {
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
 * Invariants for {@link OmnichainIndexingSnapshot}.
 */

/**
 * Invariant: For omnichain snapshot,
 * `omnichainStatus` is set based on the snapshots of individual chains.
 */
export function invariant_omnichainSnapshotStatusIsConsistentWithChainSnapshot(
  ctx: ParsePayload<OmnichainIndexingStatusSnapshot>,
) {
  const snapshot = ctx.value;
  const chains = Array.from(snapshot.chains.values());
  const expectedOmnichainStatus = getOmnichainIndexingStatus(chains);
  const actualOmnichainStatus = snapshot.omnichainStatus;

  if (expectedOmnichainStatus !== actualOmnichainStatus) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message: `'${actualOmnichainStatus}' is an invalid omnichainStatus. Expected '${expectedOmnichainStatus}' based on the statuses of individual chains.`,
    });
  }
}

/**
 * Invariant: For omnichain status snapshot,
 * `omnichainIndexingCursor` is lower than the earliest start block
 * across all queued chains.
 *
 * Note: if there are no queued chains, the invariant holds.
 */
export function invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains(
  ctx: ParsePayload<OmnichainIndexingStatusSnapshot>,
) {
  const snapshot = ctx.value;
  const queuedChains = Array.from(snapshot.chains.values()).filter(
    (chain) => chain.chainStatus === ChainIndexingStatusIds.Queued,
  );

  // there are no queued chains
  if (queuedChains.length === 0) {
    // the invariant holds
    return;
  }

  const queuedChainStartBlocks = queuedChains.map((chain) => chain.config.startBlock.timestamp);
  const queuedChainEarliestStartBlock = Math.min(...queuedChainStartBlocks);

  // there are queued chains
  // the invariant holds if the omnichain indexing cursor is lower than
  // the earliest start block across all queued chains
  if (snapshot.omnichainIndexingCursor >= queuedChainEarliestStartBlock) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message:
        "`omnichainIndexingCursor` must be lower than the earliest start block across all queued chains.",
    });
  }
}

/**
 * Invariant: For omnichain status snapshot,
 * `omnichainIndexingCursor` is same as the highest latestIndexedBlock
 * across all indexed chains.
 *
 * Note: if there are no indexed chains, the invariant holds.
 */
export function invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain(
  ctx: ParsePayload<OmnichainIndexingStatusSnapshot>,
) {
  const snapshot = ctx.value;
  const indexedChains = Object.values(snapshot.chains).filter(
    (chain) =>
      chain.status === ChainIndexingStatusIds.Backfill ||
      chain.status === ChainIndexingStatusIds.Completed ||
      chain.status === ChainIndexingStatusIds.Following,
  );

  // there are no indexed chains
  if (indexedChains.length === 0) {
    // the invariant holds
    return;
  }

  const indexedChainLatestIndexedBlocks = indexedChains.map(
    (chain) => chain.latestIndexedBlock.timestamp,
  );
  const indexedChainHighestLatestIndexedBlock = Math.max(...indexedChainLatestIndexedBlocks);

  // there are indexed chains
  // the invariant holds if the omnichain indexing cursor is same as
  // the highest latestIndexedBlock across all indexed chains
  if (snapshot.omnichainIndexingCursor !== indexedChainHighestLatestIndexedBlock) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message:
        "`omnichainIndexingCursor` must be same as the highest `latestIndexedBlock` across all indexed chains.",
    });
  }
}

/**
 * Invariant: For omnichain status snapshot 'unstarted',
 * all chains must have "queued" status.
 */
export function invariant_omnichainSnapshotUnstartedHasValidChains(
  ctx: ParsePayload<Map<ChainId, ChainIndexingStatusSnapshot>>,
) {
  const chains = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted(
    Array.from(chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: chains,
      message: `For omnichain status snapshot 'unstarted', all chains must have "queued" status.`,
    });
  }
}

/**
 * Invariant: For omnichain status snapshot 'backfill',
 * at least one chain must be in "backfill" status and
 * each chain has to have a status of either "queued", "backfill"
 * or "completed".
 */
export function invariant_omnichainStatusSnapshotBackfillHasValidChains(
  ctx: ParsePayload<Map<ChainId, ChainIndexingStatusSnapshot>>,
) {
  const chains = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill(
    Array.from(chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: chains,
      message: `For omnichain status snapshot 'backfill', at least one chain must be in "backfill" status and each chain has to have a status of either "queued", "backfill" or "completed".`,
    });
  }
}

/**
 * Invariant: For omnichain status snapshot 'completed',
 * all chains must have "completed" status.
 */
export function invariant_omnichainStatusSnapshotCompletedHasValidChains(
  ctx: ParsePayload<Map<ChainId, ChainIndexingStatusSnapshot>>,
) {
  const chains = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted(
    Array.from(chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: chains,
      message: `For omnichain status snapshot 'completed', all chains must have "completed" status.`,
    });
  }
}

/**
 * Invariant: For omnichain status snapshot 'following',
 * at least one chain must be in 'following' status.
 */
export function invariant_omnichainStatusSnapshotFollowingHasValidChains(
  ctx: ParsePayload<OmnichainIndexingStatusSnapshotFollowing>,
) {
  const snapshot = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing(
    Array.from(snapshot.chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message: "For omnichainStatus 'following', at least one chain must be in 'following' status.",
    });
  }
}

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
    .filter((chain) => chain.config.configType === ChainIndexingConfigTypeIds.Definite)
    .map((chain) => chain.config.endBlock!.timestamp);

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
      message: `'snapshotTime' must be greater than or equal to  the "highest known block timestamp" (${highestKnownBlockTimestamp})`,
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
