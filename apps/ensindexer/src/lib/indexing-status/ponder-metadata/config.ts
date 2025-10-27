/**
 * Ponder Metadata: Config
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

import {
  type BlockNumber,
  type Blockrange,
  deserializeBlockNumber,
  deserializeBlockrange,
} from "@ensnode/ensnode-sdk";

/**
 * Chain Name
 *
 * Often use as type for object keys expressing Ponder ideas, such as
 * chain status, or chain metrics.
 */
export type ChainName = string;

/**
 * Ponder config datasource with a flat `chain` value.
 */
export type PonderConfigDatasourceFlat = {
  chain: ChainName;
} & AddressConfig &
  Blockrange;

/**
 * Ponder config datasource with a nested `chain` value.
 */
export type PonderConfigDatasourceNested = {
  chain: Record<ChainName, AddressConfig & Blockrange>;
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
  [chainName: ChainName]: ChainConfig;
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

      if (typeof startBlock === "number") {
        chainStartBlocks.push(deserializeBlockNumber(startBlock));
      }

      if (typeof endBlock === "number") {
        chainEndBlocks.push(deserializeBlockNumber(endBlock));
      }
    }

    // 2. Get the lowest startBlock for the chain.
    const chainLowestStartBlock =
      chainStartBlocks.length > 0 ? Math.min(...chainStartBlocks) : undefined;

    // 3.a) The endBlock can only be set for a chain if and only if every
    //      ponderSource for that chain has its respective `endBlock` defined.
    const isEndBlockForChainAllowed = chainEndBlocks.length === chainStartBlocks.length;

    // 3.b) Get the highest endBLock for the chain.
    let chainHighestEndBlock =
      isEndBlockForChainAllowed && chainEndBlocks.length > 0
        ? Math.max(...chainEndBlocks)
        : undefined;

    // 4. Enforce invariants

    // Invariant: the indexed chain must have its startBlock defined as number.
    if (typeof chainLowestStartBlock === "undefined") {
      throw new Error(
        `No minimum start block found for chain '${chainName}'. Either all contracts, accounts, and block intervals use "latest" (unsupported) or the chain is misconfigured.`,
      );
    }

    // 5. Assign a valid blockrange to the chain

    chainsBlockrange[chainName] = deserializeBlockrange({
      startBlock: chainLowestStartBlock,
      endBlock: chainHighestEndBlock,
    });
  }

  return chainsBlockrange;
}
