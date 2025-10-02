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

import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  type OmnichainIndexingStatusSnapshot,
  type UnixTimestamp,
  deserializeOmnichainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";

import config from "@/config";
import ponderConfig from "@/ponder/config";
import {
  type ChainBlockRefs,
  type ChainName,
  type PonderStatus,
  type PrometheusMetrics,
  type PublicClient,
  createSerializedChainSnapshots,
  createSerializedOmnichainIndexingStatusSnapshot,
  fetchPonderMetrics,
  fetchPonderStatus,
  getChainsBlockRefs,
  getChainsBlockrange,
} from "./ponder-metadata";

/**
 * Names for each indexed chain
 */
const chainNames = Object.keys(ponderConfig.chains) as string[];

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
  metrics: PrometheusMetrics,
  publicClients: Record<ChainName, PublicClient>,
): Promise<Map<ChainName, ChainBlockRefs>> {
  // early-return the cached chain block refs
  if (chainsBlockRefs.size > 0) {
    return chainsBlockRefs;
  }

  chainsBlockRefs = await getChainsBlockRefs(chainNames, chainsBlockrange, metrics, publicClients);

  return chainsBlockRefs;
}

export async function buildOmnichainIndexingStatusSnapshot(
  publicClients: Record<ChainName, PublicClient>,
): Promise<OmnichainIndexingStatusSnapshot> {
  let metrics: PrometheusMetrics;
  let status: PonderStatus;

  try {
    // Get current Ponder metadata (metrics, status)
    const [ponderMetrics, ponderStatus] = await Promise.all([
      fetchPonderMetrics(config.ensIndexerUrl),
      fetchPonderStatus(config.ensIndexerUrl),
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
    chainNames,
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
