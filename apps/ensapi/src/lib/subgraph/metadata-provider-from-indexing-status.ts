import config from "@/config";
import type { IndexingStatusVariables } from "@/middleware/indexing-status.middleware";
import {
  ChainIndexingStatusIds,
  IndexingStatusResponseCodes,
  getENSRootChainId,
} from "@ensnode/ensnode-sdk";
import type { MetadataProvider } from "@ensnode/ponder-subgraph";
import { zeroHash } from "viem";

export function metadataProviderFromIndexingStatus(
  indexingStatus: IndexingStatusVariables["indexingStatus"],
): MetadataProvider {
  return {
    deployment: config.ensIndexerPublicConfig.versionInfo.ensIndexer,
    getLastIndexedENSRootChainBlock: async () => {
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
                    hash: zeroHash,
                    parentHash: zeroHash,
                    number: BigInt(rootChain.latestIndexedBlock.number),
                    timestamp: BigInt(rootChain.latestIndexedBlock.timestamp),
                  };
                }
              }
            }
          }
        }
      }
    },
    hasIndexingErrors: async () =>
      indexingStatus.isRejected ||
      indexingStatus.value.responseCode === IndexingStatusResponseCodes.Error,
  };
}
