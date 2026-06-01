import type { FieldNode, GraphQLResolveInfo, SelectionSetNode } from "graphql";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import {
  collectNamedSubFieldNodes,
  mergeRecordsSelections,
} from "@/omnigraph-api/lib/resolution/records-selection";

import {
  ADDRESS_PARSERS,
  ProfileAvatarParser,
  ProfileDescriptionParser,
  ProfileEmailParser,
  ProfileHeaderParser,
  ProfileWebsiteParser,
  SOCIAL_PARSERS,
} from "./parsers";

/** Collect all FieldNodes named `fieldName` within a set of parent FieldNodes. */
function collectSubFieldNodes(
  parentNodes: readonly FieldNode[],
  fieldName: string,
  info: GraphQLResolveInfo,
): FieldNode[] {
  return parentNodes.flatMap((node) => {
    if (!node.selectionSet) return [];
    return collectNamedSubFieldNodes(node.selectionSet, fieldName, info);
  });
}

/** Collect all direct child field names from an array of parent field nodes (flattening fragments). */
function collectChildFieldNames(
  nodes: readonly FieldNode[],
  info: GraphQLResolveInfo,
): Set<string> {
  const names = new Set<string>();
  for (const node of nodes) {
    if (!node.selectionSet) continue;
    for (const sel of flattenSelections(node.selectionSet, info)) {
      names.add(sel.name.value);
    }
  }
  return names;
}

function flattenSelections(selectionSet: SelectionSetNode, info: GraphQLResolveInfo): FieldNode[] {
  const fields: FieldNode[] = [];
  for (const sel of selectionSet.selections) {
    if (sel.kind === "Field") {
      if (sel.name.value !== "__typename") fields.push(sel);
    } else if (sel.kind === "InlineFragment") {
      fields.push(...flattenSelections(sel.selectionSet, info));
    } else if (sel.kind === "FragmentSpread") {
      const fragment = info.fragments[sel.name.value];
      if (fragment) fields.push(...flattenSelections(fragment.selectionSet, info));
    }
  }
  return fields;
}

/**
 * Builds the {@link ResolverRecordsSelection} required to satisfy the `profile { ... }` sub-field
 * within a `Domain.resolve` or `PrimaryNameRecord.resolve` info object.
 *
 * Returns null when `profile` is not selected or has no resolvable sub-fields.
 */
export function buildProfileSelectionFromResolveContainerInfo(
  info: GraphQLResolveInfo,
): ResolverRecordsSelection | null {
  // 1. Find all `profile` field nodes within the resolve container's selections
  const profileNodes = info.fieldNodes.flatMap((resolveField) => {
    if (!resolveField.selectionSet) return [];
    return collectNamedSubFieldNodes(resolveField.selectionSet, "profile", info);
  });

  if (profileNodes.length === 0) return null;

  let merged: ResolverRecordsSelection | null = null;

  // 2. Check for top-level profile fields (description, avatar, header, website)
  const topLevelFields = collectChildFieldNames(profileNodes, info);

  if (topLevelFields.has("description")) {
    merged = mergeRecordsSelections(merged, ProfileDescriptionParser.selection);
  }
  if (topLevelFields.has("avatar")) {
    merged = mergeRecordsSelections(merged, ProfileAvatarParser.selection);
  }
  if (topLevelFields.has("header")) {
    merged = mergeRecordsSelections(merged, ProfileHeaderParser.selection);
  }
  if (topLevelFields.has("website")) {
    merged = mergeRecordsSelections(merged, ProfileWebsiteParser.selection);
  }
  if (topLevelFields.has("email")) {
    merged = mergeRecordsSelections(merged, ProfileEmailParser.selection);
  }

  // 3. Walk socials sub-fields
  const socialsNodes = collectSubFieldNodes(profileNodes, "socials", info);
  if (socialsNodes.length > 0) {
    const socialFields = collectChildFieldNames(socialsNodes, info);
    for (const [fieldName, parser] of Object.entries(SOCIAL_PARSERS)) {
      if (socialFields.has(fieldName)) {
        merged = mergeRecordsSelections(merged, parser.selection);
      }
    }
  }

  // 4. Walk addresses sub-fields
  const addressesNodes = collectSubFieldNodes(profileNodes, "addresses", info);
  if (addressesNodes.length > 0) {
    const addressFields = collectChildFieldNames(addressesNodes, info);
    for (const [fieldName, parser] of Object.entries(ADDRESS_PARSERS)) {
      if (addressFields.has(fieldName)) {
        merged = mergeRecordsSelections(merged, parser.selection);
      }
    }
  }

  return merged;
}
