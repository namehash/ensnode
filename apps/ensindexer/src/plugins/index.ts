import { PluginName } from "@ensnode/ensnode-sdk";

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

type AllPluginsUnionType = (typeof ALL_PLUGINS)[number];

// Helper type to enable correct typing for the default-exported value from ponder.config.ts.
// It helps to keep TypeScript types working well for all plugins (regardless if active or not).
export type AllPluginsMergedConfig = MergedTypes<
  ReturnType<AllPluginsUnionType["createPonderConfig"]>
>;

// Helper type to merge multiple types into one
type MergedTypes<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? R
  : never;

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
