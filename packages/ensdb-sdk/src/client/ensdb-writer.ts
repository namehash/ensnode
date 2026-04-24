import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import {
  type CrossChainIndexingStatusSnapshot,
  type EnsIndexerPublicConfig,
  serializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
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
  private readonly MIGRATION_LOCK_ID: bigint = advisoryLockId("ensnode-schema-migration-lock");

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
    // Acquire advisory lock to only allow one ENSIndexer instance to execute
    // migrations at a time across all ENSIndexer instances that share
    // the same ENSDb instance.
    await this.drizzleClient.execute(sql`SELECT pg_advisory_lock(${this.MIGRATION_LOCK_ID})`);

    try {
      // Run any pending migrations for ENSNode Schema.
      // If there were any pending migrations that have not been run before,
      // they will be executed by the ENSIndexer instance that acquired the lock,
      // while other instances will wait for the lock to be released before
      // they can run migrations, but since the function is idempotent,
      // they will simply skip running any migrations that have already been run
      // by the first ENSIndexer instance.
      await migrate(this.drizzleClient, {
        migrationsFolder: migrationsDirPath,
        migrationsSchema: "ensnode",
      });
    } finally {
      // Release advisory lock after migrations execution is completed,
      // regardless of success or failure, to prevent deadlocks.
      // Note: this is optional since Postgres automatically releases
      // all advisory locks held by a session when it ends, but it's
      // a good practice to release locks as soon as they're no longer needed.
      await this.drizzleClient.execute(sql`SELECT pg_advisory_unlock(${this.MIGRATION_LOCK_ID})`);
    }
  }

  /**
   * Upsert ENSDb Version
   *
   * @throws when upsert operation failed.
   */
  async upsertEnsDbVersion(ensDbVersion: string): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsDbVersion,
      value: ensDbVersion,
    });
  }

  /**
   * Upsert ENSIndexer Public Config
   *
   * @throws when upsert operation failed.
   */
  async upsertEnsIndexerPublicConfig(
    ensIndexerPublicConfig: EnsIndexerPublicConfig,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerPublicConfig,
      value: serializeEnsIndexerPublicConfig(ensIndexerPublicConfig),
    });
  }

  /**
   * Upsert Indexing Status Snapshot
   *
   * @throws when upsert operation failed.
   */
  async upsertIndexingStatusSnapshot(
    indexingStatus: CrossChainIndexingStatusSnapshot,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsIndexerIndexingStatus,
      value: serializeCrossChainIndexingStatusSnapshot(indexingStatus),
    });
  }

  /**
   * Upsert ENSNode metadata
   *
   * @throws when upsert operation failed.
   */
  private async upsertEnsNodeMetadata(metadata: SerializedEnsNodeMetadata): Promise<void> {
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
