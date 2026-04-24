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
    // `pg_advisory_xact_lock` is transaction-scoped, and is automatically released
    // when the transaction ends, with no explicit unlock needed. Running it inside
    // a Drizzle transaction also guarantees that the lock acquisition, all
    // migration queries, and the lock release all run on the same physical
    // connection — which is required for advisory locks to work correctly with a
    // connection pool.
    await this.drizzleClient.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${this.MIGRATION_LOCK_ID})`);
      await migrate(tx, {
        migrationsFolder: migrationsDirPath,
        migrationsSchema: "ensnode",
      });
    });
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
