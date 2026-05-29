import { type FieldNode, type OperationDefinitionNode, parse } from "graphql";

/**
 * Parses a GraphQL document of the form `{ <fieldName> { <subselection> } }` and returns
 * the AST FieldNode for the outer field. Used in unit tests that build mock GraphQLResolveInfo
 * objects from inline query strings.
 */
export function parseFieldNode(fieldName: string, subselection: string): FieldNode {
  const document = parse(`{ ${fieldName} { ${subselection} } }`);
  const operation = document.definitions[0] as OperationDefinitionNode;
  if (operation.kind !== "OperationDefinition") throw new Error("expected operation");

  const field = operation.selectionSet.selections[0];
  if (!field || field.kind !== "Field") throw new Error("expected field");

  return field;
}
