import type { Event } from "ponder:registry";
import { PublicClient } from "viem";

import { Blockrange } from "@/lib/types";
import { type ENSDeploymentChain, ENSDeployments } from "@ensnode/ens-deployments";
import { DEFAULT_ENSRAINBOW_URL, EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";
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
  const { startBlock, endBlock } = getGlobalBlockrange();

  const isEndConstrained = endBlock !== undefined;
  const concreteStartBlock = Math.max(startBlock || 0, contractStartBlock);

  return {
    startBlock: isEndConstrained ? Math.min(concreteStartBlock, endBlock) : concreteStartBlock,
    endBlock,
  };
};

/**
 * Gets the global block range configured by the START_BLOCK and END_BLOCK environment variables,
 * validating the range if specified.
 *
 * @returns blockrange of startBlock and endBlock
 */
export const getGlobalBlockrange = (): Blockrange => {
  const startBlock = parseBlockheightEnvVar("START_BLOCK");
  const endBlock = parseBlockheightEnvVar("END_BLOCK");

  if (startBlock !== undefined && endBlock !== undefined) {
    // the global range, if defined, must be start <= end
    if (!(startBlock <= endBlock)) {
      throw new Error(`END_BLOCK (${endBlock}) must be >= START_BLOCK (${startBlock})`);
    }
  }

  return { startBlock, endBlock };
};

/**
 * Parses an env var into a blockheight for ponder.
 *
 * @param envVarName Name of the environment variable to parse
 * @returns The parsed block number if valid, undefined otherwise
 */
const parseBlockheightEnvVar = (envVarName: "START_BLOCK" | "END_BLOCK"): number | undefined => {
  const envVarValue = process.env[envVarName];
  if (!envVarValue) return undefined;
  const num = parseInt(envVarValue, 10);
  if (isNaN(num) || num < 0) throw new Error(`if specified, ${envVarName} must be a number >= 0`);
  return num;
};

/**
 * Gets the RPC endpoint URL for a given chain ID.
 *
 * @param chainId the chain ID to get the RPC URL for
 * @returns the URL of the RPC endpoint
 */
export const rpcEndpointUrl = (chainId: number): string | undefined => {
  /**
   * Reads the RPC URL for a given chain ID from the environment variable:
   * RPC_URL_{chainId}. For example, for Ethereum mainnet the chainId is `1`,
   * so the env variable can be set as `RPC_URL_1=https://eth.drpc.org`.
   */
  const envVarName = `RPC_URL_${chainId}`;
  const envVarValue = process.env[envVarName];

  try {
    return parseRpcEndpointUrl(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

export const parseRpcEndpointUrl = (rawValue?: string): string | undefined => {
  // no RPC URL provided, default to undefined
  if (!rawValue) return undefined;

  try {
    return new URL(rawValue).toString();
  } catch (e) {
    throw new Error(`'${rawValue}' is not a valid URL`);
  }
};

// default request per second rate limit for RPC endpoints
export const DEFAULT_RPC_RATE_LIMIT = 50;

/**
 * Gets the RPC request rate limit for a given chain ID.
 *
 * @param chainId the chain ID to get the rate limit for
 * @returns the rate limit in requests per second (rps)
 */
export const rpcMaxRequestsPerSecond = (chainId: number): number => {
  /**
   * Reads the RPC request rate limit for a given chain ID from the environment
   * variable: RPC_REQUEST_RATE_LIMIT_{chainId}.
   * For example, for Ethereum mainnet the chainId is `1`, so the env variable
   * can be set as `RPC_REQUEST_RATE_LIMIT_1=400`. This will set the rate limit
   * for the mainnet (chainId=1) to 400 requests per second.
   */
  const envVarName = `RPC_REQUEST_RATE_LIMIT_${chainId}`;
  const envVarValue = process.env[envVarName];

  try {
    return parseRpcMaxRequestsPerSecond(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

export const parseRpcMaxRequestsPerSecond = (rawValue?: string): number => {
  // no rate limit provided
  if (!rawValue) {
    // apply default rate limit value
    return DEFAULT_RPC_RATE_LIMIT;
  }

  // otherwise
  // parse the provided raw value
  const parsedValue = parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`'${rawValue}' is not a number`);
  }

  if (parsedValue <= 0) {
    throw new Error(`'${rawValue}' is not a positive integer`);
  }

  return parsedValue;
};

/**
 * Gets the ENSRainbow API endpoint URL.
 *
 * @returns the ENSRainbow API endpoint URL
 */
export const ensRainbowEndpointUrl = (): string => {
  const envVarName = "ENSRAINBOW_URL";
  const envVarValue = process.env[envVarName];

  try {
    return parseEnsRainbowEndpointUrl(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

export const parseEnsRainbowEndpointUrl = (rawValue?: string): string => {
  // no ENSRainbow URL provided
  if (!rawValue) {
    // apply default URL value
    return DEFAULT_ENSRAINBOW_URL;
  }

  try {
    return new URL(rawValue).toString();
  } catch (e) {
    throw new Error(`'${rawValue}' is not a valid URL`);
  }
};

/**
 * Creates a function that fetches ENSRainbow version information.
 *
 * @returns A function that fetches ENSRainbow version information
 */
export const createEnsRainbowVersionFetcher = () => {
  const client = new EnsRainbowApiClient({
    endpointUrl: new URL(ensRainbowEndpointUrl()),
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
 * Gets the ENS Deployment Chain, defaulting to mainnet.
 *
 * @throws if not a valid deployment chain value
 */
export const getEnsDeploymentChain = (): ENSDeploymentChain => {
  const value = process.env.ENS_DEPLOYMENT_CHAIN;
  if (!value) return "mainnet";

  const validValues = Object.keys(ENSDeployments);
  if (!validValues.includes(value)) {
    throw new Error(`Error: ENS_DEPLOYMENT_CHAIN must be one of ${validValues.join(" | ")}`);
  }

  return value as ENSDeploymentChain;
};

/**
 * Get the ENSDeployment chain ID.
 *
 * @returns the ENSDeployment chain ID
 */
export const getEnsDeploymentChainId = (): number => {
  return ENSDeployments[getEnsDeploymentChain()].root.chain.id;
};

/**
 * Get the ENSNode public URL.
 *
 * @returns the ENSNode public URL
 */
export const ensNodePublicUrl = (): string => {
  const envVarName = "ENSNODE_PUBLIC_URL";
  const envVarValue = process.env[envVarName];

  try {
    return parseUrl(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";

/**
 * Get the ENSAdmin URL.
 *
 * @returns the ENSAdmin URL
 */
export const ensAdminUrl = (): string => {
  const envVarName = "ENSADMIN_URL";
  const envVarValue = process.env[envVarName];

  if (!envVarValue) {
    return DEFAULT_ENSADMIN_URL;
  }

  try {
    return parseUrl(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

export const parseUrl = (rawValue?: string): string => {
  if (!rawValue) {
    throw new Error(`Expected value not set`);
  }

  try {
    return new URL(rawValue).toString();
  } catch (e) {
    throw new Error(`'${rawValue}' is not a valid URL`);
  }
};

const DEFAULT_DATABASE_SCHEMA = "public";

/**
 * Get the database schema name used by Ponder indexer.
 *
 * @returns the database schema name used by Ponder indexer
 */
export const ponderDatabaseSchema = (): string => {
  const envVarName = "DATABASE_SCHEMA";
  const envVarValue = process.env[envVarName];

  return parsePonderDatabaseSchema(envVarValue);
};

export const parsePonderDatabaseSchema = (rawValue?: string): string => {
  if (!rawValue) {
    return DEFAULT_DATABASE_SCHEMA;
  }
  return rawValue;
};

export const getRequestedPluginNames = (): Array<string> => {
  const envVarName = "ACTIVE_PLUGINS";
  const envVarValue = process.env[envVarName];

  try {
    return parseRequestedPluginNames(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

export const parseRequestedPluginNames = (rawValue?: string): Array<string> => {
  if (!rawValue) throw new Error("Expected value not set");
  const value = rawValue.split(",");
  if (value.length === 0) {
    throw new Error("ACTIVE_PLUGINS expected at least one activated plugin.");
  }
  return value;
};

export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;

/**
 * Feature flag that determines whether the indexer should attempt healing
 * reverse addresses.
 *
 * @returns decision whether to heal reverse addresses
 */
export const healReverseAddresses = (): boolean => {
  const rawValue = process.env.HEAL_REVERSE_ADDRESSES;
  if (!rawValue) return DEFAULT_HEAL_REVERSE_ADDRESSES;
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;

  throw new Error(
    `Error parsing environment variable 'HEAL_REVERSE_ADDRESS': ${rawValue}' is not a valid value. Expected 'true' or 'false'.`,
  );
};

/** Get the Ponder application port */
export const ponderPort = (): number => {
  const envVarName = "PORT";
  const envVarValue = process.env[envVarName];

  try {
    return parsePonderPort(envVarValue);
  } catch (e: any) {
    throw new Error(`Error parsing environment variable '${envVarName}': ${e.message}.`);
  }
};

/** Parse the Ponder application port */
export const parsePonderPort = (rawValue?: string): number => {
  if (!rawValue) {
    return 42069;
  }

  const parsedValue = parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`'${rawValue}' is not a number`);
  }

  if (parsedValue <= 0) {
    throw new Error(`'${rawValue}' is not a natural number`);
  }

  return parsedValue;
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
