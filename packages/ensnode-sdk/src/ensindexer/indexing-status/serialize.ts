import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import {
  SerializedENSIndexerIndexingStatus,
  SerializedENSIndexerIndexingStatusError,
} from "./serialized-types";
import {
  ChainIndexingStatus,
  ChainIndexingStatusIds,
  type ENSIndexerIndexingStatus,
  ENSIndexerIndexingStatusError,
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
  indexingStatus: ENSIndexerIndexingStatus,
): SerializedENSIndexerIndexingStatus;
export function serializeENSIndexerIndexingStatus(
  indexingStatus: ENSIndexerIndexingStatusError,
): SerializedENSIndexerIndexingStatusError;
export function serializeENSIndexerIndexingStatus(
  indexingStatus: ENSIndexerIndexingStatus | ENSIndexerIndexingStatusError,
): SerializedENSIndexerIndexingStatus | SerializedENSIndexerIndexingStatusError {
  if (indexingStatus.overallStatus === ChainIndexingStatusIds.IndexerError) {
    return {
      overallStatus: indexingStatus.overallStatus,
    } satisfies SerializedENSIndexerIndexingStatusError;
  }

  return {
    approximateRealtimeDistance: indexingStatus.approximateRealtimeDistance,
    chains: serializeChainIndexingStatuses(indexingStatus.chains),
    overallStatus: indexingStatus.overallStatus,
  } satisfies SerializedENSIndexerIndexingStatus;
}
