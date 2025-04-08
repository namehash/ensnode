import { SELECTED_DEPLOYMENT_CONFIG } from "./src/lib/globals";
import { type MergedTypes, getActivePlugins } from "./src/lib/plugin-helpers";
import { deepMergeRecursive, healReverseAddresses } from "./src/lib/ponder-helpers";
import type { PluginName } from "./src/lib/types";

import * as baseEthPlugin from "./src/plugins/base/ponder.plugin";
import * as ethPlugin from "./src/plugins/eth/ponder.plugin";
import * as lineaEthPlugin from "./src/plugins/linea/ponder.plugin";

////////
// First, generate AllPluginConfigs type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct.
////////

const ALL_PLUGINS = [ethPlugin, baseEthPlugin, lineaEthPlugin] as const;

type AllPluginConfigs = MergedTypes<(typeof ALL_PLUGINS)[number]["config"]> & {
  /**
   * The environment variables that change the behavior of the indexer.
   * It's important to include all environment variables that change the behavior
   * of the indexer to ensure Ponder app build ID is updated when any of them change.
   **/
  indexingBehaviorDependencies: {
    HEAL_REVERSE_ADDRESSES: boolean;
  };
};

////////
// Next, filter ALL_PLUGINS by those that are available and that the user has activated.
////////

// the available PluginNames are those that the selected ENS Deployment defines as available
const availablePluginNames = Object.keys(SELECTED_DEPLOYMENT_CONFIG) as PluginName[];

// filter the set of available plugins by those that are 'active' in the env
const activePlugins = getActivePlugins(ALL_PLUGINS, availablePluginNames);

////////
// Next, merge the plugins' configs into a single ponder config and activate their handlers.
////////

// merge the resulting configs
const activePluginsMergedConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => deepMergeRecursive(acc, val), {}) as AllPluginConfigs;

// set the indexing behavior dependencies
activePluginsMergedConfig.indexingBehaviorDependencies = {
  HEAL_REVERSE_ADDRESSES: healReverseAddresses(),
};

// load indexing handlers from the active plugins into the runtime
await Promise.all(activePlugins.map((plugin) => plugin.activate()));

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activePluginsMergedConfig;
