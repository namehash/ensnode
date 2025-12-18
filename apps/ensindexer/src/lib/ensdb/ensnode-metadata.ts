import type {
  CrossChainIndexingStatusSnapshot,
  ENSIndexerPublicConfig,
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
  value: ENSIndexerPublicConfig;
}

/**
 * Serialized representation of {@link EnsNodeMetadataEnsIndexerPublicConfig}.
 */
export interface SerializedEnsNodeMetadataEnsIndexerPublicConfig {
  key: typeof EnsNodeMetadataKeys.EnsIndexerPublicConfig;
  value: SerializedENSIndexerPublicConfig;
}

export interface EnsNodeMetadataIndexingStatus {
  key: typeof EnsNodeMetadataKeys.IndexingStatus;
  value: CrossChainIndexingStatusSnapshot;
}

/**
 * Serialized representation of {@link EnsNodeMetadataIndexingStatus}.
 */
export interface SerializedEnsNodeMetadataIndexingStatus {
  key: typeof EnsNodeMetadataKeys.IndexingStatus;
  value: SerializedCrossChainIndexingStatusSnapshot;
}

/**
 * ENSNode Metadata
 *
 * Union type gathering all variants of ENSNode Metadata.
 */
export type EnsNodeMetadata = EnsNodeMetadataEnsIndexerPublicConfig | EnsNodeMetadataIndexingStatus;

/**
 * Serialized representation of {@link EnsNodeMetadata}
 */
export type SerializedEnsNodeMetadata =
  | SerializedEnsNodeMetadataEnsIndexerPublicConfig
  | SerializedEnsNodeMetadataIndexingStatus;
