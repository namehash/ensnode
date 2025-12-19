/**
 * This file is required to build the ENSIndexerConfig object.
 * No dependencies in this file can import from `@/config` path
 * as the config object will not be ready yet.
 */

import type { Event } from "ponder:registry";
import type { ChainConfig } from "ponder";
import type { Address } from "viem";

import type { ContractConfig } from "@ensnode/datasources";
import type { Blockrange, ChainId } from "@ensnode/ensnode-sdk";

import type { ENSIndexerConfig } from "@/config/types";

export type EventWithArgs<ARGS extends Record<string, unknown> = {}> = Omit<Event, "args"> & {
  args: ARGS;
};

/**
 * Given a contract's block range, returns a block range describing a start and end block
 * that maintains validity within the global blockrange. The returned start block will always be
 * defined, but if no end block is specified, the returned end block will be undefined.
 *
 * @param globalBlockrange a global block range across all indexed contracts
 * @param contractBlockrange the preferred blockrange for the given contract
 * @returns the start and end blocks, constrained to the provided `start` and `end`
 *  i.e. (globalStartBlock || 0) <= (contractStartBlock || 0) <= (contractEndBlock if specificed) <= (globalEndBlock if specificed)
 */
export const constrainBlockrange = (
  globalBlockrange: Blockrange,
  contractBlockrange: Blockrange,
): Blockrange => {
  const highestStartBlock = Math.max(
    globalBlockrange.startBlock || 0,
    contractBlockrange.startBlock || 0,
  );

  const lowestEndBlock = Math.min(
    globalBlockrange.endBlock || Infinity,
    contractBlockrange.endBlock || Infinity,
  );

  const isEndConstrained = Number.isFinite(lowestEndBlock);

  return {
    startBlock: isEndConstrained ? Math.min(highestStartBlock, lowestEndBlock) : highestStartBlock,
    endBlock: isEndConstrained ? lowestEndBlock : undefined,
  };
};

/**
/**
 * Builds a ponder#Config["chains"] for a single, specific chain in the context of the ENSIndexerConfig.
 *
 * @param rpcConfigs - The RPC configuration object from ENSIndexerConfig, keyed by chain ID.
 * @param chainId - The numeric chain ID for which to build the chain config.
 * @returns a ponder#Config["chains"]
 */
export function chainsConnectionConfig(
  rpcConfigs: ENSIndexerConfig["rpcConfigs"],
  chainId: ChainId,
) {
  const rpcConfig = rpcConfigs.get(chainId);

  if (!rpcConfig) {
    throw new Error(
      `chainsConnectionConfig called for chain id ${chainId} but no associated rpcConfig is available. rpcConfig specifies the following chain ids: [${Object.keys(rpcConfigs).join(", ")}].`,
    );
  }

  return {
    [chainId.toString()]: {
      id: chainId,
      rpc: rpcConfig.httpRPCs.map((httpRPC) => httpRPC.toString()),
      ws: rpcConfig.websocketRPC?.toString(),
      // NOTE: disable cache on local chains (e.g. Anvil, Ganache)
      ...((chainId === 31337 || chainId === 1337) && { disableCache: true }),
    } satisfies ChainConfig,
  };
}

/**
 * Builds a `ponder#ContractConfig['chain']` given a contract's config, constraining the contract's
 * indexing range by the globally configured blockrange.
 *
 * @param {Blockrange} globalBlockrange
 * @param {number} chainId
 * @param {ContractConfig} contractConfig
 *
 * @returns network configuration based on the contract
 */
export function chainConfigForContract<CONTRACT_CONFIG extends ContractConfig>(
  globalBlockrange: Blockrange,
  chainId: number,
  contractConfig: CONTRACT_CONFIG,
) {
  const contractBlockrange = {
    startBlock: contractConfig.startBlock,
    endBlock: contractConfig.endBlock,
  } satisfies Blockrange;

  // Ponder will index the contract in perpetuity if endBlock is `undefined`
  const { startBlock, endBlock } = constrainBlockrange(globalBlockrange, contractBlockrange);

  return {
    [chainId.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      startBlock,
      endBlock,
    },
  };
}

/**
 * Merges a set of ContractConfigs representing contracts at specific addresses on the same chain.
 * Uses the lowest startBlock to ensure all events are indexed.
 */
export function mergeContractConfigs<CONTRACTS extends ContractConfig[]>(contracts: CONTRACTS) {
  if (contracts.length === 0) throw new Error("Cannot merge 0 ContractConfigs");

  const addresses = contracts
    .map((contract) => contract.address)
    .filter((address): address is Address => !!address);

  const startBlocks = contracts.map((contract) => contract.startBlock);

  return {
    // just use the first's ABI, they're all identical, no need to mergeAbis
    // biome-ignore lint/style/noNonNullAssertion: length check above
    abi: contracts[0]!.abi,
    startBlock: Math.min(...startBlocks),
    address: addresses,
  };
}
