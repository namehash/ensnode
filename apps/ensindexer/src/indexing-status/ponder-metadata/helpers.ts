import { BlockRef, deserializeBlockNumber, deserializeBlockRef } from "@ensnode/ensnode-sdk";
import { PonderStatus, PrometheusMetrics } from "@ensnode/ponder-metadata";
import { PublicClient } from "viem";
import type {
  BlockNumber,
  Blockrange,
  ChainName,
  PonderBlockRef,
  PonderConfigDatasource,
  PonderConfigDatasourceFlat,
  PonderConfigDatasourceNested,
  PonderConfigType,
} from "./types";

/**
 * Make a {@link PonderBlockRef} object.
 */
export function ponderBlockRef(block: { number: bigint; timestamp: bigint }) {
  return {
    number: Number(block.number),
    timestamp: Number(block.timestamp),
  } satisfies PonderBlockRef;
}

/**
 * Ensure the `ponderDatasource` is {@link PonderConfigDatasourceFlat}.
 */
function isPonderDatasourceFlat(
  ponderDatasource: PonderConfigDatasource,
): ponderDatasource is PonderConfigDatasourceFlat {
  return typeof ponderDatasource.chain === "string";
}

/**
 * Ensure the `ponderDatasource` is {@link PonderConfigDatasourceNested}.
 */
function isPonderDatasourceNested(
  ponderDatasource: PonderConfigDatasource,
): ponderDatasource is PonderConfigDatasourceNested {
  return typeof ponderDatasource.chain === "object";
}

/**
 * Get a {@link Blockrange} for each indexed chain.
 *
 * Invariants:
 * - every chain include a startBlock,
 * - some chains may include an endBlock,
 * - all present startBlock and endBlock values are valid {@link BlockNumber} values.
 */
export function getChainsBlockrange(ponderConfig: PonderConfigType): Record<ChainName, Blockrange> {
  const chainsBlockrange = {} as Record<ChainName, Blockrange>;

  // 0. Get all ponder sources (includes chain + startBlock & endBlock)
  const ponderSources = [
    ...Object.values(ponderConfig.accounts ?? {}),
    ...Object.values(ponderConfig.blocks ?? {}),
    ...Object.values(ponderConfig.contracts ?? {}),
  ] as PonderConfigDatasource[];

  // 1. For every indexed chain
  for (const chainName of Object.keys(ponderConfig.chains)) {
    const chainStartBlocks: BlockNumber[] = [];
    const chainEndBlocks: BlockNumber[] = [];

    // 1.1. For every Ponder source (accounts, blocks, contracts),
    //      extract startBlock number (required) and endBlock number (optional).
    for (const ponderSource of ponderSources) {
      let startBlock: Blockrange["startBlock"];
      let endBlock: Blockrange["endBlock"];

      if (isPonderDatasourceFlat(ponderSource) && ponderSource.chain === chainName) {
        startBlock = ponderSource.startBlock;
        endBlock = ponderSource.endBlock;
      } else if (isPonderDatasourceNested(ponderSource) && ponderSource.chain[chainName]) {
        startBlock = ponderSource.chain[chainName].startBlock;
        endBlock = ponderSource.chain[chainName].endBlock;
      }

      if (typeof startBlock !== "undefined") {
        chainStartBlocks.push(deserializeBlockNumber(startBlock));
      }

      if (typeof endBlock !== "undefined") {
        chainEndBlocks.push(deserializeBlockNumber(endBlock));
      }
    }

    // 2. Get the smallest startBlock for the chain.
    const chainMinStartBlock = chainStartBlocks.length > 0 ? Math.min(...chainStartBlocks) : null;

    // 3. Get the largest endBLock for the chain.
    const chainMaxEndBlock = chainEndBlocks.length > 0 ? Math.min(...chainEndBlocks) : null;

    // 4. Enforce invariants

    // Invariant: the indexed chain must have its startBlock defined as number.
    if (chainMinStartBlock === null) {
      throw new Error(
        `No minimum start block found for chain '${chainName}'. Either all contracts, accounts, and block intervals use "latest" (unsupported) or the chain is misconfigured.`,
      );
    }

    // Invariant: the indexed chain may have its endBlock defined,
    // and if so, the endBlock must be a number grater than startBlock
    if (chainMaxEndBlock !== null && chainMinStartBlock > chainMaxEndBlock) {
      throw new Error(
        `Misconfigured blocks found for chain '${chainName}'. Expected start block to be before of same as endBlock.`,
      );
    }

    // 5. Assign a valid blockrange to the chain
    let chainBlockrange: Blockrange = {
      startBlock: chainMinStartBlock,
    };

    if (chainMaxEndBlock !== null) {
      chainBlockrange.endBlock = chainMaxEndBlock;
    }

    chainsBlockrange[chainName] = chainBlockrange;
  }

  return chainsBlockrange;
}

/**
 * Fetch metrics for requested Ponder instance.
 */
export async function fetchPonderMetrics(ponderAppUrl: URL): Promise<PrometheusMetrics> {
  const ponderMetricsUrl = new URL("/metrics", ponderAppUrl);

  try {
    const metricsText = await fetch(ponderMetricsUrl).then((r) => r.text());
    const metrics = PrometheusMetrics.parse(metricsText);

    return metrics;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder metrics from '${ponderMetricsUrl}' due to: ${errorMessage}`,
    );
  }
}

/**
 * Fetch Status for requested Ponder instance.
 */
export async function fetchPonderStatus(ponderAppUrl: URL): Promise<PonderStatus> {
  const ponderStatusUrl = new URL("/status", ponderAppUrl);

  try {
    const metricsText = await fetch(ponderStatusUrl).then((r) => r.json());
    const metrics = metricsText;

    return metrics;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder status from '${ponderStatusUrl}' due to: ${errorMessage}`,
    );
  }
}

/**
 * Fetch block ref from RPC.
 *
 * @param publicClient for a chain
 * @param blockNumber
 *
 * @throws error if data validation fails.
 */
export async function fetchBlockRef(
  publicClient: PublicClient,
  blockNumber: BlockNumber,
): Promise<BlockRef> {
  const block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
  const blockCreatedAt = new Date(Date.parse(block.timestamp.toString()));

  return deserializeBlockRef({
    createdAt: blockCreatedAt.toISOString(),
    number: Number(block.number),
  });
}
