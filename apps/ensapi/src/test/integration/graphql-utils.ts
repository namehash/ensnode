import { type DocumentNode, Kind, parse, print } from "graphql";
import type { RequestDocument, Variables } from "graphql-request";
import { expect } from "vitest";

import { highlightGraphQL, highlightJSON } from "./highlight";
import { client } from "./omnigraph-api-client";

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

/**
 * A function that fetches a page given cursor pagination variables.
 * Extra variables (e.g. order, filters) should be closed over by the caller.
 */
type FetchPage<T> = (variables: {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}) => Promise<PaginatedGraphQLConnection<T>>;

/**
 * Collects all nodes by paginating forward through a connection.
 */
export async function collectForward<T>(fetchPage: FetchPage<T>, pageSize: number): Promise<T[]> {
  const all: T[] = [];
  let after: string | undefined;

  while (true) {
    const page = await fetchPage({ first: pageSize, after });
    all.push(...flattenConnection(page));

    if (!page.pageInfo.hasNextPage) break;

    const nextCursor = page.pageInfo.endCursor ?? undefined;
    expect(nextCursor, "endCursor must advance when hasNextPage is true").not.toBe(after);
    after = nextCursor;
  }

  return all;
}

/**
 * Collects all nodes by paginating backward through a connection.
 */
export async function collectBackward<T>(fetchPage: FetchPage<T>, pageSize: number): Promise<T[]> {
  const all: T[] = [];
  let before: string | undefined;

  while (true) {
    const page = await fetchPage({ last: pageSize, before });
    // prepend: last pages come in forward order within the page,
    // but we're iterating from the end of the full list
    all.unshift(...flattenConnection(page));

    if (!page.pageInfo.hasPreviousPage) break;

    const nextCursor = page.pageInfo.startCursor ?? undefined;
    expect(nextCursor, "startCursor must advance when hasPreviousPage is true").not.toBe(before);
    before = nextCursor;
  }

  return all;
}

function isDocumentNode(obj: any): obj is DocumentNode {
  return (
    typeof obj === "object" &&
    obj !== null &&
    obj.kind === Kind.DOCUMENT &&
    Array.isArray(obj.definitions)
  );
}

/**
 * Wrapper over client.request with logging for test debugging.
 */
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
