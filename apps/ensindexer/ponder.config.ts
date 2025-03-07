import { SELECTED_DEPLOYMENT_CONFIG } from "./src/lib/globals";
import { type MergedTypes, getActivePlugins } from "./src/lib/plugin-helpers";
import { deepMergeRecursive } from "./src/lib/ponder-helpers";
import type { PluginName } from "./src/lib/types";

import * as baseEthPlugin from "./src/plugins/base/ponder.plugin";
import * as ensV2Plugin from "./src/plugins/ens-v2/ponder.plugin";
import * as ethPlugin from "./src/plugins/eth/ponder.plugin";
import * as lineaEthPlugin from "./src/plugins/linea/ponder.plugin";

////////
// Generate AllPluginConfigs type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct.
////////

const ALL_PLUGINS = [ethPlugin, baseEthPlugin, lineaEthPlugin, ensV2Plugin] as const;

type AllPluginConfigs = MergedTypes<(typeof ALL_PLUGINS)[number]["config"]>;

////////
// Filter ALL_PLUGINS by those that are 'available' (i.e. defined by the SELECTED_DEPLOYMENT_CONFIG)
////////

const availablePluginNames = Object.keys(SELECTED_DEPLOYMENT_CONFIG) as PluginName[];

////////
// Filter ALL_PLUGINS by those that are 'active' in the env (i.e. via ACTIVE_PLUGINS)
////////

const activePlugins = getActivePlugins(ALL_PLUGINS, availablePluginNames);

////////
// Merge the plugins' configs into a single ponder config.
////////

const activePluginsMergedConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => deepMergeRecursive(acc, val), {}) as AllPluginConfigs;

////////
// 'activate' each plugin, registering its indexing handlers with ponder
////////

activePlugins.forEach((plugin) => plugin.activate());

////////
// Finally, return the merged config (typed as AllPluginConfigs) for ponder.
////////

export default activePluginsMergedConfig;
