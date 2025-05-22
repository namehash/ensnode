import { DatasourceName } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";

/**
 * Maps from a plugin to its required Datasources. This spec is _outside_ of the plugin spec because:
 * 1) the *.plugin.ts files need to directly export a `const` ponder config so that ponder's
 *  typechecking and type inference for stuff like event names works correctly
 * 2) this means that they have a dependency on the global app-config, as that informs how the plugins
 *   behave
 * 3) the config requires knowledge of which datasources a plugin requires to run, in order to perform
 *   runtime validation of ENSIndexerConfig
 * 4) therefore, to avoid a circular dependency, this
 */
export const PLUGIN_REQUIRED_DATASOURCES = {
  [PluginName.Subgraph]: [DatasourceName.Root],
  [PluginName.Basenames]: [DatasourceName.Basenames],
  [PluginName.Lineanames]: [DatasourceName.Lineanames],
  [PluginName.ThreeDNS]: [DatasourceName.ThreeDNSOptimism, DatasourceName.ThreeDNSBase],
};
