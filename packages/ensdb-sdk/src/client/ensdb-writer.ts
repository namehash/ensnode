import { migrate } from "drizzle-orm/node-postgres/migrator";

import {
  type IndexingMetadataContextInitialized,
  serializeIndexingMetadataContext,
} from "@ensnode/ensnode-sdk";

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
   * Execute pending database migrations for ENSNode Schema in ENSDb.
   *
   * @param migrationsDirPath - The file path to the directory containing
   *                            database migration files for ENSNode Schema.
   * @throws error when migration execution fails.
   */
  async migrateEnsNodeSchema(migrationsDirPath: string): Promise<void> {
    return migrate(this.drizzleClient, {
      migrationsFolder: migrationsDirPath,
      migrationsSchema: "ensnode",
    });
  }

  /**
   * Upsert Indexing Metadata Context Initialized
   *
   * @throws when upsert operation failed.
   */
  async upsertIndexingMetadataContext(
    indexingMetadataContext: IndexingMetadataContextInitialized,
  ): Promise<void> {
    await this.upsertEnsNodeMetadata({
      key: EnsNodeMetadataKeys.IndexingMetadataContext,
      value: serializeIndexingMetadataContext(indexingMetadataContext),
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
