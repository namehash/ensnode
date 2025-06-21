import type { RegistrarManagedName } from "@/lib/types";
import type { ENSNamespace } from "@ensnode/datasources";

/**
 * Get registrar managed name for `basenames` plugin for selected ENS namespace.
 *
 * @param namespace
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(namespace: ENSNamespace): RegistrarManagedName {
  switch (namespace) {
    case "mainnet":
      return "base.eth";
    case "sepolia":
      return "basetest.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name is known for the Basenames plugin within the "${namespace}" namespace.`,
      );
  }
}
