import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm/sql";

import {
  type IndexingMetadataContextInitialized,
  serializeIndexingMetadataContext,
} from "@ensnode/ensnode-sdk";

import { advisoryLockId } from "../lib/advisory-lock-id";
import { EnsDbReader } from "./ensdb-reader";
import { EnsNodeMetadataKeys } from "./ensnode-metadata";
import type { SerializedEnsNodeMetadata } from "./serialize/ensnode-metadata";

/**
 * ENSDb Writer
 *
 * Allows updating an ENSDb instance, including:
 * - executing database migrations for ENSNode Schema,
 * - updating ENSNode Metadata records in ENSDb for the given ENSIndexer instance.
 */
export class EnsDbWriter extends EnsDbReader {
  /**
   * Stable arbitrary lock ID for ENSNode Schema migrations to
   * prevent concurrent migration execution across multiple ENSIndexer instances.
   */
  private static readonly MIGRATION_LOCK_ID: bigint = advisoryLockId(
    "ensnode-schema-migration-lock",
  );

  /**
   * Execute pending database migrations for ENSNode Schema in ENSDb.
   *
   * This function is:
   * - idempotent and can be safely executed multiple times,
   * - safe to execute concurrently across multiple ENSIndexer instances,
   *   as it uses a stable arbitrary advisory lock to prevent concurrent
   *   execution of migrations.
   *
   * @param migrationsDirPath - The file path to the directory containing
   *                            database migration files for ENSNode Schema.
   * @throws error when migration execution fails.
   */
  async migrateEnsNodeSchema(migrationsDirPath: string): Promise<void> {
    // `pg_advisory_xact_lock` is transaction-scoped, and is automatically released
    // when the transaction ends, with no explicit unlock needed. Running it inside
    // a Drizzle transaction also guarantees that the lock acquisition, all
    // migration queries, and the lock release all run on the same physical
    // connection — which is required for advisory locks to work correctly with a
    // connection pool.
    await this.drizzleClient.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${EnsDbWriter.MIGRATION_LOCK_ID})`);
      await migrate(tx, {
        migrationsFolder: migrationsDirPath,
        migrationsSchema: "ensnode",
      });
    });
  }

  /**
   * Drop a Postgres schema (and everything in it) from the ENSDb instance, if it exists.
   */
  async dropSchema(schemaName: string): Promise<void> {
    await this.ensDb.execute(sql`drop schema if exists ${sql.identifier(schemaName)} cascade`);
  }

  /**
   * Rename a Postgres schema within the ENSDb instance.
   *
   * The Postgres schema name does not affect Ponder's build_id, so renaming a restored ENSIndexer
   * schema is safe for resume.
   */
  async renameSchema(fromSchemaName: string, toSchemaName: string): Promise<void> {
    await this.ensDb.execute(
      sql`alter schema ${sql.identifier(fromSchemaName)} rename to ${sql.identifier(toSchemaName)}`,
    );
  }

  /**
   * Upsert Indexing Metadata Context Initialized
   *
   * @throws when upsert operation failed.
   */
  async upsertIndexingMetadataContext(
    indexingMetadataContext: IndexingMetadataContextInitialized,
  ): Promise<void> {
    await this.writeEnsNodeMetadata({
      key: EnsNodeMetadataKeys.IndexingMetadataContext,
      value: serializeIndexingMetadataContext(indexingMetadataContext),
    });
  }

  /**
   * Write (upsert) an ENSNode metadata record under this instance's ENSIndexer Schema.
   *
   * Re-keys the record to this writer's {@link ensIndexerSchemaName}, so metadata read from one
   * ENSIndexer Schema can be written under a different (e.g. renamed) one.
   *
   * @throws when the upsert operation failed.
   */
  async writeEnsNodeMetadata(metadata: SerializedEnsNodeMetadata): Promise<void> {
    await this.ensDb
      .insert(this.ensNodeSchema.metadata)
      .values({
        ensIndexerSchemaName: this.ensIndexerSchemaName,
        key: metadata.key,
        value: metadata.value,
      })
      .onConflictDoUpdate({
        target: [this.ensNodeSchema.metadata.ensIndexerSchemaName, this.ensNodeSchema.metadata.key],
        set: { value: metadata.value },
      });
  }
}
