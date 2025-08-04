import type { Event } from "ponder:registry";

import type { ChainConfig } from "ponder";
import { Address, PublicClient } from "viem";
import * as z from "zod/v4";

import { ContractConfig } from "@ensnode/datasources";
import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";
import type { BlockInfo, PonderStatus } from "@ensnode/ponder-metadata";

import { ENSIndexerConfig } from "@/config/types";
import { Blockrange } from "@/lib/types";

export type EventWithArgs<ARGS extends Record<string, unknown> = {}> = Omit<Event, "args"> & {
  args: ARGS;
};

/**
 * Given a contract's start block, returns a block range describing a start and end block
 * that maintains validity within the global blockrange. The returned start block will always be
 * defined, but if no end block is specified, the returned end block will be undefined.
 *
 * @param blockrange a Blockrange
 * @param contractStartBlock the preferred start block for the given contract, defaulting to 0
 * @returns the start and end blocks, contrained to the provided `start` and `end`
 *  i.e. (startBlock || 0) <= (contractStartBlock || 0) <= (endBlock if specificed)
 */
export const constrainBlockrange = (
  blockrange: Blockrange,
  contractStartBlock: number | undefined = 0,
): Blockrange => {
  const { startBlock, endBlock } = blockrange;

  const isEndConstrained = endBlock !== undefined;
  const concreteStartBlock = Math.max(startBlock || 0, contractStartBlock);

  return {
    startBlock: isEndConstrained ? Math.min(concreteStartBlock, endBlock) : concreteStartBlock,
    endBlock,
  };
};

/**
 * Creates a function that fetches ENSRainbow version information.
 *
 * @returns A function that fetches ENSRainbow version information
 */
export const createEnsRainbowVersionFetcher = (
  endpointUrl: ENSIndexerConfig["ensRainbowEndpointUrl"],
) => {
  const client = new EnsRainbowApiClient({ endpointUrl: new URL(endpointUrl) });

  return async () => {
    try {
      const versionResponse = await client.version();
      return {
        version: versionResponse.versionInfo.version,
        schema_version: versionResponse.versionInfo.schema_version,
      };
    } catch (error) {
      console.error("Failed to fetch ENSRainbow version", error);
      return {
        version: "unknown",
        schema_version: 0,
      };
    }
  };
};

/**
 * Creates a Prometheus metrics fetcher for the Ponder application.
 *
 * It's a workaround for the lack of an internal API allowing to access
 * Prometheus metrics for the Ponder application.
 *
 * @param ponderApplicationPort the port the Ponder application is served at
 * @returns fetcher function
 */
export function createPrometheusMetricsFetcher(
  ponderApplicationPort: number,
): () => Promise<string> {
  /**
   * Fetches the Prometheus metrics from the Ponder application endpoint.
   * @returns Prometheus metrics as a text string
   */
  return async function fetchPrometheusMetrics(): Promise<string> {
    const response = await fetch(`http://localhost:${ponderApplicationPort}/metrics`);

    return response.text();
  };
}

/**
 * Ponder Data Schemas
 *
 * These schemas allow data validation with Zod.
 */
const PonderDataSchema = {
  get Block() {
    return z.object({
      number: z.number().int().min(1),
      timestamp: z.number().int().min(1),
    });
  },

  get ChainId() {
    return z.number().int().min(1);
  },

  get Status() {
    return z.record(
      z.string().transform(Number).pipe(PonderDataSchema.ChainId),
      z.object({
        id: PonderDataSchema.ChainId,
        block: PonderDataSchema.Block,
      }),
    );
  },
};

/**
 * Creates Ponder Status fetcher for the Ponder application.
 *
 * It's a workaround for the lack of an internal API allowing to access
 * Ponder Status metrics for the Ponder application.
 *
 * @param ponderApplicationPort the port the Ponder application is served at
 * @returns fetcher function
 */
export function createPonderStatusFetcher(
  ponderApplicationPort: number,
): () => Promise<PonderStatus> {
  /**
   * Fetches the Ponder Ponder status from the Ponder application endpoint.
   * @returns Parsed Ponder Status object.
   */
  return async function fetchPonderStatus() {
    const response = await fetch(`http://localhost:${ponderApplicationPort}/status`);
    const responseData = await response.json();

    return PonderDataSchema.Status.parse(responseData) satisfies PonderStatus;
  };
}

/**
 * Ponder contracts configuration including block range.
 */
interface PonderContractBlockConfig {
  contracts: Record<
    string,
    {
      chain: Record<string, { id: ChainConfig["id"] } & Blockrange>;
    }
  >;
}

/**
 * Creates a first block to index fetcher for the given ponder configuration.
 */
export function createFirstBlockToIndexByChainIdFetcher(
  ponderConfig: Promise<PonderContractBlockConfig>,
) {
  /**
   * Fetches the first block to index for the requested chain ID.
   *
   * @param chainId the chain ID to get the first block to index for
   * @param publicClient the public client to fetch the block from
   *
   * @returns {Promise<BlockInfo>} the first block to index for the requested chain ID
   * @throws if the start block number is not found for the chain ID
   * @throws if the block is not available on the network
   */
  return async function fetchFirstBlockToIndexByChainId(
    chainId: number,
    publicClient: PublicClient,
  ): Promise<BlockInfo> {
    const startBlockNumbers: Record<number, number> =
      await createStartBlockByChainIdMap(ponderConfig);
    const startBlockNumberForChainId = startBlockNumbers[chainId];

    // each chain should have a start block number
    if (typeof startBlockNumberForChainId !== "number") {
      // throw an error if the start block number is not found for the chain ID
      throw new Error(`No start block number found for chain ID ${chainId}`);
    }

    if (startBlockNumberForChainId < 0) {
      // throw an error if the start block number is invalid block number
      throw new Error(
        `Start block number "${startBlockNumberForChainId}" for chain ID ${chainId} must be a non-negative integer`,
      );
    }

    const block = await publicClient.getBlock({
      blockNumber: BigInt(startBlockNumberForChainId),
    });

    // the decided start block number should be available on the network
    if (!block) {
      // throw an error if the block is not available
      throw Error(`Failed to fetch block ${startBlockNumberForChainId} for chainId ${chainId}`);
    }

    // otherwise, return the start block info
    return {
      number: Number(block.number),
      timestamp: Number(block.timestamp),
    };
  };
}

/**
 * Get start block number for each chain ID.
 *
 * @returns start block number for each chain ID.
 * @example
 * ```ts
 * const ponderConfig = {
 *  contracts: {
 *   "subgraph/Registrar": {
 *     chain: {
 *       "1": { id: 1, startBlock: 444_444_444 }
 *      }
 *   },
 *   "subgraph/Registry": {
 *     chain: {
 *       "1": { id: 1, startBlock: 444_444_333 }
 *      }
 *   },
 *   "basenames/Registrar": {
 *     chain: {
 *       "8453": { id: 8453, startBlock: 1_799_433 }
 *     }
 *   },
 *   "basenames/Registry": {
 *     chain: {
 *       "8453": { id: 8453, startBlock: 1_799_430 }
 *     }
 *   }
 * };
 *
 * const startBlockNumbers = await createStartBlockByChainIdMap(ponderConfig);
 *
 * console.log(startBlockNumbers);
 *
 * // Output:
 * // {
 * //   1: 444_444_333,
 * //   8453: 1_799_430
 * // }
 * ```
 */
export async function createStartBlockByChainIdMap(
  ponderConfig: Promise<PonderContractBlockConfig>,
): Promise<Record<number, number>> {
  const contractsConfig = Object.values((await ponderConfig).contracts);

  const startBlockNumbers: Record<number, number> = {};

  // go through each contract configuration
  for (const contractConfig of contractsConfig) {
    // and then through each chain configuration for the contract
    for (const contractChainConfig of Object.values(contractConfig.chain)) {
      // map string to number
      const chainId = contractChainConfig.id;
      const startBlock = contractChainConfig.startBlock || 0;

      // update the start block number for the chain ID if it's lower than the current one
      if (!startBlockNumbers[chainId] || startBlock < startBlockNumbers[chainId]) {
        startBlockNumbers[chainId] = startBlock;
      }
    }
  }

  return startBlockNumbers;
}

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
  chainId: number,
) {
  const rpcConfig = rpcConfigs[chainId];

  if (!rpcConfig) {
    throw new Error(
      `chainsConnectionConfig called for chain id ${chainId} but no associated rpcConfig is available. rpcConfig specifies the following chain ids: [${Object.keys(rpcConfigs).join(", ")}].`,
    );
  }

  return {
    [chainId.toString()]: {
      id: chainId,
      rpc: rpcConfig.url.href,
      maxRequestsPerSecond: rpcConfig.maxRequestsPerSecond,
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
  // Ponder will index the contract in perpetuity if endBlock is `undefined`
  const { startBlock, endBlock } = constrainBlockrange(globalBlockrange, contractConfig.startBlock);

  return {
    [chainId.toString()]: {
      address: contractConfig.address, // provide per-network address if available
      id: chainId,
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
    abi: contracts[0]!.abi,
    startBlock: Math.min(...startBlocks),
    address: addresses,
  };
}
