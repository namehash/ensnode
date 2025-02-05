import DeploymentConfigs, { ENSDeploymentChain } from "@namehash/ens-deployments";
import { type MergedTypes, PonderENSPlugin, getActivePlugins } from "./src/lib/plugin-helpers";
import { deepMergeRecursive } from "./src/lib/ponder-helpers";

import type { ContractConfig } from "ponder";
import { plugin as baseEthPlugin } from "./src/plugins/base.eth/ponder.plugin";
import { plugin as ethPlugin } from "./src/plugins/eth/ponder.plugin";
import { plugin as lineaEthPlugin } from "./src/plugins/linea.eth/ponder.plugin";

// constrain indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
// NOTE: with a single variable here it only really makes sense to use start/end blocks when running
// a single plugin (namely the eth plugin, in order to take snapshots). setting start/end blocks
// while running multiple plugins (which results in ponder indexing multiple chains) should be
// considered undefined behavior.
// TODO: allow runtime configuration, in particular for setting END_BLOCK on eth plugin
const START_BLOCK: ContractConfig["startBlock"] = undefined;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

// TODO: switch on runtime arg
const deploymentChain: ENSDeploymentChain = "mainnet" as ENSDeploymentChain;
const deploymentConfig = DeploymentConfigs[deploymentChain];

////////
// First, generate a MergedType representing the merged types of each plugin's `config`, so ponder's
// typechecking of the indexing handlers and their event arguments is correct. Note that we generate
// this merged type from the set of plugins configured to point at the 'mainnet' deployment, which
// fully specifies all of the plugins.
////////

const mainnetConfig = DeploymentConfigs["mainnet"];
const ALL_PLUGINS = [
  ethPlugin({ config: mainnetConfig.eth }),
  baseEthPlugin({ config: mainnetConfig.base }),
  lineaEthPlugin({ config: mainnetConfig.linea }),
] as const;

type AllPluginConfigs = MergedTypes<(typeof ALL_PLUGINS)[number]["config"]>;

////////
// Next, create each plugin by configuring it to point at the selected ENS Deployment.
////////

const availablePlugins = [
  // an ENS deployment always has a root chain that it is deployed to which will use the 'eth' plugin
  ethPlugin({
    config: deploymentConfig.eth,
    extraContractConfig: { startBlock: START_BLOCK, endBlock: END_BLOCK },
  }),
  "base" in deploymentConfig &&
    baseEthPlugin({
      config: deploymentConfig.base,
      extraContractConfig: { startBlock: START_BLOCK, endBlock: END_BLOCK },
    }),
  "linea" in deploymentConfig &&
    lineaEthPlugin({
      config: deploymentConfig.linea,
      extraContractConfig: { startBlock: START_BLOCK, endBlock: END_BLOCK },
    }),
].filter(Boolean) as PonderENSPlugin<any, any>[];

// filter the set of available plugins by those that are 'active' in the env
const activePlugins = getActivePlugins(availablePlugins);

// load indexing handlers from the active plugins into the runtime
activePlugins.forEach((plugin) => plugin.activate());

// merge the resulting configs
const activePluginsConfig = activePlugins
  .map((plugin) => plugin.config)
  .reduce((acc, val) => deepMergeRecursive(acc, val), {});

// The type of the default export is a merge of all active plugin configs
// configs so that each plugin can be correctly typechecked
export default activePluginsConfig as AllPluginConfigs;
