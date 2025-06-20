export type SubgraphMetaBlock = {
  /** Block number */
  number: bigint;

  /** Block unix timestamp */
  timestamp: bigint;

  /** Block hash */
  hash: `0x${string}`;

  /** Block parent hash */
  parentHash: `0x${string}`;
};

/**
 * The metadata provider interface used to fetch data from the application layer.
 */
export interface PonderMetadataProvider {
  /**
   * ENSIndexer app version.
   */
  version: string;

  /**
   * Get last indexed block status
   * @returns The last indexed block status
   */
  getLastIndexedL1ChainBlock(): Promise<SubgraphMetaBlock>;

  /**
   * Get the Ponder build ID
   * @returns The Ponder build ID
   */
  getPonderBuildId(): Promise<string>;

  /**
   * Get the indexing errors status
   * @returns The indexing errors status
   */
  hasIndexingErrors: () => Promise<boolean>;
}
