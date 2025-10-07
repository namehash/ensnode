import { buildConfigFromEnvironment } from "@/config/config.schema";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";

// build, validate, and export the ENSIndexerConfig given the env
export default buildConfigFromEnvironment({
  databaseUrl: process.env.DATABASE_URL,
  databaseSchemaName: process.env.DATABASE_SCHEMA,
  namespace: process.env.NAMESPACE,
  plugins: process.env.PLUGINS,
  ensRainbowUrl: process.env.ENSRAINBOW_URL,
  labelSet: {
    labelSetId: process.env.LABEL_SET_ID,
    labelSetVersion: process.env.LABEL_SET_VERSION,
  },
  ensIndexerUrl: process.env.ENSINDEXER_URL,
  globalBlockrange: {
    startBlock: process.env.START_BLOCK,
    endBlock: process.env.END_BLOCK,
  },
  rpcConfigs: getRpcConfigsFromEnv(),
  isSubgraphCompatible: process.env.SUBGRAPH_COMPAT,
});
