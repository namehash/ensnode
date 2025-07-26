import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSIndexerEnvironment } from "@/config/types";
import { getRpcConfigsFromEnv } from "@/lib/lib-config";

// Validate critical configuration before starting
function validateStartupConfig() {
  // Skip validation in test environment
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }

  const rpcConfigs = getRpcConfigsFromEnv();

  if (!rpcConfigs[1]) {
    console.error("❌ CONFIGURATION ERROR: Ethereum mainnet RPC required");
    console.error("");
    console.error("ENSIndexer will make MILLIONS of RPC requests during operation.");
    console.error("Please copy .env.local.example to .env.local and configure RPC_URL_1.");
    console.error("Additional chains may be required depending on enabled plugins.");
    console.error("");
    console.error(
      "⚠️  Public (rate limited) RPC endpoints will NOT provide acceptable performance!",
    );
    console.error("ENSIndexer requires 500+ requests/second capability.");
    console.error("Use private (paid) plans from Alchemy, Infura, QuickNode, or similar.");
    console.error("");
    process.exit(1);
  }
}

// Run validation before proceeding
validateStartupConfig();

// format the relevant environment variables into the shape of an ENSIndexerEnvironment
const environment = {
  port: process.env.PORT,
  ponderDatabaseSchema: process.env.DATABASE_SCHEMA,
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
} satisfies ENSIndexerEnvironment;

// build, validate, and export the ENSIndexerConfig
export default buildConfigFromEnvironment(environment);
