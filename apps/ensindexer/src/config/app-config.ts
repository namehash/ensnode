import {
  ChainConfig,
  DEFAULT_RPC_RATE_LIMIT,
  ENSIndexerConfig,
  ENSIndexerConfigSchema,
} from "@/config/config.schema";
import z from "zod";

function getValidationErrors(issues: z.core.$ZodIssue[]) {
  // loop over and concatenate the messages. precede with a line break due
  // to the way ponder prints errors
  return `\n` + issues.map((issue) => issue.message).join("\n");
}

/**
 * Extracts chain configuration from environment variables.
 *
 * This function scans all environment variables for keys matching the pattern
 * "RPC_URL_{chainId}", where {chainId} must be a string of digits (e.g., "1", "10", "8453").
 */
function getChainsFromEnv(): Record<number, ChainConfig> {
  const chains: Record<number, ChainConfig> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    // Only match keys like "RPC_URL_1", "RPC_URL_10", etc. (digits only after the underscore)
    const match = key.match(/^RPC_URL_(\d+)$/);

    // If the key after `RPC_URL_` is not a number, skip
    if (!match || !value) return;

    // The regex above ensures that only numeric chain IDs are matched.
    // - Example: "RPC_URL_1" will match and extract "1" as the chainId.
    // - Example: "RPC_URL_SOMESTRING" will NOT match, so no risk of NaN from non-numeric IDs.
    const chainId = Number(match[1]);

    // Optionally get the rate limit for this chain, if set.
    const rpcMaxRequestsPerSecond = process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`];

    chains[chainId] = {
      // The value for each RPC_URL_{chainId} is used as the rpcEndpointUrl.
      rpcEndpointUrl: value,
      // Note: rpcMaxRequestsPerSecond is typed as number, but may be a string here.
      // Type coercion is handled later by zod validation.
      rpcMaxRequestsPerSecond: rpcMaxRequestsPerSecond as unknown as number,
    };
  });

  return chains;
}

/**
 * Builds the ENSIndexer configuration object.
 *
 * This function gathers all necessary configuration values for the application from
 * the environment variables and will throw an error if any required values are missing.
 *
 * **Note:** This function does **not** perform deep validation of the configuration values
 * beyond basic type checks and presence. Comprehensive validation (such as checking for
 * required environment variables, correct formats, or logical consistency) is handled
 * separately by dedicated validation utilities elsewhere in the codebase.
 */
function buildENSIndexerConfig(): ENSIndexerConfig {
  const indexedChains = getChainsFromEnv();

  const config = {
    ensDeploymentChain: process.env.ENS_DEPLOYMENT_CHAIN,
    ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
    ensAdminUrl: process.env.ENSADMIN_URL,
    ponderDatabaseSchema: process.env.DATABASE_SCHEMA,
    requestedPluginNames: process.env.ACTIVE_PLUGINS,
    healReverseAddresses: process.env.HEAL_REVERSE_ADDRESSES,
    port: process.env.PORT,
    ensRainbowEndpointUrl: process.env.ENSRAINBOW_URL,
    globalBlockrange: {
      // Note: startBlock is typed as number, but may be a string here.
      // Type coercion is handled later by zod validation.
      startBlock: process.env.START_BLOCK as unknown as number | undefined,
      // Note: endBlock is typed as number, but may be a string here.
      // Type coercion is handled later by zod validation.
      endBlock: process.env.END_BLOCK as unknown as number | undefined,
    },
    indexedChains,
  };

  const parsed = ENSIndexerConfigSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(getValidationErrors(parsed.error.issues));
  }

  return parsed.data;
}

// Build the config object right away
const config = buildENSIndexerConfig();

// Export individual properties
export const {
  ensDeploymentChain,
  ensNodePublicUrl,
  ensAdminUrl,
  ponderDatabaseSchema,
  requestedPluginNames,
  healReverseAddresses,
  port,
  ensRainbowEndpointUrl,
  globalBlockrange,
  indexedChains,
} = config;

export default config;
