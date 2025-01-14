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
 * Reads the RPC request rate limit for a given chain ID from the environment
 * variable that follow naming convention: RPC_REQUEST_RATE_LIMIT_{chianId}.
 * For example, for Ethereum mainnet the chainId is `1`, so the env variable
 * can be set as `RPC_REQUEST_RATE_LIMIT_1=400`. This will set the rate limit
 * for the mainnet (chainId=1) to 400 requests per second. If the environment
 * variable is not set for the requested chain ID, the default rate limit is 50 rps.
 *
 * The rate limit is the maximum number of requests per second that can be made
 * to the RPC endpoint. For public RPC endpoints, it is recommended to set
 * a rate limit to low values (i.e. below 30 rps) to avoid being rate limited.
 * For private RPC endpoints, the rate limit can be set to higher values,
 * depending on the capacity of the endpoint. For example, 500 rps.
 *
 * @param chainId the chain ID to read the rate limit for from the environment variable
 * @returns the rate limit in requests per second (rps)
 */
export const rpcRequestRateLimit = (chainId: number): number | undefined => {
  if (typeof process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`] === "string") {
    try {
      return parseInt(process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`]!, 10);
    } catch (e) {
      throw new Error(
        `Invalid RPC_REQUEST_RATE_LIMIT_${chainId} value: ${e}. Please provide a valid number.`,
      );
    }
  }

  return 50;
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
