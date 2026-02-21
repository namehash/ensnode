import type { EnsIndexerPublicConfig } from "../ensindexer/config";
import type { CrossChainIndexingStatusSnapshot } from "../indexing-status/cross-chain-indexing-status-snapshot";

/**
 * Keys used to distinguish records in `ensnode_metadata` table in the ENSDb.
 */
export const EnsNodeMetadataKeys = {
  EnsDbVersion: "ensdb_version",
  EnsIndexerPublicConfig: "ensindexer_public_config",
  EnsIndexerIndexingStatus: "ensindexer_indexing_status",
} as const;

export type EnsNodeMetadataKey = (typeof EnsNodeMetadataKeys)[keyof typeof EnsNodeMetadataKeys];

export interface EnsNodeMetadataEnsDbVersion {
  key: typeof EnsNodeMetadataKeys.EnsDbVersion;
  value: string;
}

export interface EnsNodeMetadataEnsIndexerPublicConfig {
  key: typeof EnsNodeMetadataKeys.EnsIndexerPublicConfig;
  value: EnsIndexerPublicConfig;
}

export interface EnsNodeMetadataEnsIndexerIndexingStatus {
  key: typeof EnsNodeMetadataKeys.EnsIndexerIndexingStatus;
  value: CrossChainIndexingStatusSnapshot;
}

/**
 * ENSNode Metadata
 *
 * Union type gathering all variants of ENSNode Metadata.
 */
export type EnsNodeMetadata =
  | EnsNodeMetadataEnsDbVersion
  | EnsNodeMetadataEnsIndexerPublicConfig
  | EnsNodeMetadataEnsIndexerIndexingStatus;
