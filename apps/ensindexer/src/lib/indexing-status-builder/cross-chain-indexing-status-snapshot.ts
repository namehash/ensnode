import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  type OmnichainIndexingStatusSnapshot,
  type Unvalidated,
  validateCrossChainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import type { UnixTimestamp } from "@ensnode/ponder-sdk";

export function buildCrossChainIndexingStatusSnapshotOmnichain(
  omnichainSnapshot: OmnichainIndexingStatusSnapshot,
  snapshotTime: UnixTimestamp,
): CrossChainIndexingStatusSnapshotOmnichain {
  return validateCrossChainIndexingStatusSnapshot({
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: omnichainSnapshot.omnichainIndexingCursor,
    snapshotTime,
    omnichainSnapshot,
  } satisfies Unvalidated<CrossChainIndexingStatusSnapshotOmnichain>);
}
