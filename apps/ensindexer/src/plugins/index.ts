import { uniq } from "@/lib/lib-helpers";
import { DatasourceName } from "@ensnode/datasources";
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

export type AllPluginsConfig = MergedTypes<
  ReturnType<(typeof ALL_PLUGINS)[number]["createPonderConfig"]>
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
  const plugin = ALL_PLUGINS.find((plugin) => plugin.pluginName === pluginName);

  if (plugin) {
    return plugin;
  }

  // invariant: all plugins can be found by PluginName
  throw new Error(`Plugin not found by "${pluginName} name"`);
}
