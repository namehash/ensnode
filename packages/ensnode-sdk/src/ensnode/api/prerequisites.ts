import { type OmnichainIndexingStatusId, OmnichainIndexingStatusIds } from "../../indexing-status";
import type { PrerequisiteResult } from "../../shared/prerequisites";

/**
 * Check if provided OmnichainIndexingStatusId indicates that the backfill is complete.
 *
 * This is a prerequisite for all APIs that rely on indexed data. We need to ensure that
 * the backfill is complete to guarantee that the necessary data is completely indexed
 * and available for queries.
 */
export function hasBackfillCompleted(
  indexingStatus: OmnichainIndexingStatusId,
): PrerequisiteResult {
  const supported =
    indexingStatus === OmnichainIndexingStatusIds.Completed ||
    indexingStatus === OmnichainIndexingStatusIds.Following;

  if (supported) return { supported };

  return {
    supported: false,
    reason: `The connected ENSNode's Indexing Status must be "${OmnichainIndexingStatusIds.Completed}" or "${OmnichainIndexingStatusIds.Following}". Currently, it is "${indexingStatus}".`,
  };
}
