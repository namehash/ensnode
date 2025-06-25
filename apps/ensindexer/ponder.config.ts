import config from "@/config";
import type { ENSIndexerConfig } from "@/config/types";
import { prettyPrintConfig } from "@/lib/lib-config";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import { ALL_PLUGINS, type AllPluginsConfig } from "@/plugins";
import { prepareEventHandlersToBeAttached } from "@/plugins/event-listeners";
import { PluginName } from "@ensnode/ensnode-sdk";

////////
// First, generate `MergedPonderConfig` type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct, regardless
// of which plugins are actually active at runtime.
////////

export type MergedPonderConfig = AllPluginsConfig & {
  /**
   * NOTE: we inject additional values (ones that change the behavior of the indexing logic) into the
   * Ponder config in order to alter the ponder-generated build id when these additional options change.
   *
   * This ensures that running ENSIndexer with different configurations maintains compatibility with
   * Ponder's default crash recovery behavior.
   *
   * https://ponder.sh/docs/api-reference/ponder/database#build-id-and-crash-recovery
   **/
  indexingBehaviorDependencies: Pick<
    ENSIndexerConfig,
    "healReverseAddresses" | "indexAdditionalResolverRecords"
  >;
};

////////
// Merge the plugins' configs into a single ponder config, including injected dependencies.
////////

// filter all plugins by those activated by the config
const activePlugins = ALL_PLUGINS.filter((plugin) => config.plugins.includes(plugin.name));

// combine each plugins' config into a MergedPonderConfig
const mergedPonderConfig = activePlugins.reduce(
  (memo, plugin) => mergePonderConfigs(memo, plugin.getPonderConfig(config)),
  {},
) as MergedPonderConfig;

// inject the additional indexing behavior dependencies
mergedPonderConfig.indexingBehaviorDependencies = {
  healReverseAddresses: config.healReverseAddresses,
  indexAdditionalResolverRecords: config.indexAdditionalResolverRecords,
};

////////
// Activate the active plugins' handlers, which register indexing handlers with Ponder.
////////
function attachPluginEventHandlers(pluginName: PluginName) {
  // get the function that attaches event handlers for the plugin
  const attachPluginEventHandlers = prepareEventHandlersToBeAttached(pluginName);

  // execute the function to attach the event handlers
  attachPluginEventHandlers();
}

// NOTE: we explicitly delay the execution of this function for 1 tick, to avoid a race condition
// within ponder internals related to the schema name and drizzle-orm
setTimeout(() => config.plugins.forEach((plugin) => attachPluginEventHandlers(plugin)), 0);

////////
// Finally, return the MergedPonderConfig for Ponder to use for type inference and runtime behavior.
////////

console.log(`ENSIndexer running with config:\n${prettyPrintConfig(config)}`);

export default mergedPonderConfig;
