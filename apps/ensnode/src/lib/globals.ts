/**
 * NOTE(shrugs): I didn't want to use a global as a configuration option, but the typescript typings
 * on the plugin factory pattern kicked my ass, and I'm not ashamed to admit it.
 *
 * So here we specify the global options necessary to configure each plugin, since the addresses
 * and startBlocks of each contract depend on which ENS deployment the indexer is directed to.
 *
 * Additionally, we specify the global start/end block range that is currently helpful for development.
 */

import DeploymentConfigs from "@namehash/ens-deployments";
import type { ContractConfig } from "ponder";
import { getEnsDeploymentChain } from "./ponder-helpers";

export const SELECTED_DEPLOYMENT_CONFIG = DeploymentConfigs[getEnsDeploymentChain()];

/**
 * Note that here, we define the global DEPLOYMENT_CONFIG as the _merge_ of mainnet (which fully
 * specifies all plugin configs), overrided with the SELECTED_DEPLOYMENT_CONFIG.
 *
 * This ensures that at type-check-time every plugin's `config` has valid values and
 * therefore its type can continue to be inferred. At runtime the plugins that are not in this
 * specific ENS Deployment's specification are mis-configured to point to the mainnet deployment,
 * BUT those plugins are filtered out of the available plugins at runtime (in ponder.config.ts),
 * and those mis-configured plugins are never executed.
 */
export const DEPLOYMENT_CONFIG = {
  ...DeploymentConfigs.mainnet,
  ...SELECTED_DEPLOYMENT_CONFIG,
};

/**
 * Constrain indexing between the following start/end blocks
 * https://ponder.sh/0_6/docs/contracts-and-networks#block-range
 *
 * NOTE: with a single variable here it only really makes sense to use start/end blocks when running
 * a single plugin (namely the eth plugin, in order to take snapshots). setting start/end blocks
 * while running multiple plugins (which results in ponder indexing multiple chains) should be
 * considered undefined behavior.
 *
 * TODO: allow runtime configuration, in particular for setting END_BLOCK on eth plugin
 */
export const START_BLOCK: ContractConfig["startBlock"] = undefined;
export const END_BLOCK: ContractConfig["endBlock"] = undefined;
