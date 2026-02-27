import { type DocumentNode, Kind, parse, print } from "graphql";
import type { RequestDocument, Variables } from "graphql-request";

import { client } from "./ensnode-graphql-api-client";
import { highlightGraphQL, highlightJSON } from "./highlight";

export type GraphQLConnection<NODE> = {
  edges: { node: NODE }[];
};

export type PaginatedGraphQLConnection<NODE> = {
  edges: { cursor: string; node: NODE }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

export function flattenConnection<T>(
  connection?: GraphQLConnection<T> | PaginatedGraphQLConnection<T>,
): T[] {
  return (connection?.edges ?? []).map((edge) => edge.node);
}

function isDocumentNode(obj: any): obj is DocumentNode {
  return (
    typeof obj === "object" &&
    obj !== null &&
    obj.kind === Kind.DOCUMENT &&
    Array.isArray(obj.definitions)
  );
}

export async function request<T = unknown>(
  document: RequestDocument,
  variables?: Variables,
): Promise<T> {
  const query = print(isDocumentNode(document) ? document : parse(document.toString()));
  const varsSection = variables
    ? `\n── Variables ──\n${highlightJSON(JSON.stringify(variables, null, 2))}`
    : "";

  try {
    const result = await client.request<T>(document, variables);
    console.log(
      `\n── Request ──\n${highlightGraphQL(query)}${varsSection}\n── Response ──\n${highlightJSON(JSON.stringify(result, null, 2))}\n`,
    );
    return result;
  } catch (error) {
    console.log(
      `\n── Request ──\n${highlightGraphQL(query)}${varsSection}\n── Error ──\n${error}\n`,
    );
    throw error;
  }
}
