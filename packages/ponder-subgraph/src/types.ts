interface MetadataBlockInfo {
  /** Block number */
  number: bigint;

  /** Block unix timestamp */
  timestamp: bigint;

  /** Block hash */
  hash: `0x${string}`;

  /** Block parent hash */
  parentHash: `0x${string}`;
}

/**
 * The metadata provider interface used to fetch data from the application layer.
 */
export interface MetadataProvider {
  /**
   * Unique ID to be used as a deployment ID in `_meta_.deployment`.
   */
  deployment: string;

  /**
   * Get last indexed block status
   * @returns The last indexed block status
   */
  getLastIndexedENSRootChainBlock(): Promise<MetadataBlockInfo | null>;

  /**
   * Get the indexing errors status
   * @returns The indexing errors status
   */
  hasIndexingErrors: () => Promise<boolean>;
}
