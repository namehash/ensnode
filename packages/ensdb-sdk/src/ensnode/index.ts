import { pgSchema, primaryKey } from "drizzle-orm/pg-core";

/**
 * ENSNode Schema Name
 *
 * The name of the ENSNode schema in an ENSDb.
 */
const ENSNODE_SCHEMA_NAME = "ensnode";

/**
 * ENSNode Schema
 *
 * Defines database objects within the ENSNode Schema in ENSDb.
 */
const ENSNODE_SCHEMA = pgSchema(ENSNODE_SCHEMA_NAME);

/**
 * ENSNode Metadata
 *
 * Possible key value pairs are defined by 'EnsNodeMetadata' type:
 * - `EnsNodeMetadataEnsDbVersion`
 * - `EnsNodeMetadataEnsIndexerPublicConfig`
 * - `EnsNodeMetadataEnsIndexerIndexingStatus`
 */
export const metadata = ENSNODE_SCHEMA.table(
  "metadata",
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
      name: "metadata_pkey",
      columns: [table.ensIndexerSchemaName, table.key],
    }),
  ],
);
