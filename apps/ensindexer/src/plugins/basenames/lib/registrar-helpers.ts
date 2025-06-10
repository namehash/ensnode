import type { RegistrarManagedName } from "@/lib/types";
import type { ENSDeploymentChain } from "@ensnode/ens-deployments";
import type { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Get registrar managed name for `basenames` plugin for selected ENS Deployment Chain.
 * @param ensDeploymentChain
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(
  ensDeploymentChain: ENSDeploymentChain,
  pluginName: PluginName.Basenames,
): RegistrarManagedName {
  switch (ensDeploymentChain) {
    case "mainnet":
      return "base.eth";
    case "sepolia":
      return "basetest.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name was defined for the "${ensDeploymentChain}" ENS Deployment Chain for ${pluginName}.`,
      );
  }
}
