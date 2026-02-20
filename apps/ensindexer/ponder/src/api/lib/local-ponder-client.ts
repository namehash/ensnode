import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId } from "@ensnode/ensnode-sdk";
import { type BlockrangeWithStartBlock, type ChainId, PonderClient } from "@ensnode/ponder-sdk";

import type {
  ChainIndexingMetadata,
  ChainIndexingMetadataImmutable,
} from "@/lib/indexing-status-builder/chain-indexing-metadata";
import { buildChainsIndexingMetadataImmutable } from "@/ponder/api/lib/chains-indexing-metadata-immutable";
import ponderConfig from "@/ponder/config";

import { buildChainsBlockrange } from "./chains-config-blockrange";
import { buildChainsIndexingMetadataDynamic } from "./chains-indexing-metadata-dynamic";

/**
 * Build a map of chain ID to its configured blockrange (start and end blocks)
 * based on the Ponder config.
 *
 * @throws Error if invariants are violated.
 */
function buildChainsConfigBlockrange(): Map<ChainId, BlockrangeWithStartBlock> {
  return buildChainsBlockrange(ponderConfig);
}

/**
 * Build a map of cached RPC clients for each indexed chain.
 *
 * @returns A map where the keys are chain IDs and the values are the corresponding public clients.
 * @throws Error if any of chain ID keys cannot be deserialized.
 */
function buildPublicClientsMap(): Map<ChainId, PublicClient> {
  return new Map<ChainId, PublicClient>(
    Object.entries(ponderPublicClients).map(([chainId, publicClient]) => [
      deserializeChainId(chainId),
      publicClient,
    ]),
  );
}

/**
 * LocalPonderClient for interacting with the local Ponder app and its data.
 */
export class LocalPonderClient {
  #ponderClient: PonderClient;
  #publicClients: Map<ChainId, PublicClient>;
  #indexedChainIds: Set<ChainId>;
  #chainIndexingMetadataImmutable: Map<ChainId, ChainIndexingMetadataImmutable>;

  private constructor(
    ponderClient: PonderClient,
    publicClients: Map<ChainId, PublicClient>,
    indexedChainIds: Set<ChainId>,
    chainIndexingMetadataImmutable: Map<ChainId, ChainIndexingMetadataImmutable>,
  ) {
    this.#ponderClient = ponderClient;
    this.#publicClients = publicClients;
    this.#indexedChainIds = indexedChainIds;
    this.#chainIndexingMetadataImmutable = chainIndexingMetadataImmutable;
  }

  /**
   * Initialize a LocalPonderClient instance by connecting to
   * the local Ponder app and fetching the necessary data to build
   * the client's state.
   *
   * @param ponderAppUrl The URL of the local Ponder app to connect to.
   * @returns An initialized LocalPonderClient instance ready to be
   *          used to access the local Ponder app and its data.
   *
   * @throws Error if the client fails to connect to the local Ponder app or
   *               if any of the required data cannot be fetched or is invalid.
   */
  static async init(ponderAppUrl: URL, indexedChainIds: Set<ChainId>): Promise<LocalPonderClient> {
    const ponderClient = new PonderClient(ponderAppUrl);
    const publicClients = buildPublicClientsMap();
    const chainsConfigBlockrange = buildChainsConfigBlockrange();
    const ponderIndexingMetrics = await ponderClient.metrics();
    const chainIndexingMetadataImmutable = await buildChainsIndexingMetadataImmutable(
      indexedChainIds,
      chainsConfigBlockrange,
      publicClients,
      ponderIndexingMetrics,
    );

    const client = new LocalPonderClient(
      ponderClient,
      publicClients,
      indexedChainIds,
      chainIndexingMetadataImmutable,
    );

    return client;
  }

  /**
   * Complete Ponder config object.
   */
  get ponderConfig() {
    return ponderConfig;
  }

  /**
   * List of indexed chain IDs.
   */
  get indexedChainIds() {
    return this.#indexedChainIds;
  }

  /**
   * Ponder client instance connected to the local Ponder app.
   */
  get ponderClient(): PonderClient {
    return this.#ponderClient;
  }

  /**
   * Public client for a given chain ID.
   *
   * @param chainId The chain ID for which to get the public client.
   *                Must be one of the indexed chain IDs.
   * @returns The public client for the specified chain ID.
   * @throws Error if no public client is found for the specified chain ID.
   */
  publicClient(chainId: ChainId): PublicClient {
    const publicClient = this.#publicClients.get(chainId);

    // Invariant: public client must exist for indexed chain
    if (!publicClient) {
      throw new Error(`No public client found for chain ID ${chainId}`);
    }

    return publicClient;
  }

  /**
   * Chain indexing metadata.
   *
   * @returns Chain indexing metadata for each chain.
   * @throws Error if dynamic metadata could not be fetched, or if any of
   * the required metadata is missing or invalid for any indexed chain.
   */
  async chainsIndexingMetadata(): Promise<Map<ChainId, ChainIndexingMetadata>> {
    const chainsIndexingMetadata = new Map<ChainId, ChainIndexingMetadata>();

    const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
      this.#ponderClient.metrics(),
      this.#ponderClient.status(),
    ]);

    const chainsIndexingMetadataDynamic = buildChainsIndexingMetadataDynamic(
      this.indexedChainIds,
      ponderIndexingMetrics,
      ponderIndexingStatus,
    );

    for (const chainId of this.indexedChainIds) {
      const chainIndexingMetadataImmutable = this.#chainIndexingMetadataImmutable.get(chainId);
      const chainIndexingMetadataDynamic = chainsIndexingMetadataDynamic.get(chainId);

      // Invariant: immutable and dynamic metadata must exist for indexed chain
      if (!chainIndexingMetadataImmutable) {
        throw new Error(`No immutable indexing metadata found for chain ID ${chainId}`);
      }

      if (!chainIndexingMetadataDynamic) {
        throw new Error(`No dynamic indexing metadata found for chain ID ${chainId}`);
      }

      const metadata = {
        ...chainIndexingMetadataImmutable,
        ...chainIndexingMetadataDynamic,
      } satisfies ChainIndexingMetadata;

      chainsIndexingMetadata.set(chainId, metadata);
    }

    return chainsIndexingMetadata;
  }
}
