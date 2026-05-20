import {
  type FieldNode,
  GraphQLError,
  type GraphQLResolveInfo,
  getArgumentValues,
  getNamedType,
  isObjectType,
  type SelectionSetNode,
} from "graphql";

import { isSelectionEmpty, type ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import {
  getParametricRecordsSelectionField,
  getSimpleRecordsSelectionField,
} from "@/omnigraph-api/lib/records-selection-config";

export const EMPTY_RECORDS_SELECTION_MESSAGE = "Records selection cannot be empty.";

function collectFieldNodes(selectionSet: SelectionSetNode, info: GraphQLResolveInfo): FieldNode[] {
  const fields: FieldNode[] = [];

  for (const selection of selectionSet.selections) {
    if (selection.kind === "Field") {
      if (selection.name.value === "__typename") continue;
      fields.push(selection);
    } else if (selection.kind === "InlineFragment") {
      fields.push(...collectFieldNodes(selection.selectionSet, info));
    } else if (selection.kind === "FragmentSpread") {
      const fragment = info.fragments[selection.name.value];
      if (fragment) fields.push(...collectFieldNodes(fragment.selectionSet, info));
    }
  }

  return fields;
}

/**
 * Builds a {@link ResolverRecordsSelection} from the GraphQL selection set and field
 * arguments on `Domain.records` → `ResolvedRecords`.
 */
export function buildRecordsSelectionFromResolveInfo(
  info: GraphQLResolveInfo,
): ResolverRecordsSelection {
  const fieldNode = info.fieldNodes[0];
  if (!fieldNode?.selectionSet) {
    throw new GraphQLError(EMPTY_RECORDS_SELECTION_MESSAGE);
  }

  const returnType = getNamedType(info.returnType);
  if (!isObjectType(returnType)) {
    throw new GraphQLError("Return type must be an object type.");
  }

  const selection: ResolverRecordsSelection = {};

  for (const childField of collectFieldNodes(fieldNode.selectionSet, info)) {
    const graphqlField = childField.name.value;

    const simple = getSimpleRecordsSelectionField(graphqlField);
    if (simple) {
      selection[simple.selectionKey] = true;
      continue;
    }

    const parametric = getParametricRecordsSelectionField(graphqlField);
    if (!parametric) continue;

    const fieldDef = returnType.getFields()[graphqlField];
    if (!fieldDef) continue;

    const args = getArgumentValues(fieldDef, childField, info.variableValues);
    parametric.applySelection(selection, args);
  }

  if (isSelectionEmpty(selection)) {
    throw new GraphQLError(EMPTY_RECORDS_SELECTION_MESSAGE);
  }

  return selection;
}
