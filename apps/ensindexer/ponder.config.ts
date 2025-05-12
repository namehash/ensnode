import config from "@/config/app-config";
import { validateConfig } from "@/config/validations";
import { SELECTED_ENS_DEPLOYMENT } from "@/lib/globals";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import { getActivePlugins } from "@/lib/plugin-helpers";
import { AVAILABLE_PLUGINS, MergedPluginConfig } from "@/plugins";
import { DatasourceName } from "@ensnode/ens-deployments";

const { requestedPluginNames, healReverseAddresses } = config;

////////
// Filter AVAILABLE_PLUGINS by those that the user has selected (via ACTIVE_PLUGINS), panicking if a
// user-specified plugin is unsupported by the Datasources available in SELECTED_ENS_DEPLOYMENT.
////////

// the available Datasources are those that the selected ENSDeployment defines
const availableDatasourceNames = Object.keys(SELECTED_ENS_DEPLOYMENT) as DatasourceName[];

// filter the set of available plugins by those that are 'active'
const activePlugins = getActivePlugins(
  AVAILABLE_PLUGINS,
  requestedPluginNames,
  availableDatasourceNames,
);

////////
// Merge the plugins' configs into a single ponder config, including injected dependencies.
////////

// merge the resulting configs into the config we return to Ponder
const ponderConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => mergePonderConfigs(acc, val), {}) as MergedPluginConfig;

// set the indexing behavior dependencies
ponderConfig.indexingBehaviorDependencies = {
  HEAL_REVERSE_ADDRESSES: healReverseAddresses,
};

const allChainIds = Object.values(ponderConfig.networks).map((network) => network.chainId);

// Validate the config before we activate the plugins. These validations go beyond simple type
// validations and ensure any relationships between environment variables are correct.
validateConfig(allChainIds, ponderConfig.networks);

////////
// Activate the active plugins' handlers, which register indexing handlers with Ponder.
////////

// NOTE: we explicitly delay the execution of this function for 1 tick, to avoid a race condition
// within ponder internals related to the schema name and drizzle-orm
setTimeout(() => activePlugins.map((plugin) => plugin.activate()), 0);

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

export default ponderConfig;
