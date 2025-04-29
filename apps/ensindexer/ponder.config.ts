import { DatasourceName } from "@ensnode/ens-deployments";

import { SELECTED_ENS_DEPLOYMENT } from "@/lib/globals";
import { mergePonderConfigs } from "@/lib/merge-ponder-configs";
import { type MergedTypes, getActivePlugins } from "@/lib/plugin-helpers";
import {
  getEnsDeploymentChain,
  getGlobalBlockrange,
  getRequestedPluginNames,
  healReverseAddresses,
  rpcEndpointUrl,
} from "@/lib/ponder-helpers";

import * as basenamesPlugin from "@/plugins/basenames/basenames.plugin";
import * as lineaNamesPlugin from "@/plugins/lineanames/lineanames.plugin";
import * as subgraphPlugin from "@/plugins/subgraph/subgraph.plugin";
import * as threednsPlugin from "@/plugins/threedns/threedns.plugin";
import { NetworkConfig } from "ponder";

////////
// First, generate MergedPluginConfig type representing the merged types of each plugin's `config`,
// so ponder's typechecking of the indexing handlers and their event arguments is correct.
////////

const AVAILABLE_PLUGINS = [
  subgraphPlugin,
  basenamesPlugin,
  lineaNamesPlugin,
  threednsPlugin,
] as const;

type MergedPluginConfig = MergedTypes<(typeof AVAILABLE_PLUGINS)[number]["config"]> & {
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

const requestedPluginNames = getRequestedPluginNames();

// the available Datasources are those that the selected ENSDeployment defines
const availableDatasourceNames = Object.keys(SELECTED_ENS_DEPLOYMENT) as DatasourceName[];

// filter the set of available plugins by those that are 'active'
const activePlugins = getActivePlugins(
  AVAILABLE_PLUGINS,
  requestedPluginNames,
  availableDatasourceNames,
);

////////
// Merge the plugins' configs into a single ponder config, including injected dependencies.
////////

// merge the resulting configs into the config we return to Ponder
const ponderConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => mergePonderConfigs(acc, val), {}) as MergedPluginConfig;

// set the indexing behavior dependencies
ponderConfig.indexingBehaviorDependencies = {
  HEAL_REVERSE_ADDRESSES: healReverseAddresses(),
};

////////
// Invariant: if using a custom START_BLOCK or END_BLOCK, ponder should be configured to index at
// most one network.
////////

const globalBlockrange = getGlobalBlockrange();
if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
  const numNetworks = Object.keys(ponderConfig.networks).length;
  if (numNetworks > 1) {
    throw new Error(
      `ENSIndexer's behavior when indexing _multiple networks_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains.

The config currently is:
ENS_DEPLOYMENT_CHAIN=${getEnsDeploymentChain()}
ACTIVE_PLUGINS=${requestedPluginNames.join(",")}
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
// Warn if configured networks are using a default RPC URL (indexing will likely be rate-limited).
////////

const hasValidTransport = (network: NetworkConfig) => {
  try {
    // attempt to use transport without providing a url
    network.transport({});

    // if it succeeds, a non-default url was provided to the http transport
    return true;
  } catch (error) {
    // otherwise, if it fails, `undefined` was passed and the transport will use a default RPC provider
    return false;
  }
};

// if not every network has a valid transport, panic
const allNetworks = Object.values(ponderConfig.networks);
if (!allNetworks.every(hasValidTransport)) {
  throw new Error(`ENSNode has been configured with the following ACTIVE_PLUGINS: ${requestedPluginNames.join(", ")}.
These plugins, collectively, index events from the following chains: ${allNetworks.map((n) => n.chainId).join(", ")}.

The following RPC_URL_* environment variables must be defined for nominal indexing behavior:
${allNetworks.map((n) => `RPC_URL_${n.chainId}: ${rpcEndpointUrl(n.chainId) || "N/A"}`).join("\n")}
`);
}

////////
// Activate the active plugins' handlers, which register indexing handlers with Ponder.
////////

// NOTE: we explicitly delay the execution of this function for 1 tick, to avoid a race condition
// within ponder internals related to the schema name and drizzle-orm
setTimeout(() => activePlugins.map((plugin) => plugin.activate()), 0);

////////
// Finally, return the merged config for ponder to use for type inference and runtime behavior.
////////

export default ponderConfig;
