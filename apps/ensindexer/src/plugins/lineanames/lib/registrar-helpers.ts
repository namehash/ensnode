import type { RegistrarManagedName } from "@/lib/types";
import type { ENSNamespaceId } from "@ensnode/datasources";

/**
 * Get registrar managed name for `lineanames` plugin for selected ENS namespace.
 *
 * @param namespaceId
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(namespaceId: ENSNamespaceId): RegistrarManagedName {
  switch (namespaceId) {
    case "mainnet":
      return "linea.eth";
    case "sepolia":
      return "linea-sepolia.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name is known for the Linea Names plugin within the "${namespaceId}" namespace.`,
      );
  }
}
