import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedENSIndexerOverallIndexingBackfillStatus,
  SerializedENSIndexerOverallIndexingCompletedStatus,
  SerializedENSIndexerOverallIndexingErrorStatus,
  SerializedENSIndexerOverallIndexingFollowingStatus,
  SerializedENSIndexerOverallIndexingStatus,
  SerializedENSIndexerOverallIndexingUnstartedStatus,
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

    case OverallIndexingStatusIds.Unstarted:
      return {
        overallStatus: OverallIndexingStatusIds.Unstarted,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
      } satisfies SerializedENSIndexerOverallIndexingUnstartedStatus;

    case OverallIndexingStatusIds.Backfill:
      return {
        overallStatus: OverallIndexingStatusIds.Backfill,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
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
        overallApproxRealtimeDistance: indexingStatus.overallApproxRealtimeDistance,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
      } satisfies SerializedENSIndexerOverallIndexingFollowingStatus;
  }
}
