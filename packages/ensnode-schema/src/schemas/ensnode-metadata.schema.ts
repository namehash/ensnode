/**
 * Schema Definitions that hold metadata about the ENSNode instance.
 */

import { pgSchema } from "drizzle-orm/pg-core";

export const offchainSchema = pgSchema("offchain");

/**
 * ENSNode Metadata
 *
 * Possible key value pairs are defined by 'EnsNodeMetadata' type:
 * - `EnsNodeMetadataEnsDbVersion`
 * - `EnsNodeMetadataEnsIndexerPublicConfig`
 * - `EnsNodeMetadataEnsIndexerIndexingStatus`
 */
export const ensNodeMetadata = offchainSchema.table("ensnode_metadata", (t) => ({
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
   * Guaranteed to be a serialized representation of JSON object.
   */
  value: t.jsonb().notNull(),
}));
