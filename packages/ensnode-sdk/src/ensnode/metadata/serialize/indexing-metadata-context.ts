import {
  type SerializedCrossChainIndexingStatusSnapshot,
  serializeCrossChainIndexingStatusSnapshot,
} from "../../../indexing-status/serialize/cross-chain-indexing-status-snapshot";
import {
  type SerializedEnsIndexerStackInfo,
  serializeEnsIndexerStackInfo,
} from "../../../stack-info/serialize/ensindexer-stack-info";
import {
  type IndexingMetadataContext,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  type IndexingMetadataContextUninitialized,
} from "../indexing-metadata-context";

/**
 * Serialized representation of an {@link IndexingMetadataContextUninitialized}.
 */
export type SerializedIndexingMetadataContextUninitialized = IndexingMetadataContextUninitialized;

/**
 * Serialized representation of an {@link IndexingMetadataContextInitialized}.
 */
export interface SerializedIndexingMetadataContextInitialized
  extends Omit<IndexingMetadataContextInitialized, "indexingStatus" | "stackInfo"> {
  indexingStatus: SerializedCrossChainIndexingStatusSnapshot;
  stackInfo: SerializedEnsIndexerStackInfo;
}

/**
 * Serialized representation of an {@link IndexingMetadataContext}.
 *
 * Use the {@link SerializedIndexingMetadataContext.statusCode} field to
 * determine the specific type interpretation at runtime.
 */
export type SerializedIndexingMetadataContext =
  | SerializedIndexingMetadataContextUninitialized
  | SerializedIndexingMetadataContextInitialized;

export function serializeIndexingMetadataContextInitialized(
  context: IndexingMetadataContextInitialized,
): SerializedIndexingMetadataContextInitialized {
  const { statusCode, indexingStatus, stackInfo } = context;
  return {
    statusCode,
    indexingStatus: serializeCrossChainIndexingStatusSnapshot(indexingStatus),
    stackInfo: serializeEnsIndexerStackInfo(stackInfo),
  };
}

export function serializeIndexingMetadataContext(
  context: IndexingMetadataContextUninitialized,
): SerializedIndexingMetadataContextUninitialized;
export function serializeIndexingMetadataContext(
  context: IndexingMetadataContextInitialized,
): SerializedIndexingMetadataContextInitialized;
export function serializeIndexingMetadataContext(
  context: IndexingMetadataContext,
): SerializedIndexingMetadataContext {
  switch (context.statusCode) {
    case IndexingMetadataContextStatusCodes.Uninitialized:
      return context;
    case IndexingMetadataContextStatusCodes.Initialized:
      return serializeIndexingMetadataContextInitialized(context);
  }
}
