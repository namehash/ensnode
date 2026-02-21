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
 * - `EnsNodeMetadataIndexingStatus`
 */
export const ensNodeMetadata = onchainTable("ensnode_metadata", (t) => ({
  /**
   * Key
   *
   * Allowed keys:
   * - `EnsNodeMetadataEnsDbVersion['key']`
   * - `EnsNodeMetadataEnsIndexerPublicConfig['key']`
   * - `EnsNodeMetadataIndexingStatus['key']`
   */
  key: t.text().primaryKey(),

  /**
   * Value
   *
   * Allowed values:
   * - `EnsNodeMetadataEnsDbVersion['value']`
   * - `EnsNodeMetadataEnsIndexerPublicConfig['value']`
   * - `EnsNodeMetadataIndexingStatus['value']`
   *
   * Guaranteed to be a JSON object.
   */
  value: t.jsonb().notNull(),
}));
