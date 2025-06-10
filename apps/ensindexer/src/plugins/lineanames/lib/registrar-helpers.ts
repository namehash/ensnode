import type { RegistrarManagedName } from "@/lib/types";
import type { ENSDeploymentChain } from "@ensnode/ens-deployments";
import type { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Get registrar managed name for `lineanames` plugin for selected ENS Deployment Chain.
 * @param ensDeploymentChain
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(
  ensDeploymentChain: ENSDeploymentChain,
  pluginName: PluginName.Lineanames,
): RegistrarManagedName {
  switch (ensDeploymentChain) {
    case "mainnet":
      return "linea.eth";
    case "sepolia":
      return "linea-sepolia.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name was defined for the "${ensDeploymentChain}" ENS Deployment Chain for ${pluginName}.`,
      );
  }
}
