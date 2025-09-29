import type { RpcConfigEnvironment } from "@/config/types";
import { type ChainIdString, deserializeChainId } from "@ensnode/ensnode-sdk";

export const DEFAULT_ENSADMIN_URL = new URL("https://admin.ensnode.io");
export const DEFAULT_PORT = 42069;
export const DEFAULT_SUBGRAPH_COMPAT = false;

/**
 * Extracts dynamic chain configuration from environment variables.
 *
 * This function scans all environment variables for keys matching the pattern
 * "RPC_URL_{chainId}", where {chainId} must be a valid ChainId (e.g., "1", "10", "8453").
 *
 * This function returns raw RpcConfigEnvironment values which are not yet parsed or validated.
 */
export function getRpcConfigsFromEnv(): Record<ChainIdString, RpcConfigEnvironment> {
  const rpcConfigs: Record<ChainIdString, RpcConfigEnvironment> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    // Only match keys like "RPC_URL_1", "RPC_URL_10", etc. (digits only after the underscore)
    const match = key.match(/^RPC_URL_(\d+)$/);

    // If the key after `RPC_URL_` is not a number or the value is empty, skip
    if (!match || !value) return;

    // The regex above ensures that only numeric chain IDs are matched.
    // - Example: "RPC_URL_1" will match and extract "1" as the chainId.
    // - Example: "RPC_URL_SOMESTRING" will NOT match, so no risk of NaN from non-numeric IDs.
    const maybeChainId = match[1];

    // Invariant: maybeChainId is a string value
    if (typeof maybeChainId !== "string") {
      return;
    }

    try {
      const chainId = deserializeChainId(maybeChainId);

      rpcConfigs[`${chainId}`] = value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Could not parse chain ID from '${key}' environment variable: ${errorMessage}.`,
      );
    }
  });

  return rpcConfigs;
}
