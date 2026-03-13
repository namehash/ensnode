import type {
  CrossChainIndexingStatusSnapshot,
  EnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Client interface with read-only query methods for ENSNode Schema in ENSDb.
 */
export interface EnsNodeDbClientQuery {
  /**
   * Get ENSDb Version
   *
   * @returns the existing record, or `undefined`.
   */
  getEnsDbVersion(): Promise<string | undefined>;

  /**
   * Get ENSIndexer Public Config
   *
   * @returns the existing record, or `undefined`.
   */
  getEnsIndexerPublicConfig(): Promise<EnsIndexerPublicConfig | undefined>;

  /**
   * Get Indexing Status Snapshot
   *
   * @returns the existing record, or `undefined`.
   */
  getIndexingStatusSnapshot(): Promise<CrossChainIndexingStatusSnapshot | undefined>;
}

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
