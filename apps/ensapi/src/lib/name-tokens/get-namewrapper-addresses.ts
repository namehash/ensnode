import type { Address } from "viem";

import {
  DatasourceNames,
  type ENSNamespaceId,
  getDatasource,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

/**
 * Get all NameWrapper contract addresses withing the ENS Namespace for the active plugins.
 */
export function getNameWrapperAddresses(
  namespaceId: ENSNamespaceId,
  plugins: PluginName[],
): Address[] {
  const addresses: Address[] = [];

  if (plugins.includes(PluginName.Subgraph)) {
    const ethnamesDatasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);
    const ethnamesNameWrapperAddress = ethnamesDatasource.contracts.NameWrapper.address;

    addresses.push(ethnamesNameWrapperAddress);
  }

  if (plugins.includes(PluginName.Lineanames)) {
    const lineanamesDatasource = maybeGetDatasource(namespaceId, DatasourceNames.Lineanames);
    const lineanamesNameWrapperAddress =
      lineanamesDatasource && typeof lineanamesDatasource.contracts.NameWrapper.address === "string"
        ? lineanamesDatasource.contracts.NameWrapper.address
        : undefined;

    if (lineanamesNameWrapperAddress) {
      addresses.push(lineanamesNameWrapperAddress);
    }
  }

  return addresses;
}
