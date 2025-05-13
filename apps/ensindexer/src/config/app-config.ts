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
 * Looks for RPC_URL_{chainId} and optional RPC_REQUEST_RATE_LIMIT_{chainId}.
 */
function getChainsFromEnv(): Record<number, ChainConfig> {
  const chains: Record<number, ChainConfig> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    const match = key.match(/^RPC_URL_(\d+)$/);
    if (!match || !value) return;

    const chainId = Number(match[1]);

    const rpcMaxRequestsPerSecond = process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`];

    chains[chainId] = {
      rpcEndpointUrl: value,
      // use as to avoid requiring a separate type with a string.
      // zod will take care of the type coercion to number.
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
      // use as to avoid requiring a separate type with a string.
      // zod will take care of the type coercion to number.
      startBlock: process.env.START_BLOCK as unknown as number | undefined,
      // use as to avoid requiring a separate type with a string.
      // zod will take care of the type coercion to number.
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

// Default export for new code to use
export default config;

/**
 * Gets the RPC request rate limit for a given chain ID.
 *
 * @param chainId the chain ID to get the rate limit for
 * @returns the rate limit in requests per second (rps)
 */
export const rpcMaxRequestsPerSecond = (chainId: number): number => {
  const chainConfig = config.indexedChains[chainId];

  if (!chainConfig?.rpcMaxRequestsPerSecond) {
    return DEFAULT_RPC_RATE_LIMIT;
  }

  return chainConfig.rpcMaxRequestsPerSecond;
};

/**
 * Gets the RPC endpoint URL for a given chain ID.
 *
 * @param chainId the chain ID to get the RPC URL for
 * @returns the URL of the RPC endpoint
 */
export const rpcEndpointUrl = (chainId: number): string | undefined => {
  const chainConfig = config.indexedChains[chainId];

  if (!chainConfig?.rpcEndpointUrl) {
    return undefined;
  }

  return chainConfig.rpcEndpointUrl;
};
