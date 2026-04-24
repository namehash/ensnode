import type { CrossChainIndexingStatusSnapshot } from "../../indexing-status";
import type { EnsNodeStackInfo } from "../../stack-info";
import { validateIndexingMetadataContextInitialized } from "./validate/indexing-metadata-context";

/**
 * A status code for an indexing metadata context
 */
export const IndexingMetadataContextStatusCodes = {
  /**
   * Represents that the no indexing metadata context has been initialized
   * for the ENSIndexer Schema Name in the ENSNode Metadata table in ENSDb.
   */
  Uninitialized: "Uninitialized",

  /**
   * Represents that the indexing metadata context has been initialized
   * for the ENSIndexer Schema Name in the ENSNode Metadata table in ENSDb.
   */
  Initialized: "Initialized",
} as const;

/**
 * The derived string union of possible {@link IndexingMetadataContextStatusCodes}.
 */
export type IndexingMetadataContextStatusCode =
  (typeof IndexingMetadataContextStatusCodes)[keyof typeof IndexingMetadataContextStatusCodes];

export interface IndexingMetadataContextUninitialized {
  statusCode: typeof IndexingMetadataContextStatusCodes.Uninitialized;
}

export interface IndexingMetadataContextInitialized {
  statusCode: typeof IndexingMetadataContextStatusCodes.Initialized;
  indexingStatus: CrossChainIndexingStatusSnapshot;
  stackInfo: EnsNodeStackInfo;
}

/**
 * Indexing Metadata Context
 *
 * Use the {@link IndexingMetadataContext.statusCode} field to determine
 * the specific type interpretation at runtime.
 */
export type IndexingMetadataContext =
  | IndexingMetadataContextUninitialized
  | IndexingMetadataContextInitialized;

/**
 * Build an {@link IndexingMetadataContextUninitialized} object.
 */
export function buildIndexingMetadataContextUninitialized(): IndexingMetadataContextUninitialized {
  return {
    statusCode: IndexingMetadataContextStatusCodes.Uninitialized,
  };
}

/**
 * Build an {@link IndexingMetadataContextInitialized} object.
 *
 * @throws Error if the provided parameters do not satisfy the validation
 *         criteria for an {@link IndexingMetadataContextInitialized} object.
 */
export function buildIndexingMetadataContextInitialized(
  indexingStatus: CrossChainIndexingStatusSnapshot,
  stackInfo: EnsNodeStackInfo,
): IndexingMetadataContextInitialized {
  return validateIndexingMetadataContextInitialized({
    statusCode: IndexingMetadataContextStatusCodes.Initialized,
    indexingStatus,
    stackInfo,
  });
}
