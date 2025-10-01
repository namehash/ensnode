import { buildConfigFromEnvironment } from "@/config/config.schema";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";

// build, validate, and export the ENSIndexerConfig given the env
export default buildConfigFromEnvironment({
  port: process.env.PORT,
  databaseSchemaName: process.env.DATABASE_SCHEMA,
  databaseUrl: process.env.DATABASE_URL,
  namespace: process.env.NAMESPACE,
  plugins: process.env.PLUGINS,
  ensRainbowUrl: process.env.ENSRAINBOW_URL,
  labelSet: {
    labelSetId: process.env.LABEL_SET_ID,
    labelSetVersion: process.env.LABEL_SET_VERSION,
  },
  ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
  ensIndexerUrl: process.env.ENSINDEXER_URL,
  ensAdminUrl: process.env.ENSADMIN_URL,
  globalBlockrange: {
    startBlock: process.env.START_BLOCK,
    endBlock: process.env.END_BLOCK,
  },
  rpcConfigs: getRpcConfigsFromEnv(),
  isSubgraphCompatible: process.env.SUBGRAPH_COMPAT,
});
