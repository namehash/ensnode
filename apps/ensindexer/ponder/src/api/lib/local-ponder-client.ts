import config from "@/config";

import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId, type OmnichainIndexingStatusSnapshot } from "@ensnode/ensnode-sdk";
import { type BlockrangeWithStartBlock, type ChainId, PonderClient } from "@ensnode/ponder-sdk";

import type {
  ChainIndexingMetadata,
  ChainIndexingMetadataImmutable,
} from "@/lib/indexing-status-builder/chain-indexing-metadata";
import { buildOmnichainIndexingStatusSnapshot } from "@/lib/indexing-status-builder/omnichain-indexing-status-snapshot";
import { buildChainsIndexingMetadataImmutable } from "@/ponder/api/lib/chains-indexing-metadata-immutable";
import ponderConfig from "@/ponder/config";

import { ponderAppMetadataCache } from "./cache/ponder-app-metadata.cache";
import { buildChainsBlockrange } from "./chains-config-blockrange";
import { buildChainsIndexingMetadataDynamic } from "./chains-indexing-metadata-dynamic";

/**
 * LocalPonderClient for interacting with the local Ponder app and its data.
 */
export class LocalPonderClient extends PonderClient {
  // Configuration
  #indexedChainIds: Set<ChainId>;

  // Values based on Ponder config and inter-process APIs
  #chainsConfigBlockrange?: Map<ChainId, BlockrangeWithStartBlock>;
  #chainsIndexingMetadataImmutable?: Promise<Map<ChainId, ChainIndexingMetadataImmutable>>;
  #publicClients?: Map<ChainId, PublicClient>;

  constructor(ponderAppUrl: URL, indexedChainIds: Set<ChainId>) {
    super(ponderAppUrl);

    this.#indexedChainIds = indexedChainIds;
  }

  /**
   * Map of chain ID to its configured blockrange (start and end blocks)
   * based on the Ponder config.
   *
   * @throws Error if invariants are violated.
   */
  private get chainsConfigBlockrange(): Map<ChainId, BlockrangeWithStartBlock> {
    if (this.#chainsConfigBlockrange) {
      return this.#chainsConfigBlockrange;
    }

    this.#chainsConfigBlockrange = buildChainsBlockrange(ponderConfig);

    return this.#chainsConfigBlockrange;
  }

  /**
   * Map of chain ID to its RPC public client.
   *
   * Each RPC public client is cached by Ponder app.
   *
   * @returns Map where the keys are chain IDs and the values are
   *          the corresponding public clients.
   * @throws Error if any of chain ID keys cannot be deserialized.
   */
  private get publicClients(): Map<ChainId, PublicClient> {
    if (this.#publicClients) {
      return this.#publicClients;
    }

    const result = new Map<ChainId, PublicClient>();

    for (const [chainId, publicClient] of Object.entries(ponderPublicClients)) {
      result.set(deserializeChainId(chainId), publicClient);
    }

    this.#publicClients = result;

    return this.#publicClients;
  }

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
    const chainsIndexingMetadata = new Map<ChainId, ChainIndexingMetadata>();

    const ponderAppMetadata = await ponderAppMetadataCache.read();

    // Invariant: Ponder App Metadata must be available in cache
    if (ponderAppMetadata instanceof Error) {
      throw new Error(
        `Ponder App Metadata must be available in cache: ${ponderAppMetadata.message}`,
      );
    }

    const { ponderIndexingMetrics, ponderIndexingStatus } = ponderAppMetadata;

    // Build and cache immutable metadata for indexed chains if not already cached.
    if (this.#chainsIndexingMetadataImmutable === undefined) {
      this.#chainsIndexingMetadataImmutable = buildChainsIndexingMetadataImmutable(
        this.#indexedChainIds,
        this.chainsConfigBlockrange,
        this.publicClients,
        ponderIndexingMetrics,
      );
    }

    let chainsIndexingMetadataImmutable: Map<ChainId, ChainIndexingMetadataImmutable>;

    try {
      chainsIndexingMetadataImmutable = await this.#chainsIndexingMetadataImmutable;
    } catch (error) {
      // Reset the cached promise if it is rejected to allow retrying on
      // the next request, since the error may be transient.
      this.#chainsIndexingMetadataImmutable = undefined;

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Chains Indexing Metadata Immutable must be available to build omnichain indexing status snapshot: ${errorMessage}`,
      );
    }

    // Build dynamic metadata for indexed chains on each request since
    // it may change frequently based on the indexing status and metrics.
    const chainsIndexingMetadataDynamic = buildChainsIndexingMetadataDynamic(
      this.#indexedChainIds,
      ponderIndexingMetrics,
      ponderIndexingStatus,
    );

    for (const chainId of this.#indexedChainIds) {
      const chainIndexingMetadataImmutable = chainsIndexingMetadataImmutable.get(chainId);
      const chainIndexingMetadataDynamic = chainsIndexingMetadataDynamic.get(chainId);

      // Invariant: both, immutable and dynamic metadata must exist for indexed chain
      if (!chainIndexingMetadataImmutable) {
        throw new Error(`Immutable indexing metadata must be available for chain ID ${chainId}`);
      }

      if (!chainIndexingMetadataDynamic) {
        throw new Error(`Dynamic indexing metadata must be available for chain ID ${chainId}`);
      }

      const metadata = {
        ...chainIndexingMetadataImmutable,
        ...chainIndexingMetadataDynamic,
      } satisfies ChainIndexingMetadata;

      chainsIndexingMetadata.set(chainId, metadata);
    }

    return buildOmnichainIndexingStatusSnapshot(chainsIndexingMetadata);
  }
}

/**
 * The singleton instance of LocalPonderClient.
 */
export const localPonderClient = new LocalPonderClient(
  config.ensIndexerUrl,
  config.indexedChainIds,
);
