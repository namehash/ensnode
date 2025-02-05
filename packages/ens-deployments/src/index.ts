import type { ENSDeploymentChain, ENSDeploymentConfig } from "./types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./types";

export const DeploymentConfigs: Record<ENSDeploymentChain, ENSDeploymentConfig> = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
};

export default DeploymentConfigs;
