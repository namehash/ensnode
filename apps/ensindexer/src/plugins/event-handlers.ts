import { PluginName } from "@ensnode/ensnode-sdk";

import { attachBasenamesPluginEventHandlers } from "@/plugins/basenames/event-handlers";
import { attachLineanamesPluginEventHandlers } from "@/plugins/lineanames/event-handlers";
import { attachSubgraphPluginEventHandlers } from "@/plugins/subgraph/event-handlers";
import { attachThreeDNSPluginEventHandlers } from "@/plugins/threedns/event-handlers";

/**
 * Attach plugin's event handlers for indexing.
 *
 * @param {PluginName} pluginName name of the plugin of which events handlers must be attached for indexing.
 */
export function attachPluginEventHandlers(pluginName: PluginName) {
  switch (pluginName) {
    case PluginName.Basenames:
      attachBasenamesPluginEventHandlers();
      break;
    case PluginName.Lineanames:
      attachLineanamesPluginEventHandlers();
      break;
    case PluginName.Subgraph:
      attachSubgraphPluginEventHandlers();
      break;
    case PluginName.ThreeDNS:
      attachThreeDNSPluginEventHandlers();
      break;
  }
}
