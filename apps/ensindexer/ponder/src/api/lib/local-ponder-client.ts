import config from "@/config";

import type { OmnichainIndexingStatusSnapshot } from "@ensnode/ensnode-sdk";
import { PonderClient } from "@ensnode/ponder-sdk";

import { buildOmnichainIndexingStatusSnapshot } from "@/lib/indexing-status-builder/omnichain-indexing-status-snapshot";

import { ponderAppMetadataCache } from "./cache/ponder-app-metadata.cache";

/**
 * LocalPonderClient for interacting with the local Ponder app and its data.
 */
export class LocalPonderClient extends PonderClient {
  /**
   * Get {@link OmnichainIndexingStatusSnapshot} for the indexed chains.
   *
   * This method fetches the necessary data from the Ponder Client cache and
   * builds the indexing status snapshot for all indexed chains.
   *
   * @returns A {@link OmnichainIndexingStatusSnapshot} for the indexed chains.
   * @throws Error if required data is not available in cache or if any of
   * the invariants are violated. For example, if indexing metrics are not
   * available in cache, or if the metadata for any indexed chain cannot be
   * built due to missing or invalid data.
   */
  public async getOmnichainIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
    const ponderAppMetadata = await ponderAppMetadataCache.read();

    // Invariant: Ponder App Metadata must be available in cache
    if (ponderAppMetadata instanceof Error) {
      throw new Error(
        `Ponder App Metadata must be available in cache: ${ponderAppMetadata.message}`,
      );
    }

    const { chainsIndexingMetadata } = ponderAppMetadata;

    return buildOmnichainIndexingStatusSnapshot(chainsIndexingMetadata);
  }
}

/**
 * The singleton instance of LocalPonderClient.
 */
export const localPonderClient = new LocalPonderClient(config.ensIndexerUrl);
