import { migrate } from "drizzle-orm/node-postgres/migrator";

import {
  type CrossChainIndexingStatusSnapshot,
  type EnsIndexerPublicConfig,
  serializeCrossChainIndexingStatusSnapshot,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import * as ensNodeSchema from "../ensnode-schema";
import { buildDrizzleDb, type EnsDbDrizzle } from "../lib/drizzle";
import type { EnsNodeDbMigrations } from "./ensnode-db-migrations";
import type { EnsNodeDbMutations } from "./ensnode-db-mutations";
import { EnsNodeDbReader } from "./ensnode-db-reader";
import { EnsNodeMetadataKeys } from "./ensnode-metadata";
import type { SerializedEnsNodeMetadata } from "./serialize/ensnode-metadata";

/**
 * ENSNode Database Writer
 *
 * Provides read and write access to ENSNode Schema in ENSDb.
 */
export class EnsNodeDbWriter
  extends EnsNodeDbReader
  implements EnsNodeDbMutations, EnsNodeDbMigrations
{
  /**
   * Drizzle database instance for ENSNode Schema in ENSDb.
   *
   * Used for read and write operations.
   */
  private ensNodeDb: EnsDbDrizzle<typeof ensNodeSchema>;

  /**
   * @param ensDbConnectionString connection string for ENSDb Postgres database
   * @param ensIndexerSchemaName reference string for ENSIndexer instance (used for multi-tenancy in ENSDb)
   */
  constructor(ensDbConnectionString: string, ensIndexerSchemaName: string) {
    super(ensDbConnectionString, ensIndexerSchemaName);

    this.ensNodeDb = buildDrizzleDb(ensDbConnectionString, ensNodeSchema);
  }

  /**
   * @inheritdoc
   */
  async migrate(migrationsDirPath: string): Promise<void> {
    return migrate(this.ensNodeDb, {
      migrationsFolder: migrationsDirPath,
      migrationsSchema: ensNodeSchema.ENSNODE_SCHEMA_NAME,
    });
  }

  /**
   * @inheritdoc
   */
  async upsertEnsDbVersion(ensDbVersion: string): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.EnsDbVersion,
      value: ensDbVersion,
    });
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
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
  private async upsertEnsNodeMetadata<
    EnsNodeMetadataType extends SerializedEnsNodeMetadata = SerializedEnsNodeMetadata,
  >(metadata: EnsNodeMetadataType): Promise<void> {
    await this.ensNodeDb
      .insert(ensNodeSchema.ensNodeMetadata)
      .values({
        ensIndexerSchemaName: this.ensIndexerSchemaName,
        key: metadata.key,
        value: metadata.value,
      })
      .onConflictDoUpdate({
        target: [
          ensNodeSchema.ensNodeMetadata.ensIndexerSchemaName,
          ensNodeSchema.ensNodeMetadata.key,
        ],
        set: { value: metadata.value },
      });
  }
}
