/**
 * Build Indexing Status
 *
 * This file includes ideas and functionality integrating Ponder Metadata
 * with ENSIndexer application. Here all Ponder Metadata concepts, such as
 * - chain configuration from `ponder.config.ts` file,
 * - metrics from `/metrics` endpoint,
 * - publicClients from `ponder:api` import,
 * - status from `/status` endpoint,
 * all turn into the ENSIndexer data model.
 */

import config from "@/config";

import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  deserializeOmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshot,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";
import {
  type ChainBlockRefs,
  type ChainName,
  createSerializedChainSnapshots,
  createSerializedOmnichainIndexingStatusSnapshot,
  getChainsBlockRefs,
  getChainsBlockrange,
  type PonderMetricsResponse,
  type PonderStatusResponse,
  type PublicClient,
} from "@ensnode/ponder-sdk";

import { ponderClient, waitForPonderApplicationToBecomeHealthy } from "@/lib/ponder-local-client";
import ponderConfig from "@/ponder/config";

/**
 * Stringified chain IDs for each indexed chain
 */
const chainIds = Object.keys(ponderConfig.chains) as string[];

/**
 * A {@link Blockrange} for each indexed chain.
 *
 * Invariants:
 * - every chain include a startBlock,
 * - some chains may include an endBlock,
 * - all present startBlock and endBlock values are valid {@link BlockNumber} values.
 */
const chainsBlockrange = getChainsBlockrange(ponderConfig);

/**
 * Chain Block Refs
 *
 * {@link ChainBlockRefs} for each indexed chain.
 *
 * Note: works as cache for {@link getChainsBlockRefs}.
 */
let chainsBlockRefs = new Map<ChainName, ChainBlockRefs>();

/**
 * Get cached {@link IndexedChainBlockRefs} for indexed chains.
 *
 * Guaranteed to include {@link ChainBlockRefs} for each indexed chain.
 *
 * Note: performs a network request only once and caches response to
 * re-use it for further `getChainsBlockRefs` calls.
 */
async function getChainsBlockRefsCached(
  metrics: PonderMetricsResponse,
  publicClients: Record<ChainName, PublicClient>,
): Promise<Map<ChainName, ChainBlockRefs>> {
  // early-return the cached chain block refs
  if (chainsBlockRefs.size > 0) {
    return chainsBlockRefs;
  }

  chainsBlockRefs = await getChainsBlockRefs(chainIds, chainsBlockrange, metrics, publicClients);

  return chainsBlockRefs;
}

export async function buildOmnichainIndexingStatusSnapshot(
  publicClients: Record<ChainName, PublicClient>,
): Promise<OmnichainIndexingStatusSnapshot> {
  await waitForPonderApplicationToBecomeHealthy;

  let metrics: PonderMetricsResponse;
  let status: PonderStatusResponse;

  try {
    // Get current Ponder metadata (metrics, status)
    const [ponderMetrics, ponderStatus] = await Promise.all([
      ponderClient.metrics(),
      ponderClient.status(),
    ]);

    metrics = ponderMetrics;
    status = ponderStatus;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Could not fetch data from ENSIndexer at ${config.ensIndexerUrl.href}: ${errorMessage}.`,
    );
  }

  // get BlockRefs for relevant blocks
  const chainsBlockRefs = await getChainsBlockRefsCached(metrics, publicClients);

  // create serialized chain indexing snapshot for each indexed chain
  const serializedChainSnapshots = createSerializedChainSnapshots(
    chainIds,
    chainsBlockRefs,
    metrics,
    status,
  );

  const serializedOmnichainSnapshot =
    createSerializedOmnichainIndexingStatusSnapshot(serializedChainSnapshots);

  return deserializeOmnichainIndexingStatusSnapshot(serializedOmnichainSnapshot);
}

export function createCrossChainIndexingStatusSnapshotOmnichain(
  omnichainSnapshot: OmnichainIndexingStatusSnapshot,
  snapshotTime: UnixTimestamp,
): CrossChainIndexingStatusSnapshotOmnichain {
  return {
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: omnichainSnapshot.omnichainIndexingCursor,
    snapshotTime,
    omnichainSnapshot,
  };
}
