/**
 * ENSNode Schema
 *
 * Defines the database objects describing the ENSNode services state.
 */

import { primaryKey } from "drizzle-orm/pg-core";

import { ENSNODE_SCHEMA } from "./schema";

export { ENSNODE_SCHEMA_NAME } from "./schema";

/**
 * ENSNode Metadata
 *
 * Possible key value pairs are defined by 'EnsNodeMetadata' type:
 * - `EnsNodeMetadataEnsDbVersion`
 * - `EnsNodeMetadataEnsIndexerPublicConfig`
 * - `EnsNodeMetadataEnsIndexerIndexingStatus`
 */
export const ensNodeMetadata = ENSNODE_SCHEMA.table(
  "ensnode_metadata",
  (t) => ({
    /**
     * ENSIndexer Reference
     *
     * References the ENSIndexer instance by a unique ENSIndexer schema name
     * that a metadata record is associated with. This allows us to support
     * multiple ENSIndexer instances using the same database, while ensuring
     * that their metadata records do not conflict with each other.
     */
    ensIndexerRef: t.text().notNull(),

    /**
     * Key
     *
     * Allowed keys:
     * - `EnsNodeMetadataEnsDbVersion['key']`
     * - `EnsNodeMetadataEnsIndexerPublicConfig['key']`
     * - `EnsNodeMetadataEnsIndexerIndexingStatus['key']`
     */
    key: t.text().notNull(),

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
  }),
  (table) => [
    /**
     * Primary key constraint on 'ensIndexerRef' and 'key' columns,
     * to ensure that there is only one record for each key per ENSIndexer instance.
     */
    primaryKey({
      name: "ensnode_metadata_pkey",
      columns: [table.ensIndexerRef, table.key],
    }),
  ],
);
