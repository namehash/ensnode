import { isTable, Table } from "drizzle-orm";
import { isPgEnum } from "drizzle-orm/pg-core";

import * as ensIndexerSchema from "../ensindexer-schema";
import { buildDrizzleDbReadonly, type EnsDbDrizzleReadonly } from "../lib/drizzle";

/**
 * ENSIndexer Database Reader
 *
 * Provides readonly access to ENSIndexer Schema in ENSDb.
 */
export class EnsIndexerDbReader {
  /**
   * Readonly Drizzle database instance for ENSIndexer Schema in ENSDb.
   */
  private ensIndexerDbReadonly: EnsDbDrizzleReadonly<typeof ensIndexerSchema>;

  /**
   * @param ensDbConnectionString connection string for ENSDb Postgres database
   */
  constructor(ensDbConnectionString: string, ensIndexerSchemaName: string) {
    const boundSchemaDef = EnsIndexerDbReader.bindDbSchemaDefWithDbSchemaName(ensIndexerSchemaName);
    this.ensIndexerDbReadonly = buildDrizzleDbReadonly(ensDbConnectionString, boundSchemaDef);
  }

  /**
   * Bind a database schema definition with a specific database schema name.
   * This is necessary to ensure that all tables and enums in the schema
   * definition are associated with the correct database schema in ENSDb.
   *
   * @param dbSchemaDef - The database schema definition to bind.
   * @param dbSchemaName - The schema name to bind to the database schema definition.
   * @returns The database schema definition with the bound schema name.
   *
   * Note: this function is a replacement for `setDatabaseSchema` from `@ponder/client`.
   */
  static bindDbSchemaDefWithDbSchemaName(dbSchemaName: string): typeof ensIndexerSchema {
    const resultDbSchemaDef = structuredClone(ensIndexerSchema);

    for (const dbObjectDef of Object.values(resultDbSchemaDef)) {
      if (isTable(dbObjectDef)) {
        // @ts-expect-error - Drizzle's Table type for the schema symbol is
        // not typed in a way that allows us to set it directly,
        // but we know it exists and can be set.
        dbObjectDef[Table.Symbol.Schema] = dbSchemaName;
      } else if (isPgEnum(dbObjectDef)) {
        // @ts-expect-error - Drizzle's PgEnum type for the schema symbol is
        // typed as readonly, but we need to set it here so
        // the output schema definition has the correct schema for
        // all table and enum objects.
        dbObjectDef.schema = dbSchemaName;
      }
    }

    return resultDbSchemaDef;
  }

  /**
   * Getter for the readonly Drizzle database instance for ENSIndexer Schema in ENSDb.
   *
   * Useful while working on complex queries directly with the ENSIndexer schema in ENSDb.
   */
  get db(): EnsDbDrizzleReadonly<typeof ensIndexerSchema> {
    return this.ensIndexerDbReadonly;
  }
}
