/**
 * Drizzle database utilities for working with ENSDb.
 */
import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { parseIntoClientConfig } from "pg-connection-string";

/**
 * Helper type to extract the connection configuration for Drizzle from
 * the provided connection string.
 */
type DrizzleConnectionReadonlyConfig = ReturnType<typeof parseIntoClientConfig>;

/**
 * Build a Drizzle connection configuration with read-only settings,
 * based on the provided connection string.
 *
 * Updated drizzle connection ensures that any database interactions through
 * this connection are read-only, which is important for
 * the EnsNodeDbReader to prevent accidental mutations to the database.
 *
 * @param dbConnectionString - The connection string for the Postgres database.
 */
function buildDrizzleConnectionReadonly(
  dbConnectionString: string,
): DrizzleConnectionReadonlyConfig {
  const drizzleConnection = parseIntoClientConfig(dbConnectionString);
  const existingConnectionOptions = drizzleConnection.options || "";
  const readonlyConnectionOption = "-c default_transaction_read_only=on";

  const drizzleConnectionReadonly = {
    ...drizzleConnection,
    // Combine existing options from connection string with read-only requirement
    options: existingConnectionOptions
      ? `${existingConnectionOptions} ${readonlyConnectionOption}`
      : readonlyConnectionOption,
  };

  return drizzleConnectionReadonly;
}

/**
 * Base definition for Drizzle database schema
 *
 * Represents the structure of the database schema required by Drizzle ORM.
 */
type DrizzleDbSchemaDefinition = Record<string, unknown>;

/**
 * Drizzle database for `DbSchemaDefinition` in ENSDb.
 *
 * Allows interacting with `DbSchemaDefinition` in ENSDb, using Drizzle ORM.
 */
export type EnsDbDrizzle<DbSchemaDefinition extends DrizzleDbSchemaDefinition> =
  NodePgDatabase<DbSchemaDefinition>;

/**
 * Readonly Drizzle database for `DbSchemaDefinition` in ENSDb.
 *
 * Allows readonly interactions with `DbSchemaDefinition` in ENSDb, using Drizzle ORM.
 */
export type EnsDbDrizzleReadonly<DbSchemaDefinition extends DrizzleDbSchemaDefinition> = Omit<
  EnsDbDrizzle<DbSchemaDefinition>,
  "insert" | "update" | "delete" | "transaction"
>;

/**
 * Build a Drizzle database instance
 * @param connectionString - The connection string for the ENSDb.
 * @param dbSchemaDef - The database schema definition for the ENSDb.
 * @param logger - Optional Drizzle logger for query logging.
 * @returns A Drizzle database instance for the provided database schema definition.
 */
export function buildDrizzleDb<DbSchemaDefinition extends DrizzleDbSchemaDefinition>(
  connectionString: string,
  dbSchemaDef: DbSchemaDefinition,
  logger?: DrizzleLogger,
): EnsDbDrizzle<DbSchemaDefinition> {
  return drizzle({
    connection: connectionString,
    schema: dbSchemaDef,
    casing: "snake_case",
    logger,
  });
}

/**
 * Build a read-only Drizzle database instance
 * @param connectionString - The connection string for the ENSDb.
 * @param dbSchemaDef - The database schema definition for the ENSDb.
 * @param logger - Optional Drizzle logger for query logging.
 * @returns A read-only Drizzle database instance for the provided database schema definition.
 */
export function buildDrizzleDbReadonly<DbSchemaDefinition extends DrizzleDbSchemaDefinition>(
  connectionString: string,
  dbSchemaDef: DbSchemaDefinition,
  logger?: DrizzleLogger,
): EnsDbDrizzleReadonly<DbSchemaDefinition> {
  return drizzle({
    connection: buildDrizzleConnectionReadonly(connectionString),
    schema: dbSchemaDef,
    casing: "snake_case",
    logger,
  });
}
