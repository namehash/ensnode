import { ENSIndexerConfigSchema } from "@/config/config.schema";
import { ENSIndexerConfig, ENSIndexerEnvironment, RpcConfigEnvironment } from "@/config/types";
import { prettifyError } from "zod/v4";

/**
 * Extracts dynamic chain configuration from environment variables.
 *
 * This function scans all environment variables for keys matching the pattern
 * "RPC_URL_{chainId}", where {chainId} must be a string of digits (e.g., "1", "10", "8453").
 *
 * It then looks for matching environment variables for the rate limit of requests per second
 * for the given chain, using the pattern "RPC_REQUEST_RATE_LIMIT_{chainId}".
 *
 * This function returns a raw chain config which is not yet validated against the zod schema.
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

    rpcConfigs[chainId] = {
      url: value,
      maxRequestsPerSecond: process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`],
    };
  });

  return rpcConfigs;
}

/**
 * Builds the ENSIndexer configuration object from an ENSIndexerEnvironment object
 *
 * This function then validates the config against the zod schema ensuring that the config
 * meets all type checks and invariants.
 */
export function buildConfigFromEnvironment(environment: ENSIndexerEnvironment): ENSIndexerConfig {
  const parsed = ENSIndexerConfigSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse environment configuration: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  return parsed.data;
}
