import { deepMergeRecursive } from "../../packages/ensnode-core/src/helpers";
import { type MergedTypes, getActivePlugins } from "../../packages/ensnode-core/src/plugin-helpers";
import * as baseEthPlugin from "./src/plugins/base.eth/ponder.config";
import * as ethPlugin from "./src/plugins/eth/ponder.config";
import * as lineaEthPlugin from "./src/plugins/linea.eth/ponder.config";

// list of all available plugins
// any available plugin can be activated at runtime
const availablePlugins = [baseEthPlugin, ethPlugin, lineaEthPlugin] as const;

// merge of all available plugin configs to support correct typechecking
// of the indexing handlers
type AllPluginConfigs = MergedTypes<(typeof availablePlugins)[number]["config"]>;

// Activates the indexing handlers of activated plugins.
// Statically typed as the merge of all available plugin configs. However at
// runtime returns the merge of all activated plugin configs.
function activatePluginsAndGetConfig(): AllPluginConfigs {
  const activePlugins = getActivePlugins(availablePlugins);

  // load indexing handlers from the active plugins into the runtime
  activePlugins.forEach((plugin) => plugin.activate());

  const activePluginsConfig = activePlugins
    .map((plugin) => plugin.config)
    .reduce((acc, val) => deepMergeRecursive(acc, val), {} as AllPluginConfigs);

  return activePluginsConfig as AllPluginConfigs;
}

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activatePluginsAndGetConfig();
