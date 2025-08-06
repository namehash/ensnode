import { ChainId, ChainIdString, serializeChainId } from "../../shared";
import { SerializedENSIndexerIndexingStatus } from "./serialized-types";
import { ChainIndexingStatus, type ENSIndexerIndexingStatus } from "./types";

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
): SerializedENSIndexerIndexingStatus {
  return {
    chains: serializeChainIndexingStatuses(indexingStatus.chains),
  } satisfies SerializedENSIndexerIndexingStatus;
}
