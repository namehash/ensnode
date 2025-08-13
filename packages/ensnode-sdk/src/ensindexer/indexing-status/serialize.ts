import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedENSIndexerOverallIndexingBackfillStatus,
  SerializedENSIndexerOverallIndexingCompletedStatus,
  SerializedENSIndexerOverallIndexingErrorStatus,
  SerializedENSIndexerOverallIndexingFollowingStatus,
  SerializedENSIndexerOverallIndexingStatus,
} from "./serialized-types";
import {
  ChainIndexingStatus,
  ChainIndexingStatusIds,
  ENSIndexerOverallIndexingStatus,
  OverallIndexingStatusIds,
} from "./types";

/**
 * Serialize a {@link ChainIndexingStatuses} object.
 */
export function serializeChainIndexingStatuses(
  chainIndexingStatuses: Map<ChainId, ChainIndexingStatus>,
): Record<ChainIdString, ChainIndexingStatus> {
  const serializedChainsIndexingStatuses: Record<ChainIdString, ChainIndexingStatus> = {};

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
