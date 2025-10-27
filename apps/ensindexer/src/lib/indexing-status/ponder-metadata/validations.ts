import { type ParsePayload, prettifyError } from "zod/v4/core";

import {
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotBackfill,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotCompleted,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotFollowing,
  checkChainIndexingStatusSnapshotsForOmnichainStatusSnapshotUnstarted,
  OmnichainIndexingStatusIds,
  type SerializedOmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import type { PrometheusMetrics } from "@ensnode/ponder-metadata";

import { PonderAppSettingsSchema } from "./zod-schemas";

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
