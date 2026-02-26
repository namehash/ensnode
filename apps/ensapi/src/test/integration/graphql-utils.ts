import { parse, print } from "graphql";
import type { RequestDocument, Variables } from "graphql-request";

import { client } from "./ensnode-graphql-api-client";
import { highlightGraphQL, highlightJSON } from "./highlight";

export type GraphQLConnection<NODE> = {
  edges: { cursor: string; node: NODE }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

export function flattenConnection<T>(connection?: GraphQLConnection<T>): T[] {
  return (connection?.edges ?? []).map((edge) => edge.node);
}

export async function request<T = unknown>(
  document: RequestDocument,
  variables?: Variables,
): Promise<T> {
  const query = print(parse(document.toString()));
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
