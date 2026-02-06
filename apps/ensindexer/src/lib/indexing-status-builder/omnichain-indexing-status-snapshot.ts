import {
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
} from "@ensnode/ensnode-sdk";
import type { ChainId, PonderIndexingMetrics, PonderIndexingStatus } from "@ensnode/ponder-sdk";

import type { ChainBlockRefs } from "./chain-block-refs";
import { buildChainIndexingStatusSnapshots } from "./chain-indexing-status-snapshot";
import { validateOmnichainIndexingStatusSnapshot } from "./validate/omnichain-indexing-status-snapshot";

export function buildOmnichainIndexingStatusSnapshot(
  indexedChainIds: ChainId[],
  chainsBlockRefs: Map<ChainId, ChainBlockRefs>,
  ponderIndexingMetrics: PonderIndexingMetrics,
  ponderIndexingStatus: PonderIndexingStatus,
): OmnichainIndexingStatusSnapshot {
  const chainStatusSnapshots = buildChainIndexingStatusSnapshots(
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
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        chains: chainStatusSnapshots as Map<ChainId, ChainIndexingStatusSnapshotQueued>, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies OmnichainIndexingStatusSnapshotUnstarted);
    }

    case OmnichainIndexingStatusIds.Backfill: {
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: chainStatusSnapshots as Map<ChainId, ChainIndexingStatusSnapshotBackfill>, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies OmnichainIndexingStatusSnapshotBackfill);
    }

    case OmnichainIndexingStatusIds.Completed: {
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        chains: chainStatusSnapshots as Map<ChainId, ChainIndexingStatusSnapshotCompleted>, // narrowing the type here, will be validated in the following 'check' step
        omnichainIndexingCursor,
      } satisfies OmnichainIndexingStatusSnapshotCompleted);
    }

    case OmnichainIndexingStatusIds.Following:
      return validateOmnichainIndexingStatusSnapshot({
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: chainStatusSnapshots,
        omnichainIndexingCursor,
      } satisfies OmnichainIndexingStatusSnapshotFollowing);
  }
}
