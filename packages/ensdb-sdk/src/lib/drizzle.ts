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

// TODO: remove the `appliedNameForConcreteEnsIndexerSchema` variable and
// related logic when the `buildConcreteEnsIndexerSchema` function is
// refactored to avoid mutating the "abstract" ENSIndexer Schema definition.
/**
 * Applied name for the "concrete" ENSIndexer Schema.
 *
 * This is needed to prevent multiple calls to `buildConcreteEnsIndexerSchema` with different schema names,
 * which would mutate the same "abstract" ENSIndexer Schema and cause schema corruption.
 */
let appliedNameForConcreteEnsIndexerSchema: string | undefined;

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
  // TODO: Refactor this function to avoid mutating the "abstract" ENSIndexer Schema definition.
  // https://github.com/namehash/ensnode/issues/1830

  if (
    appliedNameForConcreteEnsIndexerSchema !== undefined &&
    appliedNameForConcreteEnsIndexerSchema !== ensIndexerSchemaName
  ) {
    throw new Error(
      `buildConcreteEnsIndexerSchema was already called with schema "${appliedNameForConcreteEnsIndexerSchema}". ` +
        `Calling it again with "${ensIndexerSchemaName}" would corrupt the previously built schema.`,
    );
  }
  appliedNameForConcreteEnsIndexerSchema = ensIndexerSchemaName;

  const concreteEnsIndexerSchema = abstractEnsIndexerSchema as ConcreteEnsIndexerSchema;

  for (const dbObject of Object.values(abstractEnsIndexerSchema)) {
    if (isTable(dbObject)) {
      // Update Drizzle table definition to reference
      // the specific `ensIndexerSchemaName` name of the ENSIndexer Schema.
      // @ts-expect-error - Drizzle types don't define `Table.Symbol.Schema` type,
      // but it's present at runtime.
      dbObject[Table.Symbol.Schema] = ensIndexerSchemaName;
    } else if (isPgEnum(dbObject)) {
      // Update Drizzle enum definition to reference
      // the specific `ensIndexerSchemaName` name of the ENSIndexer Schema.
      // @ts-expect-error - Drizzle types consider `schema` to be
      // a readonly property.
      dbObject.schema = ensIndexerSchemaName;
    }
  }

  return concreteEnsIndexerSchema;
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
