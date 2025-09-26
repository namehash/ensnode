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
  type IndexingStatusResponse,
  type UnixTimestamp,
  createProjection,
} from "@ensnode/ensnode-sdk";

import config from "@/config";
import ponderConfig from "@/ponder/config";
import { getUnixTime } from "date-fns";
import {
  type ChainBlockRefs,
  type ChainName,
  type PonderStatus,
  type PrometheusMetrics,
  type PublicClient,
  createOmnichainIndexingSnapshot,
  createSerializedChainSnapshots,
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

/**
 * Build {@link ENSIndexerIndexingStatus} object from Ponder metadata.
 *
 * Note: Ponder metadata must come from an ENSIndexer instance that is
 * guaranteed to provide indexing status data.
 * @see https://ponder.sh/docs/api-reference/ponder/cli#dev
 * @see https://ponder.sh/docs/api-reference/ponder/cli#start
 *
 * @throws error when fetched Ponder Metadata was invalid.
 */
export async function buildIndexingStatus(
  publicClients: Record<ChainName, PublicClient>,
  systemTimestamp: UnixTimestamp,
): Promise<IndexingStatusResponse> {
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
    console.error(`Could not fetch data from ENSIndexer at ${config.ensIndexerUrl.href}`);

    // omnichain indexing snapshot is unavailable
    const snapshot = null;

    return createProjection(snapshot, systemTimestamp);
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

  // TODO: ensure that `systemTimestamp` is the right timestamp to use here.
  const snapshot = createOmnichainIndexingSnapshot(serializedChainSnapshots, systemTimestamp);

  // Get the current system timestamp for the new time
  // Note: this timestamp might be significantly later than `systemTimestamp`
  // passed as `buildIndexingStatus` input param, depending on how long
  // the above operations took to complete (network requests, validation, etc).
  // TODO: ensure that a "now" timestamp is the right timestamp to use here.
  const now = getUnixTime(new Date());

  // create the indexing status response
  return createProjection(snapshot, now);
}
