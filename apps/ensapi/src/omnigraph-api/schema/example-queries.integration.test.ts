import { type OperationDefinitionNode, parse } from "graphql";
import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

import { request } from "@/test/integration/graphql-utils";

const namespace = ENSNamespaceIds.EnsTestEnv;

const EXAMPLE_QUERY_TEST_CASES = GRAPHQL_API_EXAMPLE_QUERIES.map((entry, i) => {
  const document = parse(entry.query);
  const operation = document.definitions.find(
    (d): d is OperationDefinitionNode => d.kind === "OperationDefinition",
  );
  const name = operation?.name?.value ?? `Query #${i}`;
  const variables = entry.variables[namespace] ?? entry.variables.default;
  return { name, query: entry.query, variables };
});

describe("Example Queries", () => {
  it.each(EXAMPLE_QUERY_TEST_CASES)("$name executes successfully", async ({ query, variables }) => {
    await expect(request(query, variables)).resolves.toBeDefined();
  });
});
