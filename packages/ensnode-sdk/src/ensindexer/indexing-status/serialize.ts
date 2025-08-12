import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedENSIndexerOverallIndexingStatus,
  SerializedENSIndexerOverallIndexingStatusBackfill,
  SerializedENSIndexerOverallIndexingStatusCompleted,
  SerializedENSIndexerOverallIndexingStatusError,
  SerializedENSIndexerOverallIndexingStatusFollowing,
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
      } satisfies SerializedENSIndexerOverallIndexingStatusError;

    case OverallIndexingStatusIds.Backfill:
      return {
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
        overallStatus: OverallIndexingStatusIds.Backfill,
      } satisfies SerializedENSIndexerOverallIndexingStatusBackfill;

    case OverallIndexingStatusIds.Completed: {
      return {
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
        overallStatus: OverallIndexingStatusIds.Completed,
      } satisfies SerializedENSIndexerOverallIndexingStatusCompleted;
    }

    case OverallIndexingStatusIds.Following:
      return {
        maxApproximateRealtimeDistance: indexingStatus.maxApproximateRealtimeDistance,
        chains: serializeChainIndexingStatuses(indexingStatus.chains),
        overallStatus: OverallIndexingStatusIds.Following,
      } satisfies SerializedENSIndexerOverallIndexingStatusFollowing;
  }
}
