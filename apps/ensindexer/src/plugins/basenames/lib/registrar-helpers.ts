import type { RegistrarManagedName } from "@/lib/types";
import type { ENSNamespaceId } from "@ensnode/datasources";

/**
 * Get registrar managed name for `basenames` plugin for selected ENS namespace.
 *
 * @param namespaceId
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(namespaceId: ENSNamespaceId): RegistrarManagedName {
  switch (namespaceId) {
    case "mainnet":
      return "base.eth";
    case "sepolia":
      return "basetest.eth";
    case "holesky":
    case "ens-test-env":
    default:
      throw new Error(
        `No registrar managed name is known for the Basenames plugin within the "${namespaceId}" namespace.`,
      );
  }
}
