import { deserializeBlockNumber, deserializeBlockrange } from "@ensnode/ensnode-sdk";
import { AddressConfig, ChainConfig, CreateConfigReturnType } from "ponder";
import type { BlockNumber, Blockrange, ChainName } from "./types";

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

      if (typeof startBlock !== "undefined") {
        chainStartBlocks.push(deserializeBlockNumber(startBlock));
      }

      if (typeof endBlock !== "undefined") {
        chainEndBlocks.push(deserializeBlockNumber(endBlock));
      }
    }

    // 2. Get the smallest startBlock for the chain.
    const chainMinStartBlock =
      chainStartBlocks.length > 0 ? Math.min(...chainStartBlocks) : undefined;

    // 3. Get the largest endBLock for the chain.
    const chainMaxEndBlock = chainEndBlocks.length > 0 ? Math.min(...chainEndBlocks) : undefined;

    // 4. Enforce invariants

    // Invariant: the indexed chain must have its startBlock defined as number.
    if (typeof chainMinStartBlock === "undefined") {
      throw new Error(
        `No minimum start block found for chain '${chainName}'. Either all contracts, accounts, and block intervals use "latest" (unsupported) or the chain is misconfigured.`,
      );
    }

    // 5. Assign a valid blockrange to the chain

    chainsBlockrange[chainName] = deserializeBlockrange({
      startBlock: chainMinStartBlock,
      endBlock: chainMaxEndBlock,
    });
  }

  return chainsBlockrange;
}
