import {
  type FieldNode,
  GraphQLError,
  type GraphQLObjectType,
  type GraphQLResolveInfo,
  getArgumentValues,
  getNamedType,
  isObjectType,
  Kind,
  type SelectionSetNode,
} from "graphql";

import { isSelectionEmpty, type ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import {
  getParametricRecordsSelectionField,
  getSimpleRecordsSelectionField,
} from "@/omnigraph-api/lib/resolution/records-selection-config";

export const EMPTY_RECORDS_SELECTION_MESSAGE = "Records selection cannot be empty.";

/** Recursively flatten a GraphQL selection set into Field nodes (expanding fragments). */
function collectFieldNodes(
  graphqlSelectionSet: SelectionSetNode,
  info: GraphQLResolveInfo,
): FieldNode[] {
  const fields: FieldNode[] = [];

  for (const graphqlSelection of graphqlSelectionSet.selections) {
    if (graphqlSelection.kind === "Field") {
      if (graphqlSelection.name.value === "__typename") continue;
      fields.push(graphqlSelection);
    } else if (graphqlSelection.kind === "InlineFragment") {
      fields.push(...collectFieldNodes(graphqlSelection.selectionSet, info));
    } else if (graphqlSelection.kind === "FragmentSpread") {
      const fragment = info.fragments[graphqlSelection.name.value];
      if (fragment) fields.push(...collectFieldNodes(fragment.selectionSet, info));
    }
  }

  return fields;
}

export function collectNamedSubFieldNodes(
  graphqlSelectionSet: SelectionSetNode,
  fieldName: string,
  info: GraphQLResolveInfo,
): FieldNode[] {
  const fields: FieldNode[] = [];

  for (const graphqlSelection of graphqlSelectionSet.selections) {
    if (graphqlSelection.kind === "Field") {
      if (graphqlSelection.name.value === fieldName) fields.push(graphqlSelection);
    } else if (graphqlSelection.kind === "InlineFragment") {
      fields.push(...collectNamedSubFieldNodes(graphqlSelection.selectionSet, fieldName, info));
    } else if (graphqlSelection.kind === "FragmentSpread") {
      const fragment = info.fragments[graphqlSelection.name.value];
      if (fragment) {
        fields.push(...collectNamedSubFieldNodes(fragment.selectionSet, fieldName, info));
      }
    }
  }

  return fields;
}

/**
 * Translates a GraphQL selection set on a 'records' field into a flat {@link ResolverRecordsSelection}.
 *
 * This function handles merging selections from multiple field nodes (e.g. from fragments or aliases)
 * and correctly maps both simple (boolean) and parametric (keyed-args) record types.
 */
function buildRecordsSelectionFromRecordsFieldNodes(
  recordsFieldNodes: readonly FieldNode[],
  recordsReturnType: GraphQLObjectType,
  info: GraphQLResolveInfo,
): ResolverRecordsSelection | null {
  // 1. Collect all selections from all 'records' field nodes (merging fragments and aliases)
  const graphqlSelections = recordsFieldNodes.flatMap(
    (node) => node.selectionSet?.selections ?? [],
  );

  if (graphqlSelections.length === 0) {
    // If the 'records' field is selected but has no sub-fields (e.g. only '__typename'),
    // we return null to indicate that no resolution is required.
    return null;
  }

  // Create a virtual selection set to process all collected selections together
  const mergedGraphqlSelectionSet: SelectionSetNode = {
    kind: Kind.SELECTION_SET,
    selections: graphqlSelections,
  };

  const recordsSelection: ResolverRecordsSelection = {};

  // 2. Iterate over each selected field to build the ResolverRecordsSelection object
  for (const childField of collectFieldNodes(mergedGraphqlSelectionSet, info)) {
    const graphqlField = childField.name.value;

    // A. Handle 'simple' fields (e.g. contenthash, pubkey) which map to boolean flags
    const simple = getSimpleRecordsSelectionField(graphqlField);
    if (simple) {
      recordsSelection[simple.recordsSelectionKey] = true;
      continue;
    }

    // B. Handle 'parametric' fields (e.g. texts, addresses) which require arguments
    const parametric = getParametricRecordsSelectionField(graphqlField);
    if (!parametric) continue;

    const fieldDef = recordsReturnType.getFields()[graphqlField];
    if (!fieldDef) continue;

    // Extract arguments for this specific field node (handles variables and aliases)
    const args = getArgumentValues(fieldDef, childField, info.variableValues);

    // Apply the arguments to the recordsSelection object (merging with any existing values)
    parametric.applyToRecordsSelection(recordsSelection, args);
  }

  if (isSelectionEmpty(recordsSelection)) {
    // If the selection is empty after filtering out unknown fields or '__typename',
    // we return null to indicate that no resolution is required.
    return null;
  }

  return recordsSelection;
}

/**
 * Builds a {@link ResolverRecordsSelection} from the GraphQL field selection on `Domain.records`.
 *
 * GraphQL clients express *what* to resolve via a field selection set (e.g. `records { texts(...) }`).
 * The ENS resolution layer expects a flat {@link ResolverRecordsSelection} instead — this function
 * translates between the two.
 */
export function buildRecordsSelectionFromResolveInfo(
  info: GraphQLResolveInfo,
): ResolverRecordsSelection {
  const returnType = getNamedType(info.returnType);
  if (!isObjectType(returnType)) {
    throw new GraphQLError("Return type must be an object type.");
  }

  const selection = buildRecordsSelectionFromRecordsFieldNodes(info.fieldNodes, returnType, info);
  if (!selection) {
    throw new GraphQLError(EMPTY_RECORDS_SELECTION_MESSAGE);
  }

  return selection;
}

/**
 * Builds a {@link ResolverRecordsSelection} from a resolution container's `records { ... }` field
 * (e.g. `Domain.resolve { records { ... } }` or `PrimaryNameRecord.resolve { records { ... } }`),
 * or null when `records` is not selected.
 */
export function buildRecordsSelectionFromResolveContainerInfo(
  info: GraphQLResolveInfo,
): ResolverRecordsSelection | null {
  const recordsFieldNodes = info.fieldNodes.flatMap((resolveField) => {
    const selectionSet = resolveField.selectionSet;
    if (!selectionSet) return [];
    return collectNamedSubFieldNodes(selectionSet, "records", info);
  });

  if (recordsFieldNodes.length === 0) return null;

  const resolveReturnType = getNamedType(info.returnType);
  if (!isObjectType(resolveReturnType)) {
    throw new GraphQLError("Return type must be an object type.");
  }

  const recordsFieldDef = resolveReturnType.getFields().records;
  if (!recordsFieldDef) return null;

  const recordsReturnType = getNamedType(recordsFieldDef.type);
  if (!isObjectType(recordsReturnType)) {
    throw new GraphQLError("ResolvedRecords return type must be an object type.");
  }

  return buildRecordsSelectionFromRecordsFieldNodes(recordsFieldNodes, recordsReturnType, info);
}
