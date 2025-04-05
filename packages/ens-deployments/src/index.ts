import type { ENSDeploymentChain, ENSDeploymentConfig } from "./lib/types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";

/**
 * Mapping from a set of ENSDeploymentChains to an "ENS deployment".
 *
 * Each "ENS deployment" is a single, unified namespace of ENS names with a distinct
 * onchain root Registry but with the capability of spanning from that root Registry
 * across many chains, subregistries, and offchain resources.
 *
 * For example, as of 9-Feb-2025 the canonical "ENS deployment" on mainnet includes:
 * - A root Registry on mainnet.
 * - An onchain subregistry for direct subnames of 'eth' on mainnet.
 * - An onchain subregistry for direct subnames of 'base.eth' on Base.
 * - An onchain subregistry for direct subnames of 'linea.eth' on Linea.
 * - An offchain subregistry for subnames of '.cb.id'.
 * - An offchain subregistry for subnames of '.uni.eth'.
 * - Etc..
 *
 * Each "ENS deployment" is independent of the others. For example, the Sepolia and Holesky
 * testnet "ENS deployments" are independent of the canonical "ENS deployment" on mainnet.
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export const DeploymentConfigs = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const satisfies Record<ENSDeploymentChain, ENSDeploymentConfig>;

export default DeploymentConfigs;
