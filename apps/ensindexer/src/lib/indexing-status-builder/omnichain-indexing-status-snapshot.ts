import {
  type ChainIndexingStatusSnapshotCompleted,
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotQueued,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type OmnichainIndexingStatusSnapshotUnstarted,
  type Unvalidated,
  validateOmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import type { ChainId } from "@ensnode/ponder-sdk";

import type { ChainIndexingMetadata } from "./chain-indexing-metadata";
import { buildChainStatusSnapshots } from "./chain-indexing-status-snapshot";

/**
 * Build an omnichain indexing status snapshot from per-chain metadata.
 *
 * @param chainsIndexingMetadata - A map of chain IDs to their complete indexing
 *   metadata. Each entry contains the backfill scope, Ponder metrics, and status
 *   needed to determine that chain's indexing state.
 *
 * @returns The validated omnichain indexing status snapshot.
 */
export function buildOmnichainIndexingStatusSnapshot(
  chainsIndexingMetadata: Map<ChainId, ChainIndexingMetadata>,
): OmnichainIndexingStatusSnapshot {
  const chainStatusSnapshots = buildChainStatusSnapshots(chainsIndexingMetadata);

  const chains = Array.from(chainStatusSnapshots.values());
  const omnichainStatus = getOmnichainIndexingStatus(chains);
  const omnichainIndexingCursor = getOmnichainIndexingCursor(chains);

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: chainStatusSnapshots as Map<
          ChainId,
          Unvalidated<ChainIndexingStatusSnapshotQueued>
        >, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies Unvalidated<OmnichainIndexingStatusSnapshotUnstarted>);
    }

    case OmnichainIndexingStatusIds.Backfill: {
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: chainStatusSnapshots as Map<
          ChainId,
          Unvalidated<ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill>
        >, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies Unvalidated<OmnichainIndexingStatusSnapshotBackfill>);
    }

    case OmnichainIndexingStatusIds.Completed: {
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: chainStatusSnapshots as Map<
          ChainId,
          Unvalidated<ChainIndexingStatusSnapshotCompleted>
        >, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies Unvalidated<OmnichainIndexingStatusSnapshotCompleted>);
    }

    case OmnichainIndexingStatusIds.Following:
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: chainStatusSnapshots,
        omnichainIndexingCursor,
      } satisfies Unvalidated<OmnichainIndexingStatusSnapshotFollowing>);
  }
}
