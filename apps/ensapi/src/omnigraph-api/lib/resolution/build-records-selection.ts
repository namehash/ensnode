import {
  type FieldNode,
  GraphQLError,
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
  // GraphQL may pass multiple AST field nodes for the same resolver when the client splits
  // `records { ... }` across inline fragments (common on the `Domain` interface). Merge their
  // GraphQL selection lists so we don't drop subselections on fieldNodes[1], fieldNodes[2], etc.
  const graphqlSelections = info.fieldNodes.flatMap((node) => node.selectionSet?.selections ?? []);

  if (graphqlSelections.length === 0) {
    throw new GraphQLError(EMPTY_RECORDS_SELECTION_MESSAGE);
  }

  // collectFieldNodes expects a SelectionSetNode; wrap the merged GraphQL selections into one.
  const mergedGraphqlSelectionSet: SelectionSetNode = {
    kind: Kind.SELECTION_SET,
    selections: graphqlSelections,
  };

  const returnType = getNamedType(info.returnType);
  if (!isObjectType(returnType)) {
    throw new GraphQLError("Return type must be an object type.");
  }

  // Output for resolveForward(), e.g. { texts: ["description"], addresses: [60] }.
  const recordsSelection: ResolverRecordsSelection = {};

  // Walk every GraphQL child field under `records` (skipping __typename, expanding fragments).
  for (const childField of collectFieldNodes(mergedGraphqlSelectionSet, info)) {
    const graphqlField = childField.name.value;

    // Simple GraphQL fields (contenthash, pubkey, …) map 1:1 to a boolean in recordsSelection.
    const simple = getSimpleRecordsSelectionField(graphqlField);
    if (simple) {
      recordsSelection[simple.recordsSelectionKey] = true;
      continue;
    }

    // Parametric GraphQL fields (texts, addresses, …) carry args we copy into recordsSelection.
    const parametric = getParametricRecordsSelectionField(graphqlField);
    if (!parametric) continue;

    const fieldDef = returnType.getFields()[graphqlField];
    if (!fieldDef) continue;

    const args = getArgumentValues(fieldDef, childField, info.variableValues);
    parametric.applyToRecordsSelection(recordsSelection, args);
  }

  // GraphQL query selected only __typename or unknown fields — nothing to resolve.
  if (isSelectionEmpty(recordsSelection)) {
    throw new GraphQLError(EMPTY_RECORDS_SELECTION_MESSAGE);
  }

  return recordsSelection;
}
