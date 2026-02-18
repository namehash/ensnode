import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { type Blockrange, createIndexingConfig, deserializeChainId } from "@ensnode/ensnode-sdk";
import { type ChainId, ChainIndexingStates, PonderClient } from "@ensnode/ponder-sdk";

import type {
  ChainIndexingMetadata,
  ChainIndexingMetadataDynamic,
  ChainIndexingMetadataFixed,
} from "@/lib/indexing-status-builder/chain-indexing-metadata";
import ponderConfig from "@/ponder/config";

import { buildChainsBlockrange } from "./chains-config-blockrange";
import { fetchBlockRef } from "./fetch-block-ref";
import { buildIndexedChainIds } from "./indexed-chains";

/**
 * Build a map of chain ID to its configured blockrange (start and end blocks)
 * based on the Ponder config.
 *
 * @throws Error if invariants are violated.
 */
function buildChainsConfigBlockrange(): Map<ChainId, Blockrange> {
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
 * Build a map of chain ID to its fixed indexing metadata.
 *
 * @param publicClients A map of chain ID to its corresponding public client,
 *                      used to fetch block references for chain's blockrange.
 * @param ponderClient The Ponder client used to fetch indexing metrics and status.
 * @returns A map of chain ID to its fixed indexing metadata.
 * @throws Error if any of the required data cannot be fetched or is invalid,
 *         or if invariants are violated.
 */
async function buildChainsIndexingMetadataFixed(
  publicClients: Map<ChainId, PublicClient>,
  ponderClient: PonderClient,
): Promise<Map<ChainId, ChainIndexingMetadataFixed>> {
  console.log("Building ChainIndexingMetadataFixed...");
  const chainsIndexingMetadataFixed = new Map<ChainId, ChainIndexingMetadataFixed>();

  const chainsConfigBlockrange = buildChainsConfigBlockrange();
  const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
    ponderClient.metrics(),
    ponderClient.status(),
  ]);

  for (const [chainId, publicClient] of publicClients.entries()) {
    const chainConfigBlockrange = chainsConfigBlockrange.get(chainId);
    const chainIndexingMetrics = ponderIndexingMetrics.chains.get(chainId);
    const chainIndexingStatus = ponderIndexingStatus.chains.get(chainId);

    // Invariants: chain config blockrange, indexing metrics, and indexing status
    // must exist in proper state for the indexed chain.
    if (!chainConfigBlockrange) {
      throw new Error(`No chain config blockrange found for indexed chain ID ${chainId}`);
    }

    if (!chainConfigBlockrange.startBlock) {
      throw new Error(
        `No start block found in chain config blockrange for indexed chain ID ${chainId}`,
      );
    }

    if (!chainIndexingMetrics) {
      throw new Error(`No indexing metrics found for indexed chain ID ${chainId}`);
    }

    if (chainIndexingMetrics.state !== ChainIndexingStates.Historical) {
      throw new Error(
        `In order to build 'ChainsIndexingMetadataFixed', chain indexing state must be "historical" for indexed chain ID ${chainId}, but got "${chainIndexingMetrics.state}"`,
      );
    }

    if (!chainIndexingStatus) {
      throw new Error(`No indexing status found for indexed chain ID ${chainId}`);
    }

    const backfillEndBlockNumber =
      chainConfigBlockrange.startBlock + chainIndexingMetrics.historicalTotalBlocks + 1;

    const [startBlock, endBlock, backfillEndBlock] = await Promise.all([
      fetchBlockRef(publicClient, chainConfigBlockrange.startBlock),
      chainConfigBlockrange.endBlock
        ? fetchBlockRef(publicClient, chainConfigBlockrange.endBlock)
        : null,
      fetchBlockRef(publicClient, backfillEndBlockNumber),
    ]);

    const chainIndexingConfig = createIndexingConfig(startBlock, endBlock);

    const metadataFixed: ChainIndexingMetadataFixed = {
      backfillScope: {
        startBlock,
        endBlock: backfillEndBlock,
      },
      indexingConfig: chainIndexingConfig,
    };

    // Cache the fixed metadata for this chain ID
    chainsIndexingMetadataFixed.set(chainId, metadataFixed);
  }

  console.log("ChainIndexingMetadataFixed built successfully");

  return chainsIndexingMetadataFixed;
}

async function buildChainsIndexingMetadataDynamic(
  indexedChainIds: ChainId[],
  ponderClient: PonderClient,
): Promise<Map<ChainId, ChainIndexingMetadataDynamic>> {
  const chainsIndexingMetadataDynamic = new Map<ChainId, ChainIndexingMetadataDynamic>();

  const [ponderIndexingMetrics, ponderIndexingStatus] = await Promise.all([
    ponderClient.metrics(),
    ponderClient.status(),
  ]);

  for (const chainId of indexedChainIds) {
    const chainIndexingMetrics = ponderIndexingMetrics.chains.get(chainId);
    const chainIndexingStatus = ponderIndexingStatus.chains.get(chainId);

    // Invariants: indexing metrics and indexing status must exist in proper state for the indexed chain.
    if (!chainIndexingMetrics) {
      throw new Error(`No indexing metrics found for indexed chain ID ${chainId}`);
    }

    if (!chainIndexingStatus) {
      throw new Error(`No indexing status found for indexed chain ID ${chainId}`);
    }

    const metadataDynamic = {
      indexingMetrics: chainIndexingMetrics,
      indexingStatus: chainIndexingStatus,
    } satisfies ChainIndexingMetadataDynamic;

    // Cache the dynamic metadata for this chain ID
    chainsIndexingMetadataDynamic.set(chainId, metadataDynamic);
  }

  return chainsIndexingMetadataDynamic;
}

/**
 * LocalPonderClient for interacting with the local Ponder app and its data.
 */
export class LocalPonderClient {
  #ponderClient: PonderClient;
  #publicClients: Map<ChainId, PublicClient>;
  #indexedChainIds: ChainId[];
  #chainIndexingMetadataFixed: Map<ChainId, ChainIndexingMetadataFixed>;

  private constructor(
    ponderClient: PonderClient,
    publicClients: Map<ChainId, PublicClient>,
    indexedChainIds: ChainId[],
    chainIndexingMetadataFixed: Map<ChainId, ChainIndexingMetadataFixed>,
  ) {
    this.#ponderClient = ponderClient;
    this.#publicClients = publicClients;
    this.#indexedChainIds = indexedChainIds;
    this.#chainIndexingMetadataFixed = chainIndexingMetadataFixed;
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
  static async init(ponderAppUrl: URL): Promise<LocalPonderClient> {
    const ponderClient = new PonderClient(ponderAppUrl);
    const publicClients = buildPublicClientsMap();
    const indexedChainIds = buildIndexedChainIds(publicClients);
    const chainIndexingMetadataFixed = await buildChainsIndexingMetadataFixed(
      publicClients,
      ponderClient,
    );

    const client = new LocalPonderClient(
      ponderClient,
      publicClients,
      indexedChainIds,
      chainIndexingMetadataFixed,
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
    const chainsIndexingMetadataDynamic = await buildChainsIndexingMetadataDynamic(
      this.indexedChainIds,
      this.#ponderClient,
    );

    for (const chainId of this.indexedChainIds) {
      const chainIndexingMetadataFixed = this.#chainIndexingMetadataFixed.get(chainId);
      const chainIndexingMetadataDynamic = chainsIndexingMetadataDynamic.get(chainId);

      // Invariant: fixed and dynamic metadata must exist for indexed chain
      if (!chainIndexingMetadataFixed) {
        throw new Error(`No fixed indexing metadata found for chain ID ${chainId}`);
      }

      if (!chainIndexingMetadataDynamic) {
        throw new Error(`No dynamic indexing metadata found for chain ID ${chainId}`);
      }

      const metadata = {
        ...chainIndexingMetadataFixed,
        ...chainIndexingMetadataDynamic,
      } satisfies ChainIndexingMetadata;

      chainsIndexingMetadata.set(chainId, metadata);
    }

    return chainsIndexingMetadata;
  }
}
