/**
 * Utilities for Drizzle ORM integration with ENSDb.
 */
import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { isPgEnum } from "drizzle-orm/pg-core";
import { isTable, Table } from "drizzle-orm/table";

// Import the "abstract" ENSIndexer Schema.
// It's called "abstract" here because tables defined in this schema do not
// reference the specific ENSIndexer Schema name, and therefore cannot be used
// directly to build a Drizzle client for ENSDb.
import * as abstractEnsIndexerSchema from "../ensindexer-abstract";
import * as ensNodeSchema from "../ensnode";

/**
 * Abstract ENSIndexer Schema
 *
 * Represents the "abstract" ENSIndexer Schema definition, where tables do not reference
 * the specific ENSIndexer Schema name.
 */
export type AbstractEnsIndexerSchema = typeof abstractEnsIndexerSchema;

/**
 * Clone a Drizzle Table object with a new schema name.
 *
 * Drizzle tables store their identity (name, columns, schema) on
 * Symbol-keyed properties. Cloning a table requires creating
 * a new object with the same prototype, copying all properties,
 * and updating the schema name.
 */
function cloneTableWithSchema<TableType extends Table>(
  table: TableType,
  schemaName: string,
): TableType {
  const clone = Object.create(
    Object.getPrototypeOf(table),
    Object.getOwnPropertyDescriptors(table),
  ) as TableType;

  // @ts-expect-error - Drizzle's Table type for the schema symbol is
  // not typed in a way that allows us to set it directly,
  // but we know it exists and can be set.
  clone[Table.Symbol.Schema] = schemaName;

  // Fail-fast if the clone lost the Drizzle sentinel.
  if (!isTable(clone)) {
    throw new Error(`Cloned table is no longer a valid Drizzle Table (schema: ${schemaName}).`);
  }

  return clone;
}

/**
 * Build a "concrete" ENSIndexer Schema definition for ENSDb.
 *
 * This function uses the "abstract" ENSIndexer Schema definition
 * to create a "concrete" ENSIndexer Schema definition referencing the provided
 * ENSIndexer Schema name. The "concrete" ENSIndexer Schema definition can then
 * be used to build the ENSDb Schema for a Drizzle client for ENSDb.
 *
 * @param ensIndexerSchemaName - The name of the ENSIndexer Schema instance in ENSDb.
 *
 * Note: this function is a replacement for `setDatabaseSchema` from `@ponder/client`.
 */
function buildConcreteEnsIndexerSchema<ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema>(
  ensIndexerSchemaName: string,
): ConcreteEnsIndexerSchema {
  const ensIndexerSchema = {} as ConcreteEnsIndexerSchema;

  for (const [key, abstractSchemaObject] of Object.entries(abstractEnsIndexerSchema)) {
    if (isTable(abstractSchemaObject)) {
      (ensIndexerSchema as any)[key] = cloneTableWithSchema(
        abstractSchemaObject,
        ensIndexerSchemaName,
      );
    } else if (isPgEnum(abstractSchemaObject)) {
      // Enums are functions; clone by copying properties onto a new function.
      // Unlike tables, enums don't rely on prototype identity, so
      // Object.assign is sufficient here.
      const concreteSchemaObject = Object.assign(
        (...args: any[]) => abstractSchemaObject(...args),
        abstractSchemaObject,
      );
      // @ts-expect-error - Drizzle's PgEnum type for the schema symbol is
      // typed as readonly, but we need to set it here so
      // the output schema definition has the correct schema for
      // all table and enum objects.
      concreteSchemaObject.schema = ensIndexerSchemaName;
      (ensIndexerSchema as any)[key] = concreteSchemaObject;
    } else {
      (ensIndexerSchema as any)[key] = abstractSchemaObject;
    }
  }

  return ensIndexerSchema;
}

/**
 * ENSNode Schema
 *
 * Represents the ENSNode Schema definition for ENSDb.
 */
export type EnsNodeSchema = typeof ensNodeSchema;

/**
 * Build individual ENSDb Schemas
 *
 * @param ensIndexerSchemaName - The name of the ENSIndexer Schema instance in ENSDb.
 * @returns An object containing the "concrete" ENSIndexer Schema and the ENSNode Schema.
 */
export function buildIndividualEnsDbSchemas<
  ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema,
>(
  ensIndexerSchemaName: string,
): {
  concreteEnsIndexerSchema: ConcreteEnsIndexerSchema;
  ensNodeSchema: EnsNodeSchema;
} {
  return {
    concreteEnsIndexerSchema: buildConcreteEnsIndexerSchema(ensIndexerSchemaName),
    ensNodeSchema,
  };
}

/**
 * ENSDb Schema type
 *
 * Represents the combined database schema for ENSDb,
 * including both the "concrete" ENSIndexer Schema and the ENSNode Schema.
 */
type EnsDbSchema<ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema> =
  ConcreteEnsIndexerSchema & EnsNodeSchema;

/**
 * Build ENSDb Schema for Drizzle client
 *
 * Uses the provided "concrete" ENSIndexer Schema definition to build
 * the ENSDb Schema.
 *
 * @param concreteEnsIndexerSchema - The "concrete" ENSIndexer Schema definition.
 * @returns The ENSDb Schema definition for use in building
 *          a Drizzle client for ENSDb.
 */
function buildEnsDbSchema<ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema>(
  concreteEnsIndexerSchema: ConcreteEnsIndexerSchema,
): EnsDbSchema<ConcreteEnsIndexerSchema> {
  return {
    ...concreteEnsIndexerSchema,
    ...ensNodeSchema,
  };
}

/**
 * Drizzle client type for ENSDb.
 *
 * The `ConcreteEnsIndexerSchema` type parameter allows for typing
 * the Drizzle client with a "concrete" ENSIndexer Schema definition
 * where tables reference the specific ENSIndexer Schema name.
 */
export type EnsDbDrizzleClient<ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema> =
  NodePgDatabase<EnsDbSchema<ConcreteEnsIndexerSchema>>;

/**
 * Build a Drizzle client for ENSDb.
 *
 * @param connectionString - The connection string for the ENSDb.
 * @param concreteEnsIndexerSchema - The "concrete" ENSIndexer Schema definition for the Drizzle client.
 * @param logger - Optional Drizzle logger for query logging.
 * @returns A Drizzle client for ENSDb.
 */
export function buildEnsDbDrizzleClient<ConcreteEnsIndexerSchema extends AbstractEnsIndexerSchema>(
  connectionString: string,
  concreteEnsIndexerSchema: ConcreteEnsIndexerSchema,
  logger?: DrizzleLogger,
): EnsDbDrizzleClient<ConcreteEnsIndexerSchema> {
  const ensDbSchema = buildEnsDbSchema<ConcreteEnsIndexerSchema>(concreteEnsIndexerSchema);

  return drizzle({
    connection: connectionString,
    schema: ensDbSchema,
    casing: "snake_case",
    logger,
  });
}
