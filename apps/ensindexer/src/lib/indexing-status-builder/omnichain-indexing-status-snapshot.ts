import {
  type ChainIndexingStatusSnapshot,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotCompleted,
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
} from "@ensnode/ensnode-sdk";
import type {
  ChainId,
  ChainIndexingMetrics,
  ChainIndexingStatus,
  PonderIndexingMetrics,
  PonderIndexingStatus,
} from "@ensnode/ponder-sdk";

import type { ChainBlockRefs } from "./chain-block-refs";
import { buildUnvalidatedChainIndexingStatusSnapshots } from "./chain-indexing-status-snapshot";

function validateOmnichainIndexingStatusSnapshot(
  snapshot: Unvalidated<OmnichainIndexingStatusSnapshot>,
): OmnichainIndexingStatusSnapshot {
  return snapshot as OmnichainIndexingStatusSnapshot; // TODO: implement actual validation logic in ENSNode SDK
}

function buildChainStatusSnapshots(
  indexedChainIds: ChainId[],
  chainsBlockRefs: Map<ChainId, ChainBlockRefs>,
  chainsIndexingMetrics: Map<ChainId, ChainIndexingMetrics>,
  chainsIndexingStatus: Map<ChainId, ChainIndexingStatus>,
): Map<ChainId, Unvalidated<ChainIndexingStatusSnapshot>> {
  const chainStatusSnapshots = buildUnvalidatedChainIndexingStatusSnapshots(
    indexedChainIds,
    chainsBlockRefs,
    chainsIndexingMetrics,
    chainsIndexingStatus,
  );

  return chainStatusSnapshots;
}

export function buildOmnichainIndexingStatusSnapshot(
  indexedChainIds: ChainId[],
  chainsBlockRefs: Map<ChainId, ChainBlockRefs>,
  ponderIndexingMetrics: PonderIndexingMetrics,
  ponderIndexingStatus: PonderIndexingStatus,
): OmnichainIndexingStatusSnapshot {
  const chainStatusSnapshots = buildChainStatusSnapshots(
    indexedChainIds,
    chainsBlockRefs,
    ponderIndexingMetrics.chains,
    ponderIndexingStatus.chains,
  );

  const chains = Array.from(chainStatusSnapshots.values());
  const omnichainStatus = getOmnichainIndexingStatus(chains);
  const omnichainIndexingCursor = getOmnichainIndexingCursor(chains);

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      return {
        omnichainStatus,
        chains: chainStatusSnapshots as Map<
          ChainId,
          Unvalidated<ChainIndexingStatusSnapshotQueued>
        >, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies Unvalidated<OmnichainIndexingStatusSnapshotUnstarted>;
    }

    case OmnichainIndexingStatusIds.Backfill: {
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: chainStatusSnapshots as Map<
          ChainId,
          Unvalidated<ChainIndexingStatusSnapshotBackfill>
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
