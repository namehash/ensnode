import { EnsRainbowEndpointUrlSchema, buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSIndexerEnvironment } from "@/config/types";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";
import { getENSRainbowVersionInfo, getPackageVersion } from "@/lib/version-info";

// Fetch ENSRainbow Version info
const ensRainbowEndpointUrl = EnsRainbowEndpointUrlSchema.parse(process.env.ENSRAINBOW_URL);
const { versionInfo: ensRainbowVersionInfo } =
  await getENSRainbowVersionInfo(ensRainbowEndpointUrl);

// format the relevant environment variables into the shape of an ENSIndexerEnvironment
const environment = {
  port: process.env.PORT,
  databaseSchemaName: process.env.DATABASE_SCHEMA,
  databaseUrl: process.env.DATABASE_URL,
  namespace: process.env.NAMESPACE,
  plugins: process.env.PLUGINS,
  ensRainbowEndpointUrl: process.env.ENSRAINBOW_URL,
  ensNodePublicUrl: process.env.ENSNODE_PUBLIC_URL,
  ensIndexerPrivateUrl: process.env.ENSINDEXER_PRIVATE_URL,
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
    ensRainbow: ensRainbowVersionInfo.version,
    ensRainbowSchema: ensRainbowVersionInfo.schema_version,
    nodejs: process.versions.node,
    ponder: getPackageVersion("ponder"),
  },
} satisfies ENSIndexerEnvironment;

// build, validate, and export the ENSIndexerConfig
export default buildConfigFromEnvironment(environment);
