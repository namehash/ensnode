import { ENSDeploymentChain } from "@namehash/ens-deployments";
import { type MergedTypes, getActivePlugins } from "./src/lib/plugin-helpers";
import { deepMergeRecursive } from "./src/lib/ponder-helpers";
import { plugin as baseEthPlugin } from "./src/plugins/base.eth/ponder.config";
import { plugin as ethPlugin } from "./src/plugins/eth/ponder.config";
import { plugin as lineaEthPlugin } from "./src/plugins/linea.eth/ponder.config";

import addressbook from "@namehash/ens-deployments";

const ENS_DEPLOYMENT_CHAIN: ENSDeploymentChain = "mainnet";
const deploymentConfig = addressbook[ENS_DEPLOYMENT_CHAIN];

// list of all available plugins
// any available plugin can be activated at runtime
const availablePlugins = [ethPlugin, baseEthPlugin, lineaEthPlugin] as const;

// merge of all available plugin configs to support correct typechecking
// of the indexing handlers
type AllPluginConfigs = MergedTypes<ReturnType<(typeof availablePlugins)[number]["createConfig"]>>;

// Activates the indexing handlers of activated plugins.
// Statically typed as the merge of all available plugin configs. However at
// runtime returns the merge of all activated plugin configs.
function activatePluginsAndGetConfig(): AllPluginConfigs {
  const activePlugins = getActivePlugins(availablePlugins);

  // load indexing handlers from the active plugins into the runtime
  activePlugins.forEach((plugin) => plugin.activate());

  const activePluginsConfig = activePlugins
    .map((plugin) => {
      const pluginConfig = deploymentConfig[plugin.ownedName];
      if (!pluginConfig) {
        throw new Error(`Deployment PluginConfig for ${plugin.ownedName} not found.`);
      }

      return plugin.createConfig({
        ...pluginConfig,
        startBlock: undefined,
        endBlock: undefined,
      });
    })
    .reduce((acc, val) => deepMergeRecursive(acc, val), {} as AllPluginConfigs);

  return activePluginsConfig as AllPluginConfigs;
}

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activatePluginsAndGetConfig();
