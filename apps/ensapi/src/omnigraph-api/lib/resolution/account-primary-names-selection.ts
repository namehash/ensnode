import type { CoinType } from "enssdk";
import {
  GraphQLError,
  type GraphQLResolveInfo,
  getArgumentValues,
  getNamedType,
  isObjectType,
} from "graphql";

import {
  type AccountPrimaryNamesWhereInput,
  normalizeAccountPrimaryNamesWhereInput,
  normalizePrimaryNameByInput,
  type PrimaryNameByInput,
} from "@/omnigraph-api/lib/resolution/primary-name-input";
import { collectNamedSubFieldNodes } from "@/omnigraph-api/lib/resolution/records-selection";

/**
 * Derives primary-name coin types from `Account.resolve { primaryName | primaryNames }`, or null
 * when neither field is selected.
 */
export function buildAccountPrimaryNamesSelection(info: GraphQLResolveInfo): CoinType[] | null {
  const primaryNamesFieldNodes = info.fieldNodes.flatMap((resolveField) => {
    const selectionSet = resolveField.selectionSet;
    if (!selectionSet) return [];
    return collectNamedSubFieldNodes(selectionSet, "primaryNames", info);
  });

  const primaryNameFieldNodes = info.fieldNodes.flatMap((resolveField) => {
    const selectionSet = resolveField.selectionSet;
    if (!selectionSet) return [];
    return collectNamedSubFieldNodes(selectionSet, "primaryName", info);
  });

  if (primaryNamesFieldNodes.length === 0 && primaryNameFieldNodes.length === 0) {
    return null;
  }

  const resolveReturnType = getNamedType(info.returnType);
  if (!isObjectType(resolveReturnType)) {
    throw new GraphQLError("Return type must be an object type.");
  }

  if (primaryNamesFieldNodes.length > 0) {
    const fieldDef = resolveReturnType.getFields().primaryNames;
    if (!fieldDef) return null;

    const args = getArgumentValues(fieldDef, primaryNamesFieldNodes[0], info.variableValues);
    return normalizeAccountPrimaryNamesWhereInput(args.where as AccountPrimaryNamesWhereInput);
  }

  const fieldDef = resolveReturnType.getFields().primaryName;
  if (!fieldDef) return null;

  const args = getArgumentValues(fieldDef, primaryNameFieldNodes[0], info.variableValues);
  return [normalizePrimaryNameByInput(args.by as PrimaryNameByInput)];
}
