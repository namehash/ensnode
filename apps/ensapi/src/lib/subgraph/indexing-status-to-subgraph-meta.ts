import config from "@/config";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import {
  ChainIndexingStatusIds,
  IndexingStatusResponseCodes,
  getENSRootChainId,
} from "@ensnode/ensnode-sdk";
import type { SubgraphMeta } from "@ensnode/ponder-subgraph";

export function indexingStatusToSubgraphMeta(
  indexingStatus: IndexingStatusVariables["indexingStatus"],
): SubgraphMeta {
  switch (indexingStatus.status) {
    case "rejected": {
      return null;
    }
    case "fulfilled": {
      switch (indexingStatus.value.responseCode) {
        case IndexingStatusResponseCodes.Error: {
          return null;
        }
        case IndexingStatusResponseCodes.Ok: {
          const rootChain =
            indexingStatus.value.realtimeProjection.snapshot.omnichainSnapshot.chains.get(
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
      }
    }
  }
}
