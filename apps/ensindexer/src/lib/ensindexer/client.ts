import type {
  SerializedENSIndexerPublicConfig,
  SerializedIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensindexer.client");

export class EnsIndexerClient {
  constructor(private ensIndexerUrl: URL) {}

  /**
   * Wait for ENSIndexer to become healthy.
   *
   * @throws when the Health endpoint didn't return HTTP Status OK.
   */
  public async health(): Promise<void> {
    logger.debug("Fetching ENSIndexer Health status");

    try {
      await fetch(new URL("/health", this.ensIndexerUrl));

      logger.debug("Fetching ENSIndexer Health status: healthy");
    } catch {
      const errorMessage = "Health endpoint for ENSIndexer is not available yet.";
      logger.error(errorMessage);

      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch ENSIndexer Public Config
   *
   * @returns ENSIndexer Public Config
   * @throws error when fetching ENSIndexer Public Config failed
   */
  public async config(): Promise<SerializedENSIndexerPublicConfig> {
    logger.debug("Fetching ENSIndexer Public Config");

    const ensIndexerPublicConfigSerialized = await fetch(
      new URL("/api/config", this.ensIndexerUrl),
    ).then((response) => response.json());

    logger.debug("Fetched ENSIndexer Public Config");

    return ensIndexerPublicConfigSerialized as SerializedENSIndexerPublicConfig;
  }

  /**
   * Fetch Indexing Status
   *
   * @returns Indexing Status when it's available and with valid.
   * @throws error when Indexing Status was either not available, or invalid.
   */
  public async indexingStatus(): Promise<SerializedIndexingStatusResponse> {
    logger.debug("Fetching Indexing Status");

    const indexingStatusSerialized = await fetch(
      new URL("/api/indexing-status", this.ensIndexerUrl),
    ).then((response) => response.json());

    logger.debug("Fetched Indexing Status");

    return indexingStatusSerialized as SerializedIndexingStatusResponse;
  }
}
