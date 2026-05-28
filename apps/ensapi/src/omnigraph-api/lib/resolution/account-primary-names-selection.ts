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
 *
 * This function merges all requested coin types across multiple field nodes (e.g. from fragments
 * or aliases) to ensure the resolver resolves everything needed by the client.
 */
export function buildAccountPrimaryNamesSelection(info: GraphQLResolveInfo): CoinType[] | null {
  const resolveReturnType = getNamedType(info.returnType);
  if (!isObjectType(resolveReturnType)) {
    throw new GraphQLError("Return type must be an object type.");
  }

  // Use a Set to collect and deduplicate all requested coin types across all field nodes
  const coinTypes = new Set<CoinType>();

  // Iterate over all 'resolve' field nodes in the query (there might be multiple due to fragments)
  for (const resolveField of info.fieldNodes) {
    const selectionSet = resolveField.selectionSet;
    if (!selectionSet) continue;

    // 1. Process all 'primaryNames(where: { ... })' field selections
    const primaryNamesFieldNodes = collectNamedSubFieldNodes(selectionSet, "primaryNames", info);
    const primaryNamesFieldDef = resolveReturnType.getFields().primaryNames;
    if (primaryNamesFieldDef) {
      for (const node of primaryNamesFieldNodes) {
        // Extract arguments from this specific field node (handles variables and aliases)
        const args = getArgumentValues(primaryNamesFieldDef, node, info.variableValues);
        const normalized = normalizeAccountPrimaryNamesWhereInput(
          args.where as AccountPrimaryNamesWhereInput,
        );
        // Add all requested coin types from this 'primaryNames' call to our set
        for (const coinType of normalized) coinTypes.add(coinType);
      }
    }

    // 2. Process all 'primaryName(by: { ... })' field selections
    const primaryNameFieldNodes = collectNamedSubFieldNodes(selectionSet, "primaryName", info);
    const primaryNameFieldDef = resolveReturnType.getFields().primaryName;
    if (primaryNameFieldDef) {
      for (const node of primaryNameFieldNodes) {
        // Extract arguments from this specific field node
        const args = getArgumentValues(primaryNameFieldDef, node, info.variableValues);
        // Add the single requested coin type from this 'primaryName' call to our set
        coinTypes.add(normalizePrimaryNameByInput(args.by as PrimaryNameByInput));
      }
    }
  }

  // Return the merged list of unique coin types, or null if no primary name fields were selected
  return coinTypes.size > 0 ? [...coinTypes] : null;
}
