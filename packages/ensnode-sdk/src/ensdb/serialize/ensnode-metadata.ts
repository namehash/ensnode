import type { SerializedEnsIndexerPublicConfig } from "../../ensindexer/config";
import type { SerializedCrossChainIndexingStatusSnapshot } from "../../indexing-status/serialize/cross-chain-indexing-status-snapshot";
import {
  EnsNodeMetadata,
  type EnsNodeMetadataEnsDbVersion,
  type EnsNodeMetadataEnsIndexerIndexingStatus,
  type EnsNodeMetadataEnsIndexerPublicConfig,
  type EnsNodeMetadataKeys,
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
  key: typeof EnsNodeMetadataKeys.IndexingStatus;
  value: SerializedCrossChainIndexingStatusSnapshot;
}

/**
 * Serialized representation of {@link EnsNodeMetadata}
 */
export type SerializedEnsNodeMetadata =
  | SerializedEnsNodeMetadataEnsDbVersion
  | SerializedEnsNodeMetadataEnsIndexerPublicConfig
  | SerializedEnsNodeMetadataEnsIndexerIndexingStatus;
