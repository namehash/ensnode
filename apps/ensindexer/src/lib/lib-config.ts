import type { RpcConfigEnvironment } from "@/config/types";

// Default rate limit for RPC services
// Public (rate limited) RPC endpoints will not provide acceptable performance.
export const DEFAULT_ENSADMIN_URL = new URL("https://admin.ensnode.io");
export const DEFAULT_PORT = 42069;
export const DEFAULT_SUBGRAPH_COMPAT = false;

/**
 * Extracts dynamic chain configuration from environment variables.
 *
 * This function scans all environment variables for keys matching the pattern
 * "RPC_URL_{chainId}", where {chainId} must be a valid chainId (e.g., "1", "10", "8453").
 *
 * This function returns raw RpcConfigEnvironment values which are not yet parsed or validated.
 */
export function getRpcConfigsFromEnv(): Record<number, RpcConfigEnvironment> {
  const rpcConfigs: Record<number, RpcConfigEnvironment> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    // Only match keys like "RPC_URL_1", "RPC_URL_10", etc. (digits only after the underscore)
    const match = key.match(/^RPC_URL_(\d+)$/);

    // If the key after `RPC_URL_` is not a number or the value is empty, skip
    if (!match || !value) return;

    // The regex above ensures that only numeric chain IDs are matched.
    // - Example: "RPC_URL_1" will match and extract "1" as the chainId.
    // - Example: "RPC_URL_SOMESTRING" will NOT match, so no risk of NaN from non-numeric IDs.
    const chainId = Number(match[1]);

    if (Number.isNaN(chainId)) throw new Error(`${key} parsed chainId was NaN!`);

    rpcConfigs[chainId] = value;
  });

  return rpcConfigs;
}
