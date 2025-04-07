import { SELECTED_DEPLOYMENT_CONFIG } from "@/lib/globals";
import { type MergedTypes, getActivePlugins } from "@/lib/plugin-helpers";
import {
  deepMergeRecursive,
  getEnsDeploymentChain,
  getGlobalBlockrange,
  requestedPluginNames,
} from "@/lib/ponder-helpers";
import type { PluginName } from "@/lib/types";

import * as baseEthPlugin from "@/plugins/base/ponder.plugin";
import * as ethPlugin from "@/plugins/eth/ponder.plugin";
import * as lineaEthPlugin from "@/plugins/linea/ponder.plugin";

////////
// First, generate AllPluginConfigs type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct.
////////

const ALL_PLUGINS = [ethPlugin, baseEthPlugin, lineaEthPlugin] as const;

type AllPluginConfigs = MergedTypes<(typeof ALL_PLUGINS)[number]["config"]>;

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

// invariant: if using a custom START_BLOCK or END_BLOCK, ponder should be configured to index at most one network
const globalBlockrange = getGlobalBlockrange();
if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
  const numNetworks = Object.keys(activePluginsMergedConfig.networks).length;
  if (numNetworks > 1) {
    throw new Error(
      `ENSIndexer's behavior when indexing _multiple networks_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains.

The config currently is:
ENS_DEPLOYMENT_CHAIN=${getEnsDeploymentChain()}
ACTIVE_PLUGINS=${requestedPluginNames().join(",")}
START_BLOCK=${globalBlockrange.startBlock || "n/a"}
END_BLOCK=${globalBlockrange.endBlock || "n/a"}

The usage you're most likely interested in is:
  ENS_DEPLOYMENT_CHAIN=(mainnet|sepolia|holesky) ACTIVE_PLUGINS=eth END_BLOCK=x pnpm run start
which runs just the eth plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.

In the future, indexing multiple networks with network-specific blockrange constraints may be possible.
`,
    );
  }
}

// load indexing handlers from the active plugins into the runtime
await Promise.all(activePlugins.map((plugin) => plugin.activate()));

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activePluginsMergedConfig;
