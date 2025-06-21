import type { Event } from "ponder:registry";
import { PublicClient } from "viem";

import config from "@/config";
import { Blockrange } from "@/lib/types";
import { getDatasources } from "@ensnode/datasources";
import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";
import type { BlockInfo } from "@ensnode/ponder-metadata";

export type EventWithArgs<ARGS extends Record<string, unknown> = {}> = Omit<Event, "args"> & {
  args: ARGS;
};

/**
 * Given a contract's start block, returns a block range describing a start and end block
 * that maintains validity within the global blockrange. The returned start block will always be
 * defined, but if no end block is specified, the returned end block will be undefined, indicating
 * that ponder should index the contract in perpetuity.
 *
 * @param contractStartBlock the preferred start block for the given contract, defaulting to 0
 * @returns the start and end blocks, contrained to the provided `start` and `end`
 *  i.e. (startBlock || 0) <= (contractStartBlock || 0) <= (endBlock if specificed)
 */
export const constrainContractBlockrange = (
  contractStartBlock: number | undefined = 0,
): Blockrange => {
  const { startBlock, endBlock } = config.globalBlockrange;

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
export const createEnsRainbowVersionFetcher = () => {
  const client = new EnsRainbowApiClient({
    endpointUrl: new URL(config.ensRainbowEndpointUrl),
  });

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
 * Get the chain id for the root chain datasource on the selected ENS namespace.
 *
 * @returns the chain ID
 */
export const getENSRootChainId = () => getDatasources(config.namespace).ensroot.chain.id;

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
   * @param {number} ponderApplicationPort
   * @returns Prometheus metrics as a text string
   */
  return async function fetchPrometheusMetrics(): Promise<string> {
    const response = await fetch(`http://localhost:${ponderApplicationPort}/metrics`);

    return response.text();
  };
}

/**
 * Creates a first block to index fetcher for the given ponder configuration.
 */
export function createFirstBlockToIndexByChainIdFetcher(
  ponderConfig: Promise<PartialPonderConfig>,
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
 * Partial configuration for the Ponder app including contracts configuration.
 */
interface PartialPonderConfig {
  // contracts configuration
  contracts: Record<string, PartialPonderContractConfig>;
}

/**
 * Partial configuration for the Ponder app including specific contract's networks configuration.
 */
interface PartialPonderContractConfig<ChainId extends number = number> {
  // network configuration for each chain ID
  network: Record<ChainId, PonderNetworkConfig>;
}

/**
 * Partial network configuration for a contract configuration.
 */
interface PonderNetworkConfig {
  // start block number for the network
  startBlock?: number;
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
 *     network: {
 *       "1": { startBlock: 444_444_444 }
 *      }
 *   },
 *   "subgraph/Registry": {
 *     network: {
 *       "1": { startBlock: 444_444_333 }
 *      }
 *   },
 *   "basenames/Registrar": {
 *     network: {
 *       "8453": { startBlock: 1_799_433 }
 *     }
 *   },
 *   "basenames/Registry": {
 *     network: {
 *       "8453": { startBlock: 1_799_430 }
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
  ponderConfig: Promise<PartialPonderConfig>,
): Promise<Record<number, number>> {
  const config = Object.values((await ponderConfig).contracts);

  const startBlockNumbers: Record<number, number> = {};

  // go through each contract configuration
  for (const contractConfig of config) {
    // and then through each network configuration for the contract
    for (const contractNetworkConfig of Object.entries(contractConfig.network)) {
      // map string to number
      const chainId = Number(contractNetworkConfig[0]);
      const startBlock = contractNetworkConfig[1].startBlock || 0;

      // update the start block number for the chain ID if it's lower than the current one
      if (!startBlockNumbers[chainId] || startBlock < startBlockNumbers[chainId]) {
        startBlockNumbers[chainId] = startBlock;
      }
    }
  }

  return startBlockNumbers;
}
