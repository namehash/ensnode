import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { deserializeChainId } from "../../../shared/deserialize";
import type { ChainId } from "../../../shared/types";
import { makeChainIdStringSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import {
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";
import {
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
  getOmnichainIndexingStatus,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshotFollowing,
} from "../omnichain-indexing-status-snapshot";
import { makeChainIndexingStatusSnapshotSchema } from "./chain-indexing-status-snapshot";

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
 * `omnichainIndexingCursor` is lower than or equal to
 * the highest `backfillEndBlock` across all backfill chains.
 *
 * Note: if there are no backfill chains, the invariant holds.
 */
export function invariant_omnichainIndexingCursorLowerThanOrEqualToLatestBackfillEndBlockAcrossBackfillChains(
  ctx: ParsePayload<OmnichainIndexingStatusSnapshot>,
) {
  const snapshot = ctx.value;
  const backfillChains = Array.from(snapshot.chains.values()).filter(
    (chain) => chain.chainStatus === ChainIndexingStatusIds.Backfill,
  );

  // there are no backfill chains
  if (backfillChains.length === 0) {
    // the invariant holds
    return;
  }

  const backfillEndBlocks = backfillChains.map((chain) => chain.backfillEndBlock.timestamp);
  const highestBackfillEndBlock = Math.max(...backfillEndBlocks);

  // there are backfill chains
  // the invariant holds if the omnichainIndexingCursor is lower than or
  // equal to the highest backfillEndBlock across all backfill chains.
  if (snapshot.omnichainIndexingCursor > highestBackfillEndBlock) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message:
        "`omnichainIndexingCursor` must be lower than or equal to the highest `backfillEndBlock` across all backfill chains.",
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
  const indexedChains = Array.from(snapshot.chains.values()).filter(
    (chain) =>
      chain.chainStatus === ChainIndexingStatusIds.Backfill ||
      chain.chainStatus === ChainIndexingStatusIds.Completed ||
      chain.chainStatus === ChainIndexingStatusIds.Following,
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
 * Makes Zod schema for {@link ChainIndexingStatusSnapshot} per chain.
 */
export const makeChainIndexingStatusesSchema = (valueLabel: string = "Value") =>
  z
    .record(makeChainIdStringSchema(), makeChainIndexingStatusSnapshotSchema(valueLabel), {
      error:
        "Chains indexing statuses must be an object mapping valid chain IDs to their indexing status snapshots.",
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
    .check(
      invariant_omnichainIndexingCursorLowerThanOrEqualToLatestBackfillEndBlockAcrossBackfillChains,
    )
    .check(invariant_omnichainIndexingCursorIsEqualToHighestLatestIndexedBlockAcrossIndexedChain);
