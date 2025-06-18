import type { RegistrarManagedName } from "@/lib/types";
import type { L1Chain } from "@ensnode/ens-deployments";

/**
 * Get registrar managed name for `lineanames` plugin for selected L1 Chain.
 *
 * @param l1Chain
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(l1Chain: L1Chain): RegistrarManagedName {
  switch (l1Chain) {
    case "mainnet":
      return "linea.eth";
    case "sepolia":
      return "linea-sepolia.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name was defined for the "${l1Chain}" L1 Chain for Linea Names.`,
      );
  }
}
