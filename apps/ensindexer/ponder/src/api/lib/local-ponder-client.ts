import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId } from "@ensnode/ensnode-sdk";
import { type BlockrangeWithStartBlock, type ChainId, PonderClient } from "@ensnode/ponder-sdk";

import type {
  ChainIndexingMetadata,
  ChainIndexingMetadataDynamic,
  ChainIndexingMetadataImmutable,
} from "@/lib/indexing-status-builder/chain-indexing-metadata";
import ponderConfig from "@/ponder/config";

import type { ChainsIndexingMetadataImmutableCache } from "./cache/chains-indexing-metadata-immutable.cache";
import type { PonderClientCache } from "./cache/ponder-client.cache";
import { buildChainsBlockrange } from "./chains-config-blockrange";
import { buildChainsIndexingMetadataDynamic } from "./chains-indexing-metadata-dynamic";

/**
 * LocalPonderClient for interacting with the local Ponder app and its data.
 */
export class LocalPonderClient extends PonderClient {
  // Configuration
  #indexedChainIds: Set<ChainId>;

  // Caches
  #chainsIndexingMetadataImmutableCache: ChainsIndexingMetadataImmutableCache;
  #ponderClientCache: PonderClientCache;

  // Values based on Ponder config and APIs
  #chainsConfigBlockrange?: Map<ChainId, BlockrangeWithStartBlock>;
  #publicClients?: Map<ChainId, PublicClient>;

  constructor(
    ponderAppUrl: URL,
    indexedChainIds: Set<ChainId>,
    chainsIndexingMetadataImmutableCache: ChainsIndexingMetadataImmutableCache,
    ponderClientCache: PonderClientCache,
  ) {
    super(ponderAppUrl);

    this.#indexedChainIds = indexedChainIds;

    this.#ponderClientCache = ponderClientCache;
    this.#ponderClientCache.setContext({ ponderClient: this });

    this.#chainsIndexingMetadataImmutableCache = chainsIndexingMetadataImmutableCache;
    this.#chainsIndexingMetadataImmutableCache.setContext({
      indexedChainIds: this.indexedChainIds,
      chainsConfigBlockrange: this.chainsConfigBlockrange,
      publicClients: this.publicClients,
      ponderClientCache: this.#ponderClientCache,
    });
  }

  /**
   * Map of chain ID to its configured blockrange (start and end blocks)
   * based on the Ponder config.
   *
   * @throws Error if invariants are violated.
   */
  get chainsConfigBlockrange(): Map<ChainId, BlockrangeWithStartBlock> {
    if (this.#chainsConfigBlockrange) {
      return this.#chainsConfigBlockrange;
    }

    this.#chainsConfigBlockrange = buildChainsBlockrange(this.ponderConfig);

    return this.#chainsConfigBlockrange;
  }

  /**
   * List of indexed chain IDs.
   */
  get indexedChainIds(): Set<ChainId> {
    return this.#indexedChainIds;
  }

  /**
   * Complete Ponder config object.
   */
  get ponderConfig() {
    return ponderConfig;
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
  get publicClients(): Map<ChainId, PublicClient> {
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
   * Public client for a given chain ID.
   *
   * @param chainId The chain ID for which to get the public client.
   *                Must be one of the indexed chain IDs.
   * @returns The public client for the specified chain ID.
   * @throws Error if no public client is found for the specified chain ID.
   */
  getPublicClient(chainId: ChainId): PublicClient {
    const publicClient = this.publicClients.get(chainId);

    // Invariant: public client must exist for indexed chain
    if (!publicClient) {
      throw new Error(`Public client must be available for chain ID ${chainId}`);
    }

    return publicClient;
  }

  /**
   * Chain Indexing Metadata.
   *
   * This method combines both {@link ChainIndexingMetadataImmutable} and
   * {@link ChainIndexingMetadataDynamic} metadata for each indexed
   * chain ID.
   *
   * The combined metadata gives a comprehensive view of the indexing status,
   * indexing metrics, and configuration for each chain.
   *
   * @returns A {@link ChainIndexingMetadata} for each chain.
   * @throws Error if dynamic metadata could not be fetched, or if any of
   * the required metadata is missing or invalid for any indexed chain.
   */
  async chainsIndexingMetadata(): Promise<Map<ChainId, ChainIndexingMetadata>> {
    const chainsIndexingMetadata = new Map<ChainId, ChainIndexingMetadata>();

    const chainsIndexingMetadataImmutable = await this.getChainsIndexingMetadataImmutable();
    const chainsIndexingMetadataDynamic = await this.getChainsIndexingMetadataDynamic();

    for (const chainId of this.indexedChainIds) {
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

    return chainsIndexingMetadata;
  }

  /**
   * Get the immutable part of the chains indexing metadata, which includes
   * the metadata fields that are expected to remain constant for a chain
   * during the indexing process.
   *
   * @returns A {@link ChainIndexingMetadataImmutable} for each indexed chain.
   * @throws Error if the required metadata is not available in cache or if
   *         any invariants are violated.
   */
  private async getChainsIndexingMetadataImmutable(): Promise<
    Map<ChainId, ChainIndexingMetadataImmutable>
  > {
    const chainsIndexingMetadataImmutable = await this.#chainsIndexingMetadataImmutableCache.read();

    // Invariant: indexing metrics must be available in cache
    if (chainsIndexingMetadataImmutable instanceof Error) {
      throw new Error(
        `Chains Indexing Metadata Immutable must be available in cache to build chains indexing metadata immutable: ${chainsIndexingMetadataImmutable.message}`,
      );
    }

    return chainsIndexingMetadataImmutable;
  }

  /**
   * Get the dynamic part of the chains indexing metadata, which includes
   * the metadata fields that can change for a chain during the indexing
   * process.
   *
   * @returns A {@link ChainIndexingMetadataDynamic} for each indexed chain.
   * @throws Error if the required metadata is not available in cache or if
   *         any invariants are violated.
   */
  private async getChainsIndexingMetadataDynamic(): Promise<
    Map<ChainId, ChainIndexingMetadataDynamic>
  > {
    const ponderClientCacheResult = await this.#ponderClientCache.read();

    // Invariants: both indexing metrics and indexing status must be available
    // in cache
    if (ponderClientCacheResult instanceof Error) {
      throw new Error(
        `Ponder Client cache must be available to build chains indexing metadata dynamic: ${ponderClientCacheResult.message}`,
      );
    }

    const { ponderIndexingMetrics, ponderIndexingStatus } = ponderClientCacheResult;

    return buildChainsIndexingMetadataDynamic(
      this.indexedChainIds,
      ponderIndexingMetrics,
      ponderIndexingStatus,
    );
  }
}
