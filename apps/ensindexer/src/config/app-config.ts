import { DEFAULT_RPC_RATE_LIMIT, ENSIndexerConfigSchema } from "@/config/config.schema";
import { ChainConfig, ENSIndexerConfig } from "@/config/types";
import z from "zod";

function getValidationErrors(issues: z.core.$ZodIssue[]) {
  // loop over and concatenate the messages. precede with a line break due
  // to the way ponder prints errors
  const errorMessage = `\n` + issues.map((issue) => issue.message).join("\n");
  return errorMessage;
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

    const rpcMaxRequestsPerSecond =
      Number(process.env[`RPC_REQUEST_RATE_LIMIT_${chainId}`]) || DEFAULT_RPC_RATE_LIMIT;

    chains[chainId] = {
      rpcEndpointUrl: value,
      rpcMaxRequestsPerSecond,
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
  console.log("building config");
  const chains = getChainsFromEnv();

  const config = {
    ensDeploymentChain: process.env.ENS_DEPLOYMENT_CHAIN,
    ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
    ensAdminUrl: process.env.ENSADMIN_URL,
    ponderDatabaseSchema: process.env.DATABASE_SCHEMA,
    requestedPluginNames: process.env.ACTIVE_PLUGINS,
    healReverseAddresses: process.env.HEAL_REVERSE_ADDRESSES,
    ponderPort: process.env.PORT,
    ensRainbowEndpointUrl: process.env.ENSRAINBOW_URL,
    globalBlockrange: {
      startBlock:
        process.env.START_BLOCK !== undefined ? Number(process.env.START_BLOCK) : undefined,
      endBlock: process.env.END_BLOCK !== undefined ? Number(process.env.END_BLOCK) : undefined,
    },
    chains,
  };

  const parsed = ENSIndexerConfigSchema.safeParse(config);

  if (!parsed.success) {
    const errorMessage = getValidationErrors(parsed.error.issues);
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return parsed.data;
}

let _config: ReturnType<typeof buildENSIndexerConfig> | undefined;

/**
 * Returns the ENSIndexer configuration object. If it doesnt exist will instantiate it
 * via the buildENSIndexerConfig function. This function ensures that the configuration
 * is built only once and cached for reuse.
 */
export function getConfig() {
  if (!_config) {
    _config = buildENSIndexerConfig();
  }
  return _config;
}
