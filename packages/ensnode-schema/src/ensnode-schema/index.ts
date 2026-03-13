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
     * ENSIndexer Schema Name
     *
     * References the name of the ENSIndexer Schema that the metadata record
     * belongs to. This allows multi-tenancy where multiple ENSIndexer
     * instances can write to the same ENSNode Metadata table.
     */
    ensIndexerSchemaName: t.text().notNull(),

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
     * Primary key constraint on 'ensIndexerSchemaName' and 'key' columns,
     * to ensure that there is only one record for each key per ENSIndexer instance.
     */
    primaryKey({
      name: "ensnode_metadata_pkey",
      columns: [table.ensIndexerSchemaName, table.key],
    }),
  ],
);
