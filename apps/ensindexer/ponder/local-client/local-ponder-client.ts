import { publicClients } from "ponder:api";
import type { PublicClient } from "viem";

import {
  deserializeOmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";
import {
  buildHistoricalTotalBlocksForChains,
  type ChainBlockRefs,
  type ChainIdString,
  getChainsBlockRefs,
  getChainsBlockrange,
  PonderClient,
  type PonderMetricsResponse,
} from "@ensnode/ponder-sdk";

import ponderConfig from "./config";
import { createSerializedChainSnapshots } from "./lib/chain-indexing-status-snapshot";
import { createSerializedOmnichainIndexingStatusSnapshot } from "./lib/omnichain-indexing-status-snapshot";

export class LocalPonderClient {
  /**
   * Cached Chain Block Refs
   *
   * {@link ChainBlockRefs} for each indexed chain.
   */
  private chainsBlockRefs = new Map<ChainIdString, ChainBlockRefs>();

  private readonly ponderClient: PonderClient;

  constructor(ponderApplicationUrl: URL) {
    this.ponderClient = new PonderClient(ponderApplicationUrl);
  }

  public async buildCrossChainIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
    const [metrics, status] = await Promise.all([
      this.ponderClient.metrics(),
      this.ponderClient.status(),
    ]);

    const chainsBlockRefs = await this.getChainsBlockRefsCached(metrics);

    // create serialized chain indexing snapshot for each indexed chain
    const serializedChainSnapshots = createSerializedChainSnapshots(
      this.indexedChainIds,
      chainsBlockRefs,
      metrics,
      status,
    );

    const serializedOmnichainSnapshot =
      createSerializedOmnichainIndexingStatusSnapshot(serializedChainSnapshots);

    return deserializeOmnichainIndexingStatusSnapshot(serializedOmnichainSnapshot);
  }

  /**
   * Get cached {@link IndexedChainBlockRefs} for indexed chains.
   *
   * Guaranteed to include {@link ChainBlockRefs} for each indexed chain.
   *
   * Note: performs a network request only once and caches response to
   * re-use it for further `getChainsBlockRefs` calls.
   *
   * @throws when RPC calls fail or data model invariants are not met.
   */
  private async getChainsBlockRefsCached(
    metrics: PonderMetricsResponse,
  ): Promise<Map<ChainIdString, ChainBlockRefs>> {
    // early-return the cached chain block refs
    if (this.chainsBlockRefs.size > 0) {
      return this.chainsBlockRefs;
    }

    this.chainsBlockRefs = await getChainsBlockRefs(
      this.indexedChainIds,
      getChainsBlockrange(this.ponderConfig),
      buildHistoricalTotalBlocksForChains(this.indexedChainIds, metrics),
      this.publicClients,
    );

    return this.chainsBlockRefs;
  }

  private get ponderConfig() {
    return ponderConfig;
  }

  private get publicClients(): Record<ChainIdString, PublicClient> {
    return publicClients;
  }

  private get indexedChainIds(): ChainIdString[] {
    return Object.keys(this.ponderConfig.chains) as ChainIdString[];
  }
}
