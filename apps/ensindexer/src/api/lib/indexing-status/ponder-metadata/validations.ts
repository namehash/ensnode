import { PonderAppSettingsSchema } from "@/api/lib/indexing-status/ponder-metadata/zod-schemas";
import {
  OmnichainIndexingStatusIds,
  SerializedOmnichainIndexingStatusSnapshot,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
} from "@ensnode/ensnode-sdk";
import { PrometheusMetrics } from "@ensnode/ponder-metadata";
import { ParsePayload, prettifyError } from "zod/v4/core";

/**
 * Validate Ponder Metrics
 *
 * @param metrics - Prometheus Metrics from Ponder
 *
 * @throws Will throw if the Ponder metrics are not valid.
 */
export function validatePonderMetrics(metrics: PrometheusMetrics) {
  // Invariant: Ponder command & ordering are as expected
  const parsedAppSettings = PonderAppSettingsSchema.safeParse({
    command: metrics.getLabel("ponder_settings_info", "command"),
    ordering: metrics.getLabel("ponder_settings_info", "ordering"),
  });

  if (parsedAppSettings.error) {
    throw new Error(
      "Failed to build IndexingStatus object: \n" + prettifyError(parsedAppSettings.error) + "\n",
    );
  }
}

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
