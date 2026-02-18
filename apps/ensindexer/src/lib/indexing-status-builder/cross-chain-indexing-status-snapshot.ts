import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import type { UnixTimestamp } from "@ensnode/ponder-sdk";

export function buildCrossChainIndexingStatusSnapshotOmnichain(
  omnichainSnapshot: OmnichainIndexingStatusSnapshot,
  snapshotTime: UnixTimestamp,
): CrossChainIndexingStatusSnapshotOmnichain {
  return {
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: omnichainSnapshot.omnichainIndexingCursor,
    snapshotTime,
    omnichainSnapshot,
  };
}
