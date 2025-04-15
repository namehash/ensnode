import { SELECTED_ENS_DEPLOYMENT } from "@/lib/globals";
import { type MergedTypes, getActivePlugins } from "@/lib/plugin-helpers";
import {
  deepMergeRecursive,
  getEnsDeploymentChain,
  getGlobalBlockrange,
  healReverseAddresses,
  requestedPluginNames,
} from "@/lib/ponder-helpers";
import { DatasourceName } from "@ensnode/ens-deployments";

import * as basenamesPlugin from "@/plugins/basenames/basenames.plugin";
import * as lineaNamesPlugin from "@/plugins/lineanames/lineanames.plugin";
import * as subgraphPlugin from "@/plugins/subgraph/subgraph.plugin";

////////
// First, generate AllPluginConfigs type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct.
////////

const ALL_PLUGINS = [subgraphPlugin, basenamesPlugin, lineaNamesPlugin] as const;

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
// Next, filter ALL_PLUGINS by those that the user has selected (via ACTIVE_PLUGINS), panicking if a
// user-specified plugin is unsupported by the Datasources available in SELECTED_ENS_DEPLOYMENT.
////////

// the available Datasources are those that the selected ENSDeployment defines
const availableDatasourceNames = Object.keys(SELECTED_ENS_DEPLOYMENT) as DatasourceName[];

// filter the set of available plugins by those that are 'active'
const activePlugins = getActivePlugins(ALL_PLUGINS, availableDatasourceNames);

////////
// Merge the plugins' configs into a single ponder config, including injected dependencies.
////////

// merge the resulting configs
const activePluginsMergedConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => deepMergeRecursive(acc, val), {}) as AllPluginConfigs;

// set the indexing behavior dependencies
activePluginsMergedConfig.indexingBehaviorDependencies = {
  HEAL_REVERSE_ADDRESSES: healReverseAddresses(),
};

////////
// Invariant: if using a custom START_BLOCK or END_BLOCK, ponder should be configured to index at
// most one network.
////////

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
  ENS_DEPLOYMENT_CHAIN=(mainnet|sepolia|holesky) ACTIVE_PLUGINS=subgraph END_BLOCK=x pnpm run start
which runs just the 'subgraph' plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.

In the future, indexing multiple networks with network-specific blockrange constraints may be possible.`,
    );
  }
}

////////
// Activate the active plugins' handlers, which register indexing handlers with Ponder.
////////

await Promise.all(activePlugins.map((plugin) => plugin.activate()));

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activePluginsMergedConfig;
