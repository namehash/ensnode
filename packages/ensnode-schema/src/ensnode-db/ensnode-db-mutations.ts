import type {
  CrossChainIndexingStatusSnapshot,
  EnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Client interface with mutations for ENSNode Schema in ENSDb.
 */
export interface EnsNodeDbMutations {
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
