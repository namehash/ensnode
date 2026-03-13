import type {
  CrossChainIndexingStatusSnapshot,
  EnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Client interface with read-only queries for ENSNode Schema in ENSDb.
 */
export interface EnsNodeDbQueries {
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
