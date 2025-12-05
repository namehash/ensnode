import { namehash } from "viem";

import type { ENSNamespaceId } from "@ensnode/datasources";
import {
  getBasenamesSubregistryId,
  getBasenamesSubregistryManagedName,
  getEthnamesSubregistryId,
  getEthnamesSubregistryManagedName,
  getLineanamesSubregistryId,
  getLineanamesSubregistryManagedName,
  type Subregistry,
} from "@ensnode/ensnode-sdk";

/**
 * Get list of all actively indexed subregistries for the ENS Namespace.
 */
export function getIndexedSubregistries(namespaceId: ENSNamespaceId): Subregistry[] {
  const ethnames = {
    subregistryId: getEthnamesSubregistryId(namespaceId),
    node: namehash(getEthnamesSubregistryManagedName(namespaceId)),
  } satisfies Subregistry;

  const basenames = {
    subregistryId: getBasenamesSubregistryId(namespaceId),
    node: namehash(getBasenamesSubregistryManagedName(namespaceId)),
  } satisfies Subregistry;

  const lineanames = {
    subregistryId: getLineanamesSubregistryId(namespaceId),
    node: namehash(getLineanamesSubregistryManagedName(namespaceId)),
  } satisfies Subregistry;

  return [ethnames, basenames, lineanames];
}
