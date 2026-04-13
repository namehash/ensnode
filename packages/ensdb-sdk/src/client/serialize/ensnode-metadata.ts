import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import type {
  EnsNodeMetadata,
  EnsNodeMetadataEnsDbVersion,
  EnsNodeMetadataEnsIndexerIndexingStatus,
  EnsNodeMetadataEnsIndexerPublicConfig,
  EnsNodeMetadataKeys,
} from "../ensnode-metadata";

/**
 * Serialized representation of {@link EnsNodeMetadataEnsDbVersion}.
 */
export type SerializedEnsNodeMetadataEnsDbVersion = EnsNodeMetadataEnsDbVersion;

/**
 * Serialized representation of {@link EnsNodeMetadataEnsIndexerPublicConfig}.
 */
export interface SerializedEnsNodeMetadataEnsIndexerPublicConfig {
  key: typeof EnsNodeMetadataKeys.EnsIndexerPublicConfig;
  value: SerializedEnsIndexerPublicConfig;
}

/**
 * Serialized representation of {@link EnsNodeMetadataEnsIndexerIndexingStatus}.
 */
export interface SerializedEnsNodeMetadataEnsIndexerIndexingStatus {
  key: typeof EnsNodeMetadataKeys.EnsIndexerIndexingStatus;
  value: SerializedCrossChainIndexingStatusSnapshot;
}

/**
 * Serialized representation of {@link EnsNodeMetadata}
 */
export type SerializedEnsNodeMetadata =
  | SerializedEnsNodeMetadataEnsDbVersion
  | SerializedEnsNodeMetadataEnsIndexerPublicConfig
  | SerializedEnsNodeMetadataEnsIndexerIndexingStatus;
