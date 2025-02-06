import type { ENSDeploymentChain, ENSDeploymentConfig } from "./types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./types";

/**
 * A 'deployment' of ENS is a single, unified namespace of ENS names across potentially many chains
 * and sub-registries. Here, each config defines the associated chains and plugins
 * available for indexing that deployment's ENS names.
 *
 * For example, the canonical ETH Mainnet deployment of ENS includes names managed by the mainnet ETH
 * Registry, as well as Basenames and Linea L2 Registries (& off-chain names like .cb.id, though we
 * are only concerned with on-chain names in this context). The contract configuration for each of
 * these possible plugins are specified as part of a `ENSDeploymentConfig`.
 *
 * The Sepolia and Holesky testnet ENS Deployments are completely independent of the canonical ETH
 * Mainnet deployment. These testnet ENS deployments use the .eth plugin, just configured with the
 * proper addresses on their respective chains.
 *
 * Similarly, the ens-test-env deployment is the version of ENS deployed to a local Anvil chain
 * for testing protocol changes and running deterministic test suites.
 */
export const DeploymentConfigs = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} satisfies Record<ENSDeploymentChain, ENSDeploymentConfig>;

export default DeploymentConfigs;
