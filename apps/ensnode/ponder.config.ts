import { DEPLOYMENT_CONFIG } from "./src/lib/globals";
import { type MergedTypes, PonderENSPlugin, getActivePlugins } from "./src/lib/plugin-helpers";
import { deepMergeRecursive } from "./src/lib/ponder-helpers";

import * as baseEthPlugin from "./src/plugins/base.eth/ponder.plugin";
import * as ethPlugin from "./src/plugins/eth/ponder.plugin";
import * as lineaEthPlugin from "./src/plugins/linea.eth/ponder.plugin";

////////
// First, generate AllPluginConfigs type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct.
////////

const ALL_PLUGINS = [ethPlugin, baseEthPlugin, lineaEthPlugin] as const;

type AllPluginConfigs = MergedTypes<(typeof ALL_PLUGINS)[number]["config"]>;

////////
// Next, filter available plugins by those that the user has activated.
////////

const availablePlugins = [
  // an ENS deployment always has a root chain that it is deployed to which will use the 'eth' plugin
  ethPlugin,
  // the rest of the plugins are optional, and should not be 'available' if the deployment does not
  // specify them.
  // TODO: raise a runtime warning if the user attempts to activate an unavailable plugin
  "base" in DEPLOYMENT_CONFIG && baseEthPlugin,
  "linea" in DEPLOYMENT_CONFIG && lineaEthPlugin,
] as PonderENSPlugin<any, any>[];

// filter the set of available plugins by those that are 'active' in the env
const activePlugins = getActivePlugins(availablePlugins);

////////
// Next, merge the plugins' configs into a single ponder config.
////////

// load indexing handlers from the active plugins into the runtime
activePlugins.forEach((plugin) => plugin.activate());

// merge the resulting configs
const activePluginsMergedConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => deepMergeRecursive(acc, val), {}) as AllPluginConfigs;

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activePluginsMergedConfig;
