import { Event } from "ponder:registry";
import DeploymentConfigs, { ENSDeploymentChain } from "@namehash/ens-deployments";
import { merge as tsDeepMerge } from "ts-deepmerge";

export type EventWithArgs<ARGS extends Record<string, unknown> = {}> = Omit<Event, "args"> & {
  args: ARGS;
};

// makes sure start and end blocks are valid for ponder
export const blockConfig = (
  start: number | undefined,
  startBlock: number | undefined,
  end: number | undefined,
): {
  startBlock: number | undefined;
  endBlock: number | undefined;
} => ({
  // START_BLOCK < startBlock < (END_BLOCK || MAX_VALUE)
  startBlock: Math.min(Math.max(start || 0, startBlock || 0), end || Number.MAX_SAFE_INTEGER),
  endBlock: end,
});

/**
 * Gets the RPC endpoint URL for a given chain ID.
 *
 * @param chainId the chain ID to get the RPC URL for
 * @returns the URL of the RPC endpoint
 */
export const rpcEndpointUrl = (chainId: number): string => {
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

export const parseRpcEndpointUrl = (rawValue?: string): string => {
  // no RPC URL provided
  if (!rawValue) {
    // throw an error, as the RPC URL is required and no defaults apply
    throw new Error(`Expected value not set`);
  }

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

type AnyObject = { [key: string]: any };

/**
 * Deep merge two objects recursively.
 * @param target The target object to merge into.
 * @param source The source object to merge from.
 * @returns The merged object.
 */
export function deepMergeRecursive<T extends AnyObject, U extends AnyObject>(
  target: T,
  source: U,
): T & U {
  return tsDeepMerge(target, source) as T & U;
}

/**
 * Gets the ENS Deployment Chain, defaulting to mainnet.
 *
 * @throws if not a valid deployment chain value
 */
export const ensDeploymentChain = (): ENSDeploymentChain => {
  const value = process.env.ENS_DEPLOYMENT_CHAIN;
  if (!value) return "mainnet";

  const validValues = Object.keys(DeploymentConfigs);
  if (!validValues.includes(value)) {
    throw new Error(`Error: ENS_DEPLOYMENT_CHAIN must be one of ${validValues.join(" | ")}`);
  }

  return value as ENSDeploymentChain;
};
