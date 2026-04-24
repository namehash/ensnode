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
  return [
    { plugin: PluginName.Subgraph, datasource: DatasourceNames.ENSRoot },
    { plugin: PluginName.Basenames, datasource: DatasourceNames.Basenames },
    { plugin: PluginName.Lineanames, datasource: DatasourceNames.Lineanames },
  ].flatMap(({ plugin, datasource }): Subregistry[] => {
    if (!activePlugins.includes(plugin)) return [];

    const subregistryId = maybeGetDatasourceContract(namespaceId, datasource, "BaseRegistrar");
    if (!subregistryId) return [];

    // get the Registrar's Managed Node
    const { node } = getManagedName(namespaceId, subregistryId);
    return [{ subregistryId, node }];
  });
}
