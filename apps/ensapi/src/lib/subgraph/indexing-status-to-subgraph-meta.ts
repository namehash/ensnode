import config from "@/config";

import { ChainIndexingStatusIds, getENSRootChainId } from "@ensnode/ensnode-sdk";
import type { SubgraphMeta } from "@ensnode/ponder-subgraph";

import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";

/**
 * Converts ENSIndexer indexing status to GraphQL subgraph metadata format.
 *
 * Transforms the cached indexing status response from ENSIndexer into
 * the `_meta` format expected by legacy subgraph GraphQL APIs.
 * Returns null if the indexing status indicates an error state or
 * the root chain is not available.
 *
 * @param cachedIndexingStatus - The cached indexing status result from ENSIndexer
 * @returns SubgraphMeta object or null if conversion is not possible
 */
export function indexingStatusToSubgraphMeta(
  cachedIndexingStatus: IndexingStatusVariables["indexingStatus"],
): SubgraphMeta {
  // return null if indexing status has never been cached successfully
  if (cachedIndexingStatus.isRejected) {
    return null;
  }

  const rootChain =
    cachedIndexingStatus.value.realtimeProjection.snapshot.omnichainSnapshot.chains.get(
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
