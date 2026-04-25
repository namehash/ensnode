import type { IndexingMetadataContextInitialized } from "@ensnode/ensnode-sdk";

/**
 * Keys used to distinguish records in `ensnode_metadata` table in the ENSDb.
 */
export const EnsNodeMetadataKeys = {
  IndexingMetadataContext: "indexing_metadata_context",
} as const;

export type EnsNodeMetadataKey = (typeof EnsNodeMetadataKeys)[keyof typeof EnsNodeMetadataKeys];

/**
 * ENSNode Metadata record for Indexing Metadata Context
 *
 * This record is used to store the Indexing Metadata Context in
 * ENSNode Metadata table for each ENSIndexer instance.
 */
export interface EnsNodeMetadataIndexingMetadataContext {
  key: typeof EnsNodeMetadataKeys.IndexingMetadataContext;
  value: IndexingMetadataContextInitialized;
}

/**
 * ENSNode Metadata
 *
 * Union type gathering all variants of ENSNode Metadata.
 */
export type EnsNodeMetadata = EnsNodeMetadataIndexingMetadataContext;
