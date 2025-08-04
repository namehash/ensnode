import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSIndexerEnvironment } from "@/config/types";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";
import { getPackageVersion } from "@/lib/version-info";

// format the relevant environment variables into the shape of an ENSIndexerEnvironment
const environment = {
  port: process.env.PORT,
  databaseSchemaName: process.env.DATABASE_SCHEMA,
  databaseUrl: process.env.DATABASE_URL,
  namespace: process.env.NAMESPACE,
  plugins: process.env.PLUGINS,
  ensRainbowEndpointUrl: process.env.ENSRAINBOW_URL,
  ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
  ensAdminUrl: process.env.ENSADMIN_URL,
  healReverseAddresses: process.env.HEAL_REVERSE_ADDRESSES,
  indexAdditionalResolverRecords: process.env.INDEX_ADDITIONAL_RESOLVER_RECORDS,
  experimentalResolution: process.env.EXPERIMENTAL_RESOLUTION,
  globalBlockrange: {
    startBlock: process.env.START_BLOCK,
    endBlock: process.env.END_BLOCK,
  },
  rpcConfigs: getRpcConfigsFromEnv(),
  versionInfo: {
    // TODO: replace hardcoded ENSRainbow version info in the next commit
    ensRainbow: "0.31.0",
    ensRainbowSchema: 2,
    nodejs: process.versions.node,
    ponder: getPackageVersion("ponder"),
  },
} satisfies ENSIndexerEnvironment;

// build, validate, and export the ENSIndexerConfig
export default buildConfigFromEnvironment(environment);
