import {
  deserializeENSIndexerPublicConfig,
  deserializeIndexingStatusResponse,
  type ENSIndexerPublicConfig,
  type IndexingStatusResponse,
  type SerializedENSIndexerPublicConfig,
  type SerializedIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

export class EnsIndexerClient {
  constructor(private ensIndexerUrl: URL) {}

  /**
   * Wait for ENSIndexer to become healthy.
   *
   * @throws when the Health endpoint didn't return HTTP Status OK.
   */
  public async health(): Promise<void> {
    try {
      await fetch(new URL("/health", this.ensIndexerUrl));
    } catch {
      const errorMessage = "Health endpoint for ENSIndexer is not available yet.";

      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch ENSIndexer Public Config
   *
   * @returns ENSIndexer Public Config
   * @throws error when fetching ENSIndexer Public Config failed
   */
  public async config(): Promise<ENSIndexerPublicConfig> {
    const ensIndexerPublicConfigSerialized = await fetch(
      new URL("/api/config", this.ensIndexerUrl),
    ).then((response) => response.json());

    return deserializeENSIndexerPublicConfig(
      ensIndexerPublicConfigSerialized as SerializedENSIndexerPublicConfig,
    );
  }

  /**
   * Fetch Indexing Status
   *
   * @returns Indexing Status when it's available and with valid.
   * @throws error when Indexing Status was either not available, or invalid.
   */
  public async indexingStatus(): Promise<IndexingStatusResponse> {
    const indexingStatusSerialized = await fetch(
      new URL("/api/indexing-status", this.ensIndexerUrl),
    ).then((response) => response.json());

    return deserializeIndexingStatusResponse(
      indexingStatusSerialized as SerializedIndexingStatusResponse,
    );
  }
}
