/**
 * Ponder SDK: Config
 *
 * This file is about parsing the object that is exported by `ponder.config.ts`.
 *
 * Each Ponder datasource defined in the aforementioned Ponder Config object
 * can include information about startBlock and endBlock. This is to let
 * Ponder know which blockrange to index for a particular Ponder Datasource.
 *
 * ENSIndexer, however, needs a blockrange for each indexed chain. This is why
 * we examine Ponder Config object, looking for the "lowest" startBlock, and
 * the "highest" endBlock defined for each of the indexed chains.
 */

import type { AddressConfig, ChainConfig, CreateConfigReturnType } from "ponder";

import type { BlockNumber, Blockrange } from "./block-refs";
import type { ChainIdString } from "./chains";

/**
 * Ponder config datasource with a flat `chain` value.
 */
export type PonderConfigDatasourceFlat = {
  chain: ChainIdString;
} & AddressConfig &
  Blockrange;

/**
 * Ponder config datasource with a nested `chain` value.
 */
export type PonderConfigDatasourceNested = {
  chain: Record<ChainIdString, AddressConfig & Blockrange>;
};

/**
 * Ponder config datasource
 */
export type PonderConfigDatasource = PonderConfigDatasourceFlat | PonderConfigDatasourceNested;

/**
 * Ponder config datasource
 */
type PonderConfigDatasources = {
  [datasourceId: string]: PonderConfigDatasource;
};

/**
 * Ponder chains config
 *
 * Chain config for each indexed chain.
 */
type PonderConfigChains = {
  [chainId: ChainIdString]: ChainConfig;
};

/**
 * Ponder Config
 *
 * A utility type describing Ponder Config.
 */
export type PonderConfigType = CreateConfigReturnType<
  PonderConfigChains,
  PonderConfigDatasources,
  PonderConfigDatasources,
  PonderConfigDatasources
>;

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
export function getChainsBlockrange(
  ponderConfig: PonderConfigType,
): Record<ChainIdString, Blockrange> {
  const chainsBlockrange = {} as Record<ChainIdString, Blockrange>;

  // 0. Get all ponder sources (includes chain + startBlock & endBlock)
  const ponderSources = [
    ...Object.values(ponderConfig.accounts ?? {}),
    ...Object.values(ponderConfig.blocks ?? {}),
    ...Object.values(ponderConfig.contracts ?? {}),
  ] as PonderConfigDatasource[];

  // 1. For every indexed chain
  for (const chainId of Object.keys(ponderConfig.chains)) {
    const chainStartBlocks: BlockNumber[] = [];
    const chainEndBlocks: BlockNumber[] = [];

    // 1.1. For every Ponder source (accounts, blocks, contracts),
    //      extract startBlock number (required) and endBlock number (optional).
    for (const ponderSource of ponderSources) {
      let startBlock: Blockrange["startBlock"];
      let endBlock: Blockrange["endBlock"];

      if (isPonderDatasourceFlat(ponderSource) && ponderSource.chain === chainId) {
        startBlock = ponderSource.startBlock;
        endBlock = ponderSource.endBlock;
      } else if (isPonderDatasourceNested(ponderSource) && ponderSource.chain[chainId]) {
        startBlock = ponderSource.chain[chainId].startBlock;
        endBlock = ponderSource.chain[chainId].endBlock;
      }

      if (typeof startBlock === "number" && Number.isInteger(startBlock) && startBlock >= 0) {
        chainStartBlocks.push(startBlock);
      }

      if (typeof endBlock === "number" && Number.isInteger(endBlock) && endBlock >= 0) {
        chainEndBlocks.push(endBlock);
      }
    }

    // 2. Get the lowest startBlock for the chain.
    const chainLowestStartBlock =
      chainStartBlocks.length > 0 ? Math.min(...chainStartBlocks) : undefined;

    // 3.a) The endBlock can only be set for a chain if and only if every
    //      ponderSource for that chain has its respective `endBlock` defined.
    const isEndBlockForChainAllowed = chainEndBlocks.length === chainStartBlocks.length;

    // 3.b) Get the highest endBLock for the chain.
    const chainHighestEndBlock =
      isEndBlockForChainAllowed && chainEndBlocks.length > 0
        ? Math.max(...chainEndBlocks)
        : undefined;

    // 4. Enforce invariants

    // Invariant: the indexed chain must have its startBlock defined as number.
    if (typeof chainLowestStartBlock === "undefined") {
      throw new Error(
        `No minimum start block found for chain '${chainId}'. Either all contracts, accounts, and block intervals use "latest" (unsupported) or the chain is misconfigured.`,
      );
    }

    // Invariant: the startBlock must be before or equal to endBlock (if defined).
    if (
      typeof chainHighestEndBlock !== "undefined" &&
      chainLowestStartBlock > chainHighestEndBlock
    ) {
      throw new Error(
        `For chain '${chainId}', the start block (${chainLowestStartBlock}) must be lower or equal to the end block (${chainHighestEndBlock}).`,
      );
    }

    // 5. Assign a valid blockrange to the chain
    chainsBlockrange[chainId] = {
      startBlock: chainLowestStartBlock,
      endBlock: chainHighestEndBlock,
    };
  }

  return chainsBlockrange;
}
