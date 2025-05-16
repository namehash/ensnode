import { ENSIndexerConfigSchema } from "@/config/config.schema";
import {
  RawChainConfig,
  ENSIndexerConfig,
  ENSIndexerEnvironment,
} from "@/config/types";
import z from "zod";

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
export function getChainsFromEnv(): Record<number, RawChainConfig> {
  const chains: Record<number, RawChainConfig> = {};

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
    const rpcMaxRequestsPerSecond =
      process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`];

    chains[chainId] = {
      // The value for each RPC_URL_{chainId} is used as the rpcEndpointUrl.
      rpcEndpointUrl: value,
      // Note: rpcMaxRequestsPerSecond is typed as string!!!
      // Type coercion is handled later by zod validation in the actual config.
      rpcMaxRequestsPerSecond: rpcMaxRequestsPerSecond,
    };
  });

  return chains;
}

function getValidationErrors(issues: z.core.$ZodIssue[]) {
  // loop over and concatenate the messages. precede with a line break due
  // to the way ponder prints errors
  return `\n` + issues.map((issue) => issue.message).join("\n");
}

// loads the relevant environment variables in the shape of the zod schema
function parseEnvironment(): ENSIndexerEnvironment {
  const config: ENSIndexerEnvironment = {
    port: process.env.PORT,
    ponderDatabaseSchema: process.env.DATABASE_SCHEMA,
    databaseUrl: process.env.DATABASE_URL,
    ensDeploymentChain: process.env.ENS_DEPLOYMENT_CHAIN,
    requestedPluginNames: process.env.ACTIVE_PLUGINS,
    ensRainbowEndpointUrl: process.env.ENSRAINBOW_URL,
    ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
    ensAdminUrl: process.env.ENSADMIN_URL,
    healReverseAddresses: process.env.HEAL_REVERSE_ADDRESSES,
    startBlock: process.env.START_BLOCK,
    endBlock: process.env.END_BLOCK,

    globalBlockrange: {
      startBlock: process.env.START_BLOCK,
      endBlock: process.env.END_BLOCK,
    },

    indexedChains: getChainsFromEnv(),
  };

  return config;
}

/**
 * Builds the ENSIndexer configuration object from an ENSIndexerEnvironment object
 *
 * This function then validates the config against the zod schema ensuring that the config
 * meets all type checks and invariants.
 *
 * **Note:** This function does **not** perform deep validation of the configuration values
 * beyond basic type checks and presence. Comprehensive validation (such as checking for
 * required environment variables, correct formats, or logical consistency) is handled
 * separately by dedicated validation utilities elsewhere in the codebase.
 */
function buildConfigFromEnvironment(
  environment: ENSIndexerEnvironment
): ENSIndexerConfig {
  const parsed = ENSIndexerConfigSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse environment configuration: " +
        getValidationErrors(parsed.error.issues)
    );
  }

  return parsed.data;
}

export default buildConfigFromEnvironment(parseEnvironment());
