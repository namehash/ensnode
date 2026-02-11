import type { BlockRef, ChainId } from "../../shared/types";
import { ChainIndexingStatusIds } from "./chain-indexing-status-snapshot";
import type { CrossChainIndexingStatusSnapshot } from "./cross-chain-indexing-status-snapshot";

/**
 * Gets the latest indexed {@link BlockRef} for the given {@link ChainId}.
 *
 * @returns the latest indexed {@link BlockRef} for the given {@link ChainId}, or null if the chain
 *          isn't being indexed at all or is queued and therefore hasn't started indexing yet.
 */
export function getLatestIndexedBlockRef(
  indexingStatus: CrossChainIndexingStatusSnapshot,
  chainId: ChainId,
): BlockRef | null {
  const chainIndexingStatus = indexingStatus.omnichainSnapshot.chains.get(chainId);

  if (chainIndexingStatus === undefined) {
    // chain isn't being indexed at all
    return null;
  }

  if (chainIndexingStatus.chainStatus === ChainIndexingStatusIds.Queued) {
    // chain is queued, so no data for the chain has been indexed yet
    return null;
  }

  return chainIndexingStatus.latestIndexedBlock;
}
