import { config } from "@/config/app-config";
import { ENSDeployments } from "@ensnode/ens-deployments";

const ensDeploymentChain = config.ensDeploymentChain;

export const SELECTED_ENS_DEPLOYMENT = ENSDeployments[ensDeploymentChain];

/**
 * Note that here, we define the global MERGED_ENS_DEPLOYMENT as the _merge_ of mainnet (which fully
 * specifies all plugin configs), overrided with the SELECTED_ENS_DEPLOYMENT.
 *
 * This ensures that at type-check-time and in `ALL_PLUGINS` every plugin's `config` has valid values
 * (and therefore its type can continue to be inferred). This means that initially upon building the
 * plugin configs, if the user is selecting a deployment that does not fully specify every available
 * plugin, the plugins that are not in that deployment's specification are technically pointing at
 * the mainnet deployment. This is never an issue, however, as those plugin are filtered out
 * (see ponder.config.ts and `getActivePlugins`) and never activated.
 */
export const MERGED_ENS_DEPLOYMENT = {
  ...ENSDeployments.mainnet,
  ...SELECTED_ENS_DEPLOYMENT,
};
