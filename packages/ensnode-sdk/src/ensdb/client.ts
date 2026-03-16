import type { EnsIndexerPublicConfig } from "../ensindexer/config";
import type { CrossChainIndexingStatusSnapshot } from "../indexing-status/cross-chain-indexing-status-snapshot";

/**
 * ENSDb Client Query
 *
 * Includes methods for reading from ENSDb.
 */
export interface EnsDbClientQuery {
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
 * ENSDb Client Mutation
 *
 * Includes methods for writing into ENSDb.
 */
export interface EnsDbClientMutation {
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
