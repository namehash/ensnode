import { namehashInterpretedName } from "enssdk";

import type { ENSNamespaceId } from "@ensnode/datasources";
import {
  getBasenamesSubregistryId,
  getBasenamesSubregistryManagedName,
  getEthnamesSubregistryId,
  getEthnamesSubregistryManagedName,
  getLineanamesSubregistryId,
  getLineanamesSubregistryManagedName,
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
  const indexedSubregistries: Subregistry[] = [];

  if (activePlugins.includes(PluginName.Subgraph)) {
    indexedSubregistries.push({
      subregistryId: getEthnamesSubregistryId(namespaceId),
      node: namehashInterpretedName(getEthnamesSubregistryManagedName(namespaceId)),
    });
  }

  if (activePlugins.includes(PluginName.Basenames)) {
    indexedSubregistries.push({
      subregistryId: getBasenamesSubregistryId(namespaceId),
      node: namehashInterpretedName(getBasenamesSubregistryManagedName(namespaceId)),
    });
  }

  if (activePlugins.includes(PluginName.Lineanames)) {
    indexedSubregistries.push({
      subregistryId: getLineanamesSubregistryId(namespaceId),
      node: namehashInterpretedName(getLineanamesSubregistryManagedName(namespaceId)),
    });
  }

  return indexedSubregistries;
}
