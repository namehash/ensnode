import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedENSIndexerOverallIndexingBackfillStatus,
  SerializedENSIndexerOverallIndexingCompletedStatus,
  SerializedENSIndexerOverallIndexingErrorStatus,
  SerializedENSIndexerOverallIndexingFollowingStatus,
  SerializedENSIndexerOverallIndexingQueuedStatus,
  SerializedENSIndexerOverallIndexingStatus,
} from "./serialized-types";
import {
  ChainIndexingStatus,
  ENSIndexerOverallIndexingStatus,
  OverallIndexingStatusIds,
} from "./types";

/**
 * Serialize chain indexing statuses.
 */
export function serializeChainIndexingStatuses<ChainIndexingStatusType extends ChainIndexingStatus>(
  chainIndexingStatuses: Map<ChainId, ChainIndexingStatusType>,
): Record<ChainIdString, ChainIndexingStatusType> {
  const serializedChainsIndexingStatuses: Record<ChainIdString, ChainIndexingStatusType> = {};

  for (const [chainId, chainIndexingStatus] of chainIndexingStatuses.entries()) {
    serializedChainsIndexingStatuses[serializeChainId(chainId)] = chainIndexingStatus;
  }

  return serializedChainsIndexingStatuses;
}

/**
 * Serialize a {@link ENSIndexerIndexingStatus} object.
 */
export function serializeENSIndexerIndexingStatus(
  indexingStatus: ENSIndexerOverallIndexingStatus,
): SerializedENSIndexerOverallIndexingStatus {
  switch (indexingStatus.overallStatus) {
    case OverallIndexingStatusIds.IndexerError:
      return {
        overallStatus: OverallIndexingStatusIds.IndexerError,
      } satisfies SerializedENSIndexerOverallIndexingErrorStatus;

    case OverallIndexingStatusIds.Queued:
      return {
        overallStatus: OverallIndexingStatusIds.Queued,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
      } satisfies SerializedENSIndexerOverallIndexingQueuedStatus;

    case OverallIndexingStatusIds.Backfill:
      return {
        overallStatus: OverallIndexingStatusIds.Backfill,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
      } satisfies SerializedENSIndexerOverallIndexingBackfillStatus;

    case OverallIndexingStatusIds.Completed: {
      return {
        overallStatus: OverallIndexingStatusIds.Completed,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
      } satisfies SerializedENSIndexerOverallIndexingCompletedStatus;
    }

    case OverallIndexingStatusIds.Following:
      return {
        overallStatus: OverallIndexingStatusIds.Following,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
        overallApproxRealtimeDistance: indexingStatus.overallApproxRealtimeDistance,
        omnichainIndexingCursor: indexingStatus.omnichainIndexingCursor,
      } satisfies SerializedENSIndexerOverallIndexingFollowingStatus;
  }
}
