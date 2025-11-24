import config from "@/config";

import { ChainIndexingStatusIds, getENSRootChainId } from "@ensnode/ensnode-sdk";
import type { SubgraphMeta } from "@ensnode/ponder-subgraph";

import type { IndexingStatusMiddlewareContext } from "@/middleware/indexing-status.middleware";

/**
 * Converts ENSIndexer indexing status to GraphQL subgraph metadata format.
 *
 * Transforms the indexing context from the indexing status middleware into
 * the `_meta` format expected by legacy subgraph GraphQL APIs.
 * Returns null if the indexing context indicates an error state or
 * indexing status for the ENS root chain is not available.
 *
 * @param indexingStatus - The indexing context from the indexing status middleware
 * @returns SubgraphMeta object or null if conversion is not possible
 */
export function indexingContextToSubgraphMeta(
  indexingStatus: IndexingStatusMiddlewareContext["indexingStatus"],
): SubgraphMeta {
  if (indexingStatus.isRejected) {
    // indexing status middleware has never successfully fetched (and cached) an indexing status snapshot
    // for the lifetime of this service instance.
    return null;
  }

  const rootChain = indexingStatus.value.snapshot.omnichainSnapshot.chains.get(
    getENSRootChainId(config.namespace),
  );
  if (!rootChain) return null;

  switch (rootChain.chainStatus) {
    case ChainIndexingStatusIds.Queued: {
      return null;
    }
    case ChainIndexingStatusIds.Completed:
    case ChainIndexingStatusIds.Backfill:
    case ChainIndexingStatusIds.Following: {
      return {
        deployment: config.ensIndexerPublicConfig.versionInfo.ensIndexer,
        hasIndexingErrors: false,
        block: {
          hash: null,
          parentHash: null,
          number: rootChain.latestIndexedBlock.number,
          timestamp: rootChain.latestIndexedBlock.timestamp,
        },
      };
    }
  }
}
