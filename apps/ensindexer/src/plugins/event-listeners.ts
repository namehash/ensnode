import { ENSIndexerPluginHandler } from "@/lib/plugin-helpers";
import { getPlugin } from "@/plugins";
import { PluginName } from "@ensnode/ensnode-sdk";

import basenamesEventHandlers from "@/plugins/basenames/event-handlers";
import lineaNamesEventHandlers from "@/plugins/lineanames/event-handlers";
import subgraphEventHandlers from "@/plugins/subgraph/event-handlers";
import threednsEventHandlers from "@/plugins/threedns/event-handlers";

/**
 * A map of event handlers for each plugin.
 */
const ALL_EVENT_HANDLERS_BY_PLUGIN = {
  [PluginName.Basenames]: basenamesEventHandlers,
  [PluginName.Lineanames]: lineaNamesEventHandlers,
  [PluginName.Subgraph]: subgraphEventHandlers,
  [PluginName.ThreeDNS]: threednsEventHandlers,
};

/**
 * Get a list of functions that when called attach event handlers for the plugin
 * so Ponder can use them during indexing.
 *
 * @param {PluginName} pluginName - The name of a plugin to attach event handlers for.
 * @return {(Function)} A function that when called attaches the event handlers for the plugin.
 */
export function prepareEventHandlersToBeAttached<const PluginNameType extends PluginName>(
  pluginName: PluginNameType,
): () => void {
  // Get the list of event handlers for the plugin
  const pluginEventHandlers = ALL_EVENT_HANDLERS_BY_PLUGIN[pluginName] as ENSIndexerPluginHandler[];

  // Get arguments for each event handler
  const plugin = getPlugin(pluginName);
  const pluginEventHandlerArgs = {
    pluginName: plugin.name,
    pluginNamespace: plugin.namespace,
  };

  return function attachPluginEventHandlers() {
    for (const attachEventHandler of pluginEventHandlers) {
      // Call the event handler with the event handler arguments
      // This will register the event handlers with Ponder
      // so they can be used during indexing.
      attachEventHandler(pluginEventHandlerArgs);
    }
  };
}
