import type { ENSDeploymentChain, ENSDeploymentConfig } from "./types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./types";

export const DeploymentConfigs = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} satisfies Record<ENSDeploymentChain, ENSDeploymentConfig>;

export default DeploymentConfigs;
