import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSIndexerEnvironment } from "@/config/types";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";

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
  indexResolverRecords: process.env.INDEX_RESOLVER_RECORDS,
  globalBlockrange: {
    startBlock: process.env.START_BLOCK,
    endBlock: process.env.END_BLOCK,
  },
  rpcConfigs: getRpcConfigsFromEnv(),
} satisfies ENSIndexerEnvironment;

// build, validate, and export the ENSIndexerConfig
export default buildConfigFromEnvironment(environment);
