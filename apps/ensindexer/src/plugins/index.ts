import { PluginName } from "@ensnode/ensnode-sdk";

import type { MergedTypes } from "@/lib/lib-helpers";
import basenamesPlugin from "./basenames/plugin";
import lineaNamesPlugin from "./lineanames/plugin";
import subgraphPlugin from "./subgraph/plugin";
import threednsPlugin from "./threedns/plugin";

export const ALL_PLUGINS = [
  subgraphPlugin,
  basenamesPlugin,
  lineaNamesPlugin,
  threednsPlugin,
] as const;

/**
 * Helper type representing the merged Ponder config of all possible ENSIndexerPlugins. This
 * ensures that the inferred types of each Ponder config are available at compile-time to Ponder,
 * which uses it to power type inference in event handlers.
 */
export type AllPluginsMergedConfig = MergedTypes<
  ReturnType<(typeof ALL_PLUGINS)[number]["createPonderConfig"]>
>;

/**
 * Get plugin object by plugin name.
 *
 * @see {ALL_PLUGINS} list
 */
export function getPlugin(pluginName: PluginName) {
  const plugin = ALL_PLUGINS.find((plugin) => plugin.name === pluginName);

  if (!plugin) {
    // invariant: all plugins can be found by PluginName
    throw new Error(`Plugin not found by "${pluginName}" name.`);
  }

  return plugin;
}
