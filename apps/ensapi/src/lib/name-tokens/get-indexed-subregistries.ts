import type { AccountId } from "enssdk";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";
import {
  getManagedName,
  maybeGetDatasourceContract,
  PluginName,
  type Subregistry,
} from "@ensnode/ensnode-sdk";

/**
 * Get list of all actively indexed subregistries for the ENS Namespace.
 */
export function getIndexedSubregistries(
  namespaceId: ENSNamespaceId,
  activePlugins: PluginName[],
): Subregistry[] {
  // Each entry: the plugin whose activation implies the subregistry is indexed, and the datasource
  // whose BaseRegistrar contract is that subregistry's SubregistryId.
  const entries = [
    { plugin: PluginName.Subgraph, datasource: DatasourceNames.ENSRoot },
    { plugin: PluginName.Basenames, datasource: DatasourceNames.Basenames },
    { plugin: PluginName.Lineanames, datasource: DatasourceNames.Lineanames },
  ] as const;

  return entries.flatMap(({ plugin, datasource }): Subregistry[] => {
    if (!activePlugins.includes(plugin)) return [];

    const baseRegistrar = maybeGetDatasourceContract(namespaceId, datasource, "BaseRegistrar");
    if (!baseRegistrar) return [];

    // Reverse-lookup the BaseRegistrar's Managed Name to get its node.
    const { node } = getManagedName(namespaceId, baseRegistrar satisfies AccountId);
    return [{ subregistryId: baseRegistrar, node }];
  });
}
