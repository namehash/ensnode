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

// default rate limit for request per second to RPC endpoints
const DEFAULT_RPC_RATE_LIMIT = 50;

/**
 * Creates the RPC request rate limit for a given chain ID.
 *
 * @param chainId the chain ID to read the rate limit for from the environment variable
 * @returns the rate limit in requests per second (rps)
 */
export const rpcRequestRateLimit = (chainId: number): number => {
  /**
   * Reads the RPC request rate limit for a given chain ID from the environment
   * variable: RPC_REQUEST_RATE_LIMIT_{chainId}.
   * For example, for Ethereum mainnet the chainId is `1`, so the env variable
   * can be set as `RPC_REQUEST_RATE_LIMIT_1=400`. This will set the rate limit
   * for the mainnet (chainId=1) to 400 requests per second.
   */
  const envVarName = `RPC_REQUEST_RATE_LIMIT_${chainId}`;

  // no rate limit provided in env var
  if (!process.env[envVarName]) {
    // apply default rate limit value
    return DEFAULT_RPC_RATE_LIMIT;
  }

  // otherwise
  try {
    // parse the rate limit value from the environment variable
    return parseInt(process.env[envVarName], 10);
  } catch (e) {
    throw new Error(`Invalid ${envVarName} value: ${e}. Please provide a valid number.`);
  }
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
