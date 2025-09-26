import type { ParsePayload } from "zod/v4/core";
import { ChainId, ChainIdString } from "../../shared";
import * as blockRef from "../../shared/block-ref";
import {
  checkChainIndexingStatusesForOmnichainStatusBackfill,
  checkChainIndexingStatusesForOmnichainStatusCompleted,
  checkChainIndexingStatusesForOmnichainStatusFollowing,
  checkChainIndexingStatusesForOmnichainStatusUnstarted,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
} from "./helpers";
import {
  ChainIndexingSnapshot,
  ChainIndexingSnapshotBackfill,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotFollowing,
  ChainIndexingSnapshotQueued,
  ChainIndexingStatusIds,
  CurrentIndexingProjection,
  CurrentIndexingProjectionOmnichain,
  type OmnichainIndexingSnapshot,
  OmnichainIndexingSnapshotCompleted,
  OmnichainIndexingSnapshotFollowing,
} from "./types";

/**
 * Invariants for {@link ChainIndexingSnapshot}.
 */

/**
 * Invariants for chain snapshot in 'queued' status:
 * - `config.endBlock` (if set) is after `config.startBlock`.
 */
export function invariant_chainSnapshotQueuedBlocks(
  ctx: ParsePayload<ChainIndexingSnapshotQueued>,
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
  ctx: ParsePayload<ChainIndexingSnapshotBackfill>,
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
  ctx: ParsePayload<ChainIndexingSnapshotCompleted>,
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
  ctx: ParsePayload<ChainIndexingSnapshotFollowing>,
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
  ctx: ParsePayload<OmnichainIndexingSnapshot>,
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
 * Invariant: For omnichain snapshot,
 * `snapshotTime` is after the `omnichainIndexingCursor`.
 */
export function invariant_omnichainSnapshotTimeIsAfterOmnichainIndexingCursor(
  ctx: ParsePayload<OmnichainIndexingSnapshot>,
) {
  const snapshot = ctx.value;

  if (snapshot.omnichainIndexingCursor > snapshot.snapshotTime) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message: "`snapshotTime` must be after or same as `omnichainIndexingCursor`.",
    });
  }
}

/**
 * Invariant: For omnichain snapshot,
 * `snapshotTime` is after the `latestKnownBlock` of all chains
 * in 'following' status (if any exist).
 */
export function invariant_omnichainSnapshotTimeIsAfterLatestKnownBlock(
  ctx: ParsePayload<OmnichainIndexingSnapshot>,
) {
  const snapshot = ctx.value;
  const followingChains = Object.values(snapshot.chains).filter(
    (chain) => chain.status === ChainIndexingStatusIds.Following,
  );

  // there are no following chains
  if (followingChains.length === 0) {
    // the invariant holds
    return;
  }

  const latestKnownBlockTimes = followingChains.map((chain) => chain.latestKnownBlock.timestamp);
  const maxLatestKnownBlockTime = Math.max(...latestKnownBlockTimes);

  // there are following chains
  // the invariant holds if the snapshot time is after the highest latestKnownBlock
  // of all chains in 'following' status
  if (maxLatestKnownBlockTime > snapshot.snapshotTime) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message:
        "`snapshotTime` must be after or same as the highest `latestKnownBlock` of all chains in 'following' status.",
    });
  }
}

/**
 * Invariant: For omnichain snapshot,
 * `omnichainIndexingCursor` is lower than the earliest start block
 * across all queued chains.
 *
 * Note: if there are no queued chains, the invariant holds.
 */
export function invariant_omnichainIndexingCursorLowerThanEarliestStartBlockAcrossQueuedChains(
  ctx: ParsePayload<OmnichainIndexingSnapshot>,
) {
  const snapshot = ctx.value;
  const queuedChains = Array.from(snapshot.chains.values()).filter(
    (chain) => chain.status === ChainIndexingStatusIds.Queued,
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
 * Invariant: For omnichain snapshot,
 * `omnichainIndexingCursor` is same as the highest latestIndexedBlock
 * across all indexed chains.
 *
 * Note: if there are no indexed chains, the invariant holds.
 */
export function invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain(
  ctx: ParsePayload<OmnichainIndexingSnapshot>,
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
 * Invariant: For omnichain snapshot 'unstarted',
 * all chains must have "queued" status.
 */
export function invariant_omnichainSnapshotUnstartedHasValidChains(
  ctx: ParsePayload<Map<ChainId, ChainIndexingSnapshot>>,
) {
  const chains = ctx.value;
  const hasValidChains = checkChainIndexingStatusesForOmnichainStatusUnstarted(
    Array.from(chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: chains,
      message: 'All chains must have "queued" status.',
    });
  }
}

/**
 * Invariant: For omnichain snapshot 'backfill',
 * at least one chain must be in "backfill" status and
 * each chain has to have a status of either "queued", "backfill"
 * or "completed".
 */
export function invariant_omnichainSnapshotBackfillHasValidChains(
  ctx: ParsePayload<Map<ChainId, ChainIndexingSnapshot>>,
) {
  const chains = ctx.value;
  const hasValidChains = checkChainIndexingStatusesForOmnichainStatusBackfill(
    Array.from(chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: chains,
      message:
        'At least one chain must be in "backfill" status and each chain has to have a status of either "queued", "backfill" or "completed".',
    });
  }
}

/**
 * Invariant: For omnichain snapshot 'completed',
 * all chains must have "completed" status.
 */
export function invariant_omnichainSnapshotCompletedHasValidChains(
  ctx: ParsePayload<Map<ChainId, ChainIndexingSnapshot>>,
) {
  const chains = ctx.value;
  const hasValidChains = checkChainIndexingStatusesForOmnichainStatusCompleted(
    Array.from(chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: chains,
      message: 'All chains must have "completed" status.',
    });
  }
}

/**
 * Invariant: For omnichain snapshot 'following',
 * at least one chain must be in 'following' status.
 */
export function invariant_omnichainSnapshotFollowingHasValidChains(
  ctx: ParsePayload<OmnichainIndexingSnapshotFollowing>,
) {
  const snapshot = ctx.value;
  const hasValidChains = checkChainIndexingStatusesForOmnichainStatusFollowing(
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
 * Invariants for {@link CurrentIndexingProjection}.
 */

/**
 * Invariant: For omnichain projection,
 * `realtime` is after or same as `snapshot.snapshotTime`.
 */
export function invariant_currentIndexingProjectionOmnichainRealtimeIsAfterOrEqualToSnapshotTime(
  ctx: ParsePayload<CurrentIndexingProjectionOmnichain>,
) {
  const projection = ctx.value;

  const { snapshot, realtime } = projection;

  if (snapshot.snapshotTime > realtime) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message: "`realtime` must be after or same as `snapshot.snapshotTime`.",
    });
  }
}

/**
 * Invariant: For omnichain projection,
 * `maxRealtimeDistance` is the difference between `realtime`
 * and `snapshot.omnichainIndexingCursor`.
 */
export function invariant_currentIndexingProjectionOmnichainMaxRealtimeDistanceIsCorrect(
  ctx: ParsePayload<CurrentIndexingProjectionOmnichain>,
) {
  const projection = ctx.value;
  const { snapshot, maxRealtimeDistance } = projection;
  const expectedMaxRealtimeDistance = projection.realtime - snapshot.omnichainIndexingCursor;

  if (maxRealtimeDistance !== expectedMaxRealtimeDistance) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message:
        "`maxRealtimeDistance` must be the exact difference between `realtime` and `snapshot.omnichainIndexingCursor`.",
    });
  }
}
