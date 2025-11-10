import { namehash, normalize } from "viem/ens";

import { type RegistrarActionsFilter, RegistrarActionsFilterFields } from "../api";
import { isNormalizedName, type Name, type NormalizedName } from "../ens";

/**
 * Builds a filter object for requested parent name.
 */
export function buildRegistrarActionsFilterForParentName(parentName: Name): RegistrarActionsFilter {
  const parentNameNormalized = isNormalizedName(parentName)
    ? parentName
    : (normalize(parentName) as NormalizedName);

  const parentNode = namehash(parentNameNormalized);

  return {
    field: RegistrarActionsFilterFields.SubregistryNode,
    comparator: "eq",
    value: parentNode,
  };
}
