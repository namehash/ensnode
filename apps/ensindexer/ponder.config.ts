import config from "@/config";
import type { ENSIndexerConfig } from "@/config/types";
import { prettyPrintConfig } from "@/lib/lib-config";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import type { ENSIndexerPluginHandler } from "@/lib/plugin-helpers";
import { ALL_PLUGINS, type AllPluginsConfig, getPlugin } from "@/plugins";

import basenamesEventHandlers from "@/plugins/basenames/event-handlers";
import lineaNamesEventHandlers from "@/plugins/lineanames/event-handlers";
import subgraphEventHandlers from "@/plugins/subgraph/event-handlers";
import threednsEventHandlers from "@/plugins/threedns/event-handlers";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Attach event handlers only for the active plugins, so Ponder can use them during indexing.
 */
function attachEventHandlers() {
  const PLUGIN_EVENT_HANDLERS = {
    [PluginName.Basenames]: basenamesEventHandlers,
    [PluginName.Lineanames]: lineaNamesEventHandlers,
    [PluginName.Subgraph]: subgraphEventHandlers,
    [PluginName.ThreeDNS]: threednsEventHandlers,
  };

  const activePlugins = config.plugins.map((pluginName) => getPlugin(pluginName));

  for (const activePlugin of activePlugins) {
    const pluginEventHandlers = PLUGIN_EVENT_HANDLERS[
      activePlugin.name
    ] as ENSIndexerPluginHandler[];

    for (const attachPluginEventHandlers of pluginEventHandlers) {
      attachPluginEventHandlers({
        pluginName: activePlugin.name,
        pluginNamespace: activePlugin.namespace,
      });
    }
  }
}

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

attachEventHandlers();

////////
// Finally, return the MergedPonderConfig for Ponder to use for type inference and runtime behavior.
////////

console.log(`ENSIndexer running with config:\n${prettyPrintConfig(config)}`);

export default mergedPonderConfig;
