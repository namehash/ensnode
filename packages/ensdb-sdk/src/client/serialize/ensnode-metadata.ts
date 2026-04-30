import type { SerializedIndexingMetadataContextInitialized } from "@ensnode/ensnode-sdk";

import type { EnsNodeMetadata, EnsNodeMetadataKeys } from "../ensnode-metadata";

export interface SerializedEnsNodeMetadataIndexingMetadataContext {
  key: typeof EnsNodeMetadataKeys.IndexingMetadataContext;
  value: SerializedIndexingMetadataContextInitialized;
}

/**
 * Serialized representation of {@link EnsNodeMetadata}
 */
export type SerializedEnsNodeMetadata = SerializedEnsNodeMetadataIndexingMetadataContext;
