import type { ENSDeployment, ENSDeploymentChain } from "./lib/types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";

/**
 * Note that here, we define the global ENSDeploymentGlobalType type based off mainnet (which fully
 * specifies all plugin configs). This type will be used to cast each specific ENSDeployment type
 * to the global type in order to ensure that at type-check-time and in `ALL_PLUGINS` every plugin's
 * `config` has valid values (and therefore its type can continue to be inferred).
 *
 * This means that initially upon building the
 * plugin configs, if the user is selecting a deployment that does not fully specify every available
 * plugin, the plugins that are not in that deployment's specification are technically pointing at
 * the mainnet deployment. This is never an issue, however, as those plugin are filtered out
 * (see ponder.config.ts and `getActivePlugins`) and never activated.
 */
export type ENSDeploymentGlobalType = typeof ENSDeployments.mainnet;

/**
 * ENSDeployments maps from an ENSDeploymentChain to an ENSDeployment.
 *
 * Each "ENS deployment" is a single, unified namespace of ENS names with a distinct onchain root
 * Registry but with the capability of spanning from that root Registry across many `Datasource`s that
 * may be distributed across multiple chains and offchain resources.
 *
 * For example, as of 9-Feb-2025 the canonical "ENS deployment" on mainnet includes:
 * - A root Registry on mainnet.
 * - An onchain Registrar for direct subnames of 'eth' on mainnet.
 * - An onchain Registry and Registrar for direct subnames of 'base.eth' on Base.
 * - An onchain Registry and Registrar subregistry for direct subnames of 'linea.eth' on Linea.
 * - An offchain subregistry for subnames of '.cb.id'.
 * - An offchain subregistry for subnames of '.uni.eth'.
 * - Etc..
 *
 * Each "ENS deployment" is logically independent of & isolated from the others.
 * For example, the Sepolia and Holesky testnet "ENS deployments" are independent of the canonical
 * "ENS deployment" on mainnet.
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export const ENSDeployments = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const satisfies Record<ENSDeploymentChain, ENSDeployment>;

/**
 * Returns the ENS deployment configuration for the specified deployment chain.
 *
 * This function takes a deployment chain identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * and returns the corresponding ENS deployment configuration. The returned configuration is cast to the
 * global deployment type to ensure type safety and consistency across all deployments.
 *
 * @param ensDeploymentChain - The deployment chain identifier
 * @returns The ENS deployment configuration for the specified chain
 */

export const getENSDeployment = (ensDeploymentChain: ENSDeploymentChain) =>
  ENSDeployments[ensDeploymentChain] as ENSDeploymentGlobalType;
