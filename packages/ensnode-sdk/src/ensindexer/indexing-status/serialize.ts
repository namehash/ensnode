import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedENSIndexerOverallIndexingBackfillStatus,
  SerializedENSIndexerOverallIndexingCompletedStatus,
  SerializedENSIndexerOverallIndexingErrorStatus,
  SerializedENSIndexerOverallIndexingFollowingStatus,
  SerializedENSIndexerOverallIndexingStatus,
} from "./serialized-types";
import {
  ChainIndexingCompletedStatus,
  ChainIndexingStatus,
  ChainIndexingStatusForBackfillOverallStatus,
  ENSIndexerOverallIndexingStatus,
  OverallIndexingStatusIds,
} from "./types";

/**
 * Serialize chain indexing statuses.
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
 * Serialize chain indexing statuses for the 'backfill' overall status.
 */
export function serializeChainIndexingStatusesForBackfillOverallStatus(
  chainIndexingStatuses: Map<ChainId, ChainIndexingStatusForBackfillOverallStatus>,
): Record<ChainIdString, ChainIndexingStatusForBackfillOverallStatus> {
  const serializedChainsIndexingStatuses: Record<
    ChainIdString,
    ChainIndexingStatusForBackfillOverallStatus
  > = {};

  for (const [chainId, chainIndexingStatus] of chainIndexingStatuses.entries()) {
    serializedChainsIndexingStatuses[serializeChainId(chainId)] = chainIndexingStatus;
  }

  return serializedChainsIndexingStatuses;
}

/**
 * Serialize chain indexing statuses for the 'completed' overall status.
 */
export function serializeChainIndexingStatusesForCompletedOverallStatus(
  chainIndexingStatuses: Map<ChainId, ChainIndexingCompletedStatus>,
): Record<ChainIdString, ChainIndexingCompletedStatus> {
  const serializedChainsIndexingStatuses: Record<ChainIdString, ChainIndexingCompletedStatus> = {};

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
        chains: serializeChainIndexingStatusesForBackfillOverallStatus(indexingStatus.chains),
      } satisfies SerializedENSIndexerOverallIndexingBackfillStatus;

    case OverallIndexingStatusIds.Completed: {
      return {
        overallStatus: OverallIndexingStatusIds.Completed,
        chains: serializeChainIndexingStatusesForCompletedOverallStatus(indexingStatus.chains),
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
