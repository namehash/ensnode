/**
 * NOTE(shrugs): I didn't want to use a global as a configuration option, but the typescript typings
 * on the plugin factory pattern kicked my ass, and I'm not ashamed to admit it.
 *
 * So here we specify the global options necessary to configure each plugin, since the addresses
 * and startBlocks of each contract depend on which ENS deployment the indexer is directed to.
 *
 * Additionally, we specify the global start/end block range that is currently helpful for development.
 */

import DeploymentConfigs from "@ensnode/ens-deployments";
import { getEnsDeploymentChain } from "./ponder-helpers";

export const SELECTED_DEPLOYMENT_CONFIG = DeploymentConfigs[getEnsDeploymentChain()];

/**
 * Here, we define the global MERGED_DEPLOYMENT_CONIG as the merge of all possible deployment configs
 * (therefore fully specifying all possible AddressBooks).
 */
const MERGED_DEPLOYMENT_CONIG = {
  ...DeploymentConfigs.mainnet,
  ...DeploymentConfigs.sepolia,
  ...DeploymentConfigs.holesky,
  ...DeploymentConfigs["ens-test-env"],
};

/**
 * Here we override the MERGED_DEPLOYMENT_CONIG object with the SELECTED_DEPLOYMENT_CONFIG.
 *
 * This ensures that at type-check-time every plugin's `config` has valid values (and therefore its
 * type can be inferred). This means that initially upon building the plugin configs, if the user is
 * selecting a deployment that does not fully specify every available plugin, the plugins that are
 * not in that deployment's specification are technically referencing an AddressBook from another
 * deployment. This is never an issue, however, as those plugin are filtered out at runtime
 * and never activated (see ponder.config.ts and `getActivePlugins`).
 */
export const DEPLOYMENT_CONFIG = {
  ...MERGED_DEPLOYMENT_CONIG,
  ...SELECTED_DEPLOYMENT_CONFIG,
};

/**
 * Constrain indexing between the following start/end blocks
 * https://ponder.sh/docs/contracts-and-networks#block-range
 *
 * NOTE: with a single variable here it only really makes sense to use start/end blocks when running
 * a single plugin (namely the eth plugin, in order to take snapshots). setting start/end blocks
 * while running multiple plugins (which results in ponder indexing multiple chains) should be
 * considered undefined behavior.
 *
 * TODO: allow runtime configuration, in particular for setting END_BLOCK on eth plugin
 */
export const START_BLOCK: number | undefined = undefined;
export const END_BLOCK: number | undefined = undefined;
