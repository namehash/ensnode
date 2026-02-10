import config from "@/config";

import { publicClients as ponderPublicClients } from "ponder:api";
import type { PublicClient } from "viem";

import { deserializeChainId } from "@ensnode/ensnode-sdk";
import { type ChainId, PonderClient } from "@ensnode/ponder-sdk";

import type { ChainBlockRefs } from "@/lib/indexing-status/ponder-metadata";
import { fetchChainsBlockRefs } from "@/lib/indexing-status-builder/chain-block-refs";
import { buildChainsBlockrange } from "@/ponder/api/lib/chains-config-blockrange";
import ponderConfig from "@/ponder/config";

/**
 * Cached PublicClient instances for indexed chains, keyed by chain ID.
 */
const publicClients = new Map<ChainId, PublicClient>(
  Object.entries(ponderPublicClients).map(([chainId, publicClient]) => [
    deserializeChainId(chainId),
    publicClient,
  ]),
);

/**
 * Configured block range for indexed chains, based on Ponder Config.
 */
const chainsConfigBlockrange = buildChainsBlockrange(ponderConfig);

/**
 * Indexed chain IDs, based on Ponder Config.
 */
export const indexedChainIds = Array.from(publicClients.keys()) satisfies ChainId[];

/**
 * PonderClient instance for fetching indexing status and metrics from
 * Ponder API.
 */
export const ponderClient = new PonderClient(config.ensIndexerUrl);

/**
 * Cached block references based on Ponder Config and Ponder API metrics,
 * keyed by chain ID.
 *
 * Note: this value is initialized on application startup, and is
 * not expected to change during runtime, as it is based on
 * the configured block range and block references fetched
 * from RPCs at startup.
 */
// TODO: this operation may fail, so it should be wrapped in auto-retry logic.
// pRetry could be used, with a retry strategy that includes
// exponential backoff and jitter, to avoid overwhelming the RPC endpoints
// in case of transient errors or rate limits.
export const cachedChainsBlockRefs = await initializeCachedChainsBlockRefs();

async function initializeCachedChainsBlockRefs(): Promise<Readonly<Map<ChainId, ChainBlockRefs>>> {
  const ponderIndexingMetrics = await ponderClient.metrics();

  const chainsBlockRefs = await fetchChainsBlockRefs(
    indexedChainIds,
    chainsConfigBlockrange,
    ponderIndexingMetrics.chains,
    publicClients,
  );

  if (chainsBlockRefs.size === 0) {
    throw new Error("Failed to fetch chainsBlockRefs: no block refs found");
  }

  return Object.freeze(chainsBlockRefs);
}
