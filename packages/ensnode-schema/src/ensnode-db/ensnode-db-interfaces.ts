import type {
  CrossChainIndexingStatusSnapshot,
  EnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Client interface with mutation methods for ENSNode Schema in ENSDb.
 */
export interface EnsNodeDbClientMutation {
  /**
   * Upsert ENSDb Version
   *
   * @throws when upsert operation failed.
   */
  upsertEnsDbVersion(ensDbVersion: string): Promise<void>;

  /**
   * Upsert ENSIndexer Public Config
   *
   * @throws when upsert operation failed.
   */
  upsertEnsIndexerPublicConfig(ensIndexerPublicConfig: EnsIndexerPublicConfig): Promise<void>;

  /**
   * Upsert Indexing Status Snapshot
   *
   * @throws when upsert operation failed.
   */
  upsertIndexingStatusSnapshot(indexingStatus: CrossChainIndexingStatusSnapshot): Promise<void>;
}

/**
 * Client interface with migration methods for ENSNode Schema in ENSDb.
 */
export interface EnsNodeDbClientMigration {
  /**
   * Execute pending database migrations for ENSNode Schema in ENSDb.
   *
   * @param migrationsDirPath - The file path to the directory containing
   *                            database migration files for ENSNode Schema.
   * @throws error when migration execution fails.
   */
  migrate(migrationsDirPath: string): Promise<void>;
}
