import type { ParsePayload } from "zod/v4/core";

import {
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
  OmnichainIndexingStatusIds,
  type SerializedOmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";

/**
 * Invariant: SerializedOmnichainSnapshot Has Valid Chains
 *
 * Validates that the `chains` property of a {@link SerializedOmnichainIndexingStatusSnapshot}
 * is consistent with the reported `omnichainStatus`.
 */
export function invariant_serializedOmnichainSnapshotHasValidChains(
  ctx: ParsePayload<SerializedOmnichainIndexingStatusSnapshot>,
) {
  const omnichainSnapshot = ctx.value;
  const chains = Object.values(omnichainSnapshot.chains);
  let hasValidChains = false;

  switch (omnichainSnapshot.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted(chains);
      break;

    case OmnichainIndexingStatusIds.Backfill:
      hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill(chains);
      break;

    case OmnichainIndexingStatusIds.Completed:
      hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted(chains);
      break;

    case OmnichainIndexingStatusIds.Following:
      hasValidChains = checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing(chains);
      break;
  }

  if (!hasValidChains) {
    ctx.issues.push({
      code: "custom",
      input: omnichainSnapshot,
      message: `"chains" are not consistent with the reported '${omnichainSnapshot.omnichainStatus}' "omnichainStatus"`,
    });
  }
}
