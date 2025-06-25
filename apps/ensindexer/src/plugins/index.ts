import { PluginName } from "@ensnode/ensnode-sdk";

import { uniq } from "@/lib/lib-helpers";
import { getENSNamespaceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { Datasource, DatasourceName, ENSNamespace, ENSNamespaceId } from "@ensnode/datasources";
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

// Helper type to let enable correct typing for the default-exported value from ponder.config.ts.
// It helps to keep TypeScript types working well for all plugins (regardless if active or not).
export type AllPluginsConfig = MergedTypes<ReturnType<AllPluginsUnionType["getPonderConfig"]>>;

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

/**
 * Get a list of unique required datasource names from selected plugins.
 * @param pluginNames A list of selected plugin names.
 * @returns A list of unique datasource names.
 */
export function getRequiredDatasourceNames(pluginNames: PluginName[]): DatasourceName[] {
  const plugins = pluginNames.map((pluginName) => getPlugin(pluginName));
  const requiredDatasourceNames = plugins.flatMap((plugin) => plugin.requiredDatasources);

  return uniq(requiredDatasourceNames);
}

interface GetRequiredDatasourcesArgs {
  namespace: ENSNamespaceId;
  plugins: PluginName[];
}

/**
 * Get a list of unique datasources for selected plugin names.
 * @param pluginNames
 * @returns
 */
export function getRequiredDatasources({
  namespace: ensNamespaceID,
  plugins,
}: GetRequiredDatasourcesArgs): Datasource[] {
  const requiredDatasourceNames = getRequiredDatasourceNames(plugins);
  const ensNamespace = getENSNamespaceAsFullyDefinedAtCompileTime(ensNamespaceID);
  const ensDeploymentDatasources = Object.entries(ensNamespace) as Array<
    [DatasourceName, Datasource]
  >;
  const datasources = {} as Record<DatasourceName, Datasource>;

  for (let [datasourceName, datasource] of ensDeploymentDatasources) {
    if (requiredDatasourceNames.includes(datasourceName)) {
      datasources[datasourceName] = datasource;
    }
  }

  return Object.values(datasources);
}

/**
 * Get a list of unique indexed chain IDs for selected plugin names.
 */
export function getRequiredChainIds(datasources: Datasource[]): number[] {
  const indexedChainIds = datasources.map((datasource) => datasource.chain.id);

  return uniq(indexedChainIds);
}
