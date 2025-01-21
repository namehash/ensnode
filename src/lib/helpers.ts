import type { ContractConfig } from "ponder";
import { merge as tsDeepMerge } from "ts-deepmerge";

export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;

export const bigintMax = (...args: bigint[]): bigint => args.reduce((a, b) => (a > b ? a : b));

// makes sure start and end blocks are valid for ponder
export const blockConfig = (
  start: number | undefined,
  startBlock: number,
  end: number | undefined,
): Pick<ContractConfig, "startBlock" | "endBlock"> => ({
  // START_BLOCK < startBlock < (END_BLOCK || MAX_VALUE)
  startBlock: Math.min(Math.max(start || 0, startBlock), end || Number.MAX_SAFE_INTEGER),
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
    throw new Error(`Environment variable parse error: '${envVarName}' was ${e.message}`);
  }
};

export const parseRpcEndpointUrl = (rawValue?: string): string => {
  // no RPC URL provided
  if (!rawValue) {
    // throw an error, as the RPC URL is required and no defaults apply
    throw new Error(`Missing value`);
  }

  try {
    return new URL(rawValue).toString();
  } catch (e) {
    throw new Error(`Invalid URL '${rawValue}'`);
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
    throw new Error(`Environment variable parse error: '${envVarName}' was ${e.message}`);
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
    throw new Error(`Not a number '${rawValue}'`);
  }

  if (parsedValue <= 0) {
    throw new Error(`Not a positive integer '${rawValue}'`);
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
