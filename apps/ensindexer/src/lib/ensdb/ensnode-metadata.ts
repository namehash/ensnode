import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Keys used to distinguish records in `ensnode_metadata` table in the ENSDb.
 */
export const EnsNodeMetadataKeys = {
  EnsIndexerPublicConfig: "ensindexer-public-config",
  IndexingStatus: "indexing-status",
} as const;

export type EnsNodeMetadataKey = (typeof EnsNodeMetadataKeys)[keyof typeof EnsNodeMetadataKeys];

export interface EnsNodeMetadataEnsIndexerPublicConfig {
  key: typeof EnsNodeMetadataKeys.EnsIndexerPublicConfig;
  value: SerializedENSIndexerPublicConfig;
}

export interface EnsNodeMetadataIndexingStatus {
  key: typeof EnsNodeMetadataKeys.IndexingStatus;
  value: SerializedCrossChainIndexingStatusSnapshot;
}

/**
 * ENSNode Metadata
 *
 * Union type gathering all variants of ENSNode Metadata.
 */
export type EnsNodeMetadata = EnsNodeMetadataEnsIndexerPublicConfig | EnsNodeMetadataIndexingStatus;
