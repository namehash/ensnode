import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import {
  makeChainIdSchema,
  makeChainIdStringSchema,
  makeUnixTimestampSchema,
} from "../../../shared/zod-schemas";
import { ChainIndexingStatusIds } from "../chain-indexing-status-snapshot";
import {
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
  getOmnichainIndexingStatus,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type OmnichainIndexingStatusSnapshotUnstarted,
} from "../omnichain-indexing-status-snapshot";
import {
  SerializedOmnichainIndexingStatusSnapshot,
  SerializedOmnichainIndexingStatusSnapshotBackfill,
  SerializedOmnichainIndexingStatusSnapshotCompleted,
  SerializedOmnichainIndexingStatusSnapshotFollowing,
  SerializedOmnichainIndexingStatusSnapshotUnstarted,
} from "../serialize/omnichain-indexing-status-snapshot";
import {
  makeChainIndexingStatusSnapshotBackfillSchema,
  makeChainIndexingStatusSnapshotCompletedSchema,
  makeChainIndexingStatusSnapshotFollowingSchema,
  makeChainIndexingStatusSnapshotQueuedSchema,
} from "./chain-indexing-status-snapshot";

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
  ctx: ParsePayload<OmnichainIndexingStatusSnapshotUnstarted>,
) {
  const snapshot = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted(
    Array.from(snapshot.chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
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
  ctx: ParsePayload<OmnichainIndexingStatusSnapshotBackfill>,
) {
  const snapshot = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill(
    Array.from(snapshot.chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
      message: `For omnichain status snapshot 'backfill', at least one chain must be in "backfill" status and each chain has to have a status of either "queued", "backfill" or "completed".`,
    });
  }
}

/**
 * Invariant: For omnichain status snapshot 'completed',
 * all chains must have "completed" status.
 */
export function invariant_omnichainStatusSnapshotCompletedHasValidChains(
  ctx: ParsePayload<OmnichainIndexingStatusSnapshotCompleted>,
) {
  const snapshot = ctx.value;
  const hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted(
    Array.from(snapshot.chains.values()),
  );

  if (hasValidChains === false) {
    ctx.issues.push({
      code: "custom",
      input: snapshot,
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
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotUnstarted}
 */
const makeOmnichainIndexingStatusSnapshotUnstartedSchema = (valueLabel?: string) =>
  z
    .object({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Unstarted),
      chains: z.map(
        makeChainIdSchema(),
        z.discriminatedUnion("chainStatus", [
          makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
        ]),
        {
          error:
            "Chains indexing statuses must be a Map with ChainId as keys and ChainIndexingStatusSnapshot as values.",
        },
      ),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    })
    .check(invariant_omnichainSnapshotUnstartedHasValidChains);

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotBackfill}
 */
const makeOmnichainIndexingStatusSnapshotBackfillSchema = (valueLabel?: string) =>
  z
    .object({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Backfill),
      chains: z.map(
        makeChainIdSchema(),
        z.discriminatedUnion("chainStatus", [
          makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
          makeChainIndexingStatusSnapshotBackfillSchema(valueLabel),
          makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
        ]),
        {
          error:
            "Chains indexing statuses must be a Map with ChainId as keys and ChainIndexingStatusSnapshot as values.",
        },
      ),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    })
    .check(invariant_omnichainStatusSnapshotBackfillHasValidChains);

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotCompleted}
 */
const makeOmnichainIndexingStatusSnapshotCompletedSchema = (valueLabel?: string) =>
  z
    .object({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Completed),
      chains: z.map(
        makeChainIdSchema(),
        z.discriminatedUnion("chainStatus", [
          makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
        ]),
        {
          error:
            "Chains indexing statuses must be a Map with ChainId as keys and ChainIndexingStatusSnapshot as values.",
        },
      ),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    })
    .check(invariant_omnichainStatusSnapshotCompletedHasValidChains);

/**
 * Makes Zod schema for {@link OmnichainIndexingStatusSnapshotFollowing}
 */
const makeOmnichainIndexingStatusSnapshotFollowingSchema = (valueLabel?: string) =>
  z
    .object({
      omnichainStatus: z.literal(OmnichainIndexingStatusIds.Following),
      chains: z.map(
        makeChainIdSchema(),
        z.discriminatedUnion("chainStatus", [
          makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
          makeChainIndexingStatusSnapshotBackfillSchema(valueLabel),
          makeChainIndexingStatusSnapshotFollowingSchema(valueLabel),
          makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
        ]),
        {
          error:
            "Chains indexing statuses must be a Map with ChainId as keys and ChainIndexingStatusSnapshot as values.",
        },
      ),
      omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    })
    .check(invariant_omnichainStatusSnapshotFollowingHasValidChains);

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

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotUnstarted}
 */
const makeSerializedOmnichainIndexingStatusSnapshotUnstartedSchema = (valueLabel?: string) =>
  z.object({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Unstarted),
    chains: z.record(
      makeChainIdStringSchema(),
      z.discriminatedUnion("chainStatus", [
        makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
      ]),
    ),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotBackfill}
 */
const makeSerializedOmnichainIndexingStatusSnapshotBackfillSchema = (valueLabel?: string) =>
  z.object({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Backfill),
    chains: z.record(
      makeChainIdStringSchema(),
      z.discriminatedUnion("chainStatus", [
        makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
        makeChainIndexingStatusSnapshotBackfillSchema(valueLabel),
        makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
      ]),
    ),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotCompleted}
 */
const makeSerializedOmnichainIndexingStatusSnapshotCompletedSchema = (valueLabel?: string) =>
  z.object({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Completed),
    chains: z.record(
      makeChainIdStringSchema(),
      z.discriminatedUnion("chainStatus", [
        makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
      ]),
    ),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotFollowing}
 */
const makeSerializedOmnichainIndexingStatusSnapshotFollowingSchema = (valueLabel?: string) =>
  z.object({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Following),
    chains: z.record(
      makeChainIdStringSchema(),
      z.discriminatedUnion("chainStatus", [
        makeChainIndexingStatusSnapshotQueuedSchema(valueLabel),
        makeChainIndexingStatusSnapshotBackfillSchema(valueLabel),
        makeChainIndexingStatusSnapshotFollowingSchema(valueLabel),
        makeChainIndexingStatusSnapshotCompletedSchema(valueLabel),
      ]),
    ),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshot}.
 */
export const makeSerializedOmnichainIndexingStatusSnapshotSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("omnichainStatus", [
    makeSerializedOmnichainIndexingStatusSnapshotUnstartedSchema(valueLabel),
    makeSerializedOmnichainIndexingStatusSnapshotBackfillSchema(valueLabel),
    makeSerializedOmnichainIndexingStatusSnapshotCompletedSchema(valueLabel),
    makeSerializedOmnichainIndexingStatusSnapshotFollowingSchema(valueLabel),
  ]);
