import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSIndexerConfig, ENSIndexerEnvironment } from "@/config/types";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";

let _config: ENSIndexerConfig;

/**
 * Get fully validated configuration object.
 * @returns {ENSIndexerConfig}
 */
export function config(): ENSIndexerConfig {
  // if config has been built once, return its existing instance
  if (_config) {
    return _config;
  }

  // otherwise, build config from environment

  // format the relevant environment variables into the shape of an ENSIndexerEnvironment
  const environment = {
    port: process.env.PORT,
    ponderDatabaseSchema: process.env.DATABASE_SCHEMA,
    databaseUrl: process.env.DATABASE_URL,
    ensDeploymentChain: process.env.ENS_DEPLOYMENT_CHAIN,
    plugins: process.env.ACTIVE_PLUGINS,
    ensRainbowEndpointUrl: process.env.ENSRAINBOW_URL,
    ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
    ensAdminUrl: process.env.ENSADMIN_URL,
    healReverseAddresses: process.env.HEAL_REVERSE_ADDRESSES,
    indexAdditionalResolverRecords: process.env.INDEX_ADDITIONAL_RESOLVER_RECORDS,
    globalBlockrange: {
      startBlock: process.env.START_BLOCK,
      endBlock: process.env.END_BLOCK,
    },
    rpcConfigs: getRpcConfigsFromEnv(),
  } satisfies ENSIndexerEnvironment;

  // build, validate, and keep the ENSIndexerConfig instance for further `config()` calls
  _config = buildConfigFromEnvironment(environment);

  return _config;
}
