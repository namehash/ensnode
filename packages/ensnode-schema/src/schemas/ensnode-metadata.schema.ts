/**
 * Schema Definitions that hold metadata about the ENSNode instance.
 */

import { onchainTable } from "ponder";

/**
 * ENSNode Metadata
 *
 * Possible key value pairs are defined by 'EnsNodeMetadata' type:
 * - `EnsNodeMetadataEnsDbVersion`
 * - `EnsNodeMetadataEnsIndexerPublicConfig`
 * - `EnsNodeMetadataEnsIndexerIndexingStatus`
 */
export const ensNodeMetadata = onchainTable("ensnode_metadata", (t) => ({
  /**
   * Key
   *
   * Allowed keys:
   * - `EnsNodeMetadataEnsDbVersion['key']`
   * - `EnsNodeMetadataEnsIndexerPublicConfig['key']`
   * - `EnsNodeMetadataEnsIndexerIndexingStatus['key']`
   */
  key: t.text().primaryKey(),

  /**
   * Value
   *
   * Allowed values:
   * - `EnsNodeMetadataEnsDbVersion['value']`
   * - `EnsNodeMetadataEnsIndexerPublicConfig['value']`
   * - `EnsNodeMetadataEnsIndexerIndexingStatus['value']`
   *
   * Guaranteed to be a JSON object.
   */
  value: t.jsonb().notNull(),
}));
