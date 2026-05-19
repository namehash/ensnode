import * as abstractEnsIndexerSchema from "../ensindexer-abstract";
import * as ensNodeSchema from "../ensnode";
import { getDrizzleSchemaChecksum } from "../lib/drizzle";

/**
 * ENSDb Config
 */
export interface EnsDbConfig {
  /**
   * PostgreSQL connection string for ENSDb.
   *
   * Guaranteed to be a valid PostgreSQL connection string with the format:
   * `postgresql://username:password@host:port/database` or
   * `postgres://username:password@host:port/database`
   */
  ensDbUrl: string;

  /**
   * The name of the ENSIndexer Schema in the ENSDb instance.
   *
   * Guaranteed to be a non-empty string that is
   * a valid Postgres database schema identifier
   */
  ensIndexerSchemaName: string;
}

/**
 * ENSDb Schema Checksum
 *
 * Checksum representing the ENSDb Schema definition, which is a combination of
 * - the ENSIndexer Schema definition, and
 * - the ENSNode Schema definition.
 *
 * This checksum can be used to verify compatibility between
 * the ENSDb Schema definition expected by any client app connecting to ENSDb
 * instance and the actual ENSDb Schema definition present in ENSDb SDK.
 */
export const ENSDB_SCHEMA_CHECKSUM = getDrizzleSchemaChecksum({
  ...abstractEnsIndexerSchema,
  ...ensNodeSchema,
});

export { ENSDB_CONNECTION_OPTIONS } from "../lib/drizzle";
