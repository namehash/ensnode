import { namehash } from "viem";

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
      node: namehash(getEthnamesSubregistryManagedName(namespaceId)),
    });
  }
  if (activePlugins.includes(PluginName.Basenames)) {
    indexedSubregistries.push({
      subregistryId: getBasenamesSubregistryId(namespaceId),
      node: namehash(getBasenamesSubregistryManagedName(namespaceId)),
    });
  }

  if (activePlugins.includes(PluginName.Lineanames)) {
    indexedSubregistries.push({
      subregistryId: getLineanamesSubregistryId(namespaceId),
      node: namehash(getLineanamesSubregistryManagedName(namespaceId)),
    });
  }

  return indexedSubregistries;
}
